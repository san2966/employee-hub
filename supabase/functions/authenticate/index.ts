import { createClient } from "npm:@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AuthRequest {
  username: string;
  password: string;
  expectedRole?: string;
}

// Rate limiting - in-memory store (resets on function cold start)
const rateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 15 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(key);
  if (!record || now > record.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

function resetRateLimit(key: string): void {
  rateLimiter.delete(key);
}

async function verifyPasswordWithDb(
  supabase: any,
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('verify_password', {
      input_password: password,
      stored_hash: hash
    });
    if (error) {
      console.error("Password verification error:", error);
      if (hash.startsWith("$2")) {
        return await bcrypt.compare(password, hash);
      }
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Admin client - never changes auth state, always uses service_role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { username, password, expectedRole }: AuthRequest = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (username.length < 2 || username.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9._@-]+$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6 || password.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rateLimitKey = `auth:${username.toLowerCase()}`;
    if (!checkRateLimit(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: "Too many login attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user from portal_users using admin client (bypasses RLS)
    let { data: portalUser, error: fetchError } = await adminClient
      .from("portal_users")
      .select("id, username, password_hash, role, employee_id, is_active")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (fetchError || !portalUser) {
      console.log("User not found:", username);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const passwordValid = await verifyPasswordWithDb(adminClient, password, portalUser.password_hash);
    if (!passwordValid) {
      console.log("Invalid password for user:", username);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    resetRateLimit(rateLimitKey);

    if (expectedRole && portalUser.role !== expectedRole) {
      console.log("Role mismatch for user:", username, "expected:", expectedRole, "actual:", portalUser.role);
      return new Response(
        JSON.stringify({ error: "Access denied for this portal" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (portalUser.role === "employee") {
      const { data: linkedEmployee } = portalUser.employee_id
        ? await adminClient.from("employees").select("id").eq("id", portalUser.employee_id).maybeSingle()
        : { data: null };

      if (!linkedEmployee) {
        let { data: employeeRow } = await adminClient
          .from("employees")
          .select("id")
          .or(`username.ilike.${portalUser.username},email.ilike.${portalUser.username}`)
          .maybeSingle();

        if (!employeeRow) {
          const fallbackName = portalUser.username.includes("@") ? portalUser.username.split("@")[0] : portalUser.username;
          const fallbackEmail = portalUser.username.includes("@") ? portalUser.username : `${portalUser.username}@portal.local`;
          const { data: createdEmployee, error: createEmployeeError } = await adminClient
            .from("employees")
            .insert({
              name: fallbackName,
              address: "Pending HR update",
              phone: "Pending",
              email: fallbackEmail,
              aadhaar_number: "Pending",
              pan_number: "Pending",
              blood_group: "Pending",
              father_name: "Pending",
              mother_name: "Pending",
              highest_education: "Pending",
              degree_name: "Pending",
              school_college: "Pending",
              board_university: "Pending",
              year_of_passing: "Pending",
              passed_or_appearing: "passed",
              date_of_joining: new Date().toISOString().slice(0, 10),
              designation: "Employee",
              responsibilities: "Pending HR update",
              username: portalUser.username,
              is_active: true,
              paid_leave_balance: 12,
              medical_leave_balance: 6,
              exchange_leave_balance: 0,
            })
            .select("id")
            .single();

          if (createEmployeeError) {
            console.error("Employee link repair failed:", createEmployeeError);
          } else {
            employeeRow = createdEmployee;
          }
        }

        if (employeeRow?.id) {
          await adminClient.from("portal_users").update({ employee_id: employeeRow.id }).eq("id", portalUser.id);
          portalUser = { ...portalUser, employee_id: employeeRow.id };
        }
      }
    }

    // Create or get Supabase Auth user
    const authEmail = `${portalUser.id}@portal.internal`;
    const internalPassword = `portal_${portalUser.id}_${portalUser.role}`;
    let session = null;
    let userId = null;

    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === authEmail);

    if (existingUser) {
      userId = existingUser.id;
      // Ensure the internal password is current (in case it changed across deploys)
      await adminClient.auth.admin.updateUserById(existingUser.id, {
        password: internalPassword,
        email_confirm: true,
        user_metadata: {
          portal_user_id: portalUser.id,
          role: portalUser.role,
          employee_id: portalUser.employee_id,
        },
      });
      const signInClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: signInData, error: signInError } = await signInClient.auth.signInWithPassword({
        email: authEmail,
        password: internalPassword,
      });
      if (signInError) {
        console.error("signInWithPassword (existing) failed:", signInError);
      } else if (signInData.session) {
        session = signInData.session;
      }
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: authEmail,
        password: internalPassword,
        email_confirm: true,
        user_metadata: {
          portal_user_id: portalUser.id,
          role: portalUser.role,
          employee_id: portalUser.employee_id,
        },
      });

      if (!createError && newUser.user) {
        userId = newUser.user.id;
        const signInClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: signInData, error: signInError } = await signInClient.auth.signInWithPassword({
          email: authEmail,
          password: internalPassword,
        });
        if (signInError) {
          console.error("signInWithPassword (new) failed:", signInError);
        } else if (signInData.session) {
          session = signInData.session;
        }
      } else if (createError) {
        console.error("createUser failed:", createError);
      }
    }

    // Ensure user_roles entry exists using admin client (bypasses RLS)
    if (userId) {
      const { error: roleError } = await adminClient
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: portalUser.role,
          employee_id: portalUser.employee_id,
        }, {
          onConflict: "user_id",
        });

      if (roleError) {
        console.error("Error upserting user role:", roleError);
      }
    }

    // Update last login using admin client
    await adminClient
      .from("portal_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", portalUser.id);

    console.log("Authentication successful for user:", username, "role:", portalUser.role);

    return new Response(
      JSON.stringify({
        success: true,
        session: session ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        } : null,
        user: {
          id: portalUser.id,
          username: portalUser.username,
          role: portalUser.role,
          employee_id: portalUser.employee_id,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in authenticate function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
