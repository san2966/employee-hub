import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// No credentials are hardcoded. Bootstrapping requires the BUSINESS_SETUP_TOKEN secret
// and an explicit email/password supplied by the operator running the setup call.


const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const backendUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!backendUrl || !serviceRoleKey) {
    return json({ error: "Business administration service is not configured" }, 500);
  }

  const admin = createClient(
    backendUrl,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    // ---------- Protected: one-time seeding of the Business Head account ----------
    if (action === "seed_head") {
      const setupToken = Deno.env.get("BUSINESS_SETUP_TOKEN");
      const providedToken = req.headers.get("x-setup-token") ?? "";
      if (!setupToken || providedToken !== setupToken) {
        return json({ error: "Unauthorized" }, 401);
      }

      const headEmail = String(body.email || "").trim().toLowerCase();
      const headPassword = String(body.password || "");
      if (!headEmail || headPassword.length < 12) {
        return json({ error: "A head email and a password of at least 12 characters are required" }, 400);
      }

      const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) return json({ error: listError.message }, 400);
      let user = list?.users?.find((u) => u.email === headEmail) ?? null;
      let seeded = false;

      if (!user) {
        const { data: created, error } = await admin.auth.admin.createUser({
          email: headEmail,
          password: headPassword,
          email_confirm: true,
          user_metadata: { business_designation: "business_head" },
        });
        if (error) return json({ error: error.message }, 400);
        user = created.user;
        seeded = true;
      } else {
        const { error } = await admin.auth.admin.updateUserById(user.id, { password: headPassword });
        if (error) return json({ error: error.message }, 400);
      }

      if (!user) return json({ error: "Business Head user could not be created" }, 500);

      const { error: profileError } = await admin.from("business_profiles").upsert({
        user_id: user.id,
        name: "Business Head",
        email: headEmail,
        designation: "business_head",
        is_active: true,
        must_change_password: true,
      }, { onConflict: "email" });
      if (profileError) return json({ error: profileError.message }, 400);
      return json({ success: true, seeded });
    }


    // ---------- Authenticated business-head actions ----------
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

    // Repair a stale profile mapping for the signed-in user only (same verified email).
    if (action === "repair_self_profile") {
      const email = (userData.user.email ?? "").toLowerCase();
      if (!email) return json({ error: "Unauthorized" }, 401);
      const { error } = await admin
        .from("business_profiles")
        .update({ user_id: userData.user.id })
        .eq("email", email);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    const { data: caller } = await admin
      .from("business_profiles")
      .select("id, designation, is_active")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!caller || !caller.is_active || caller.designation !== "business_head") {
      return json({ error: "Only the Business Head can manage accounts" }, 403);
    }

    if (action === "create_employee") {
      const { name, email, password, phone, designation, area_id } = body;
      if (!name || !email || !password || !designation) {
        return json({ error: "Name, email, temporary password and designation are required" }, 400);
      }
      if (String(password).length < 6) {
        return json({ error: "Temporary password must be at least 6 characters" }, 400);
      }
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: String(email).trim().toLowerCase(),
        password: String(password),
        email_confirm: true,
        user_metadata: { business_designation: designation },
      });
      if (createError) return json({ error: createError.message }, 400);

      const { error: profileError } = await admin.from("business_profiles").insert({
        user_id: created.user.id,
        name,
        email: String(email).trim().toLowerCase(),
        phone: phone || null,
        designation,
        area_id: area_id || null,
        is_active: true,
        must_change_password: true,
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: profileError.message }, 400);
      }
      return json({ success: true });
    }

    if (action === "update_employee") {
      const { profile_id, name, phone, designation, area_id, password } = body;
      if (!profile_id) return json({ error: "Missing employee" }, 400);

      const { data: profile } = await admin
        .from("business_profiles")
        .select("user_id")
        .eq("id", profile_id)
        .maybeSingle();
      if (!profile) return json({ error: "Employee not found" }, 404);

      const { error } = await admin
        .from("business_profiles")
        .update({
          name,
          phone: phone || null,
          designation,
          area_id: area_id || null,
          ...(password ? { must_change_password: true } : {}),
        })
        .eq("id", profile_id);
      if (error) return json({ error: error.message }, 400);

      if (password) {
        await admin.auth.admin.updateUserById(profile.user_id, { password: String(password) });
      }
      return json({ success: true });
    }

    if (action === "deactivate_employee") {
      const { profile_id } = body;
      const { data: profile } = await admin
        .from("business_profiles")
        .select("user_id, designation")
        .eq("id", profile_id)
        .maybeSingle();
      if (!profile) return json({ error: "Employee not found" }, 404);
      if (profile.designation === "business_head") {
        return json({ error: "The Business Head account cannot be deactivated" }, 400);
      }
      await admin.from("business_profiles").update({ is_active: false }).eq("id", profile_id);
      await admin.auth.admin.updateUserById(profile.user_id, { ban_duration: "876000h" });
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("business-admin error", error);
    return json({ error: "Unexpected error. Please try again." }, 500);
  }
});