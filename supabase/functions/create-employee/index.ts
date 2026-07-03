import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateEmployeeRequest {
  name: string;
  photo?: string;
  address: string;
  phone: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  bloodGroup: string;
  fatherName: string;
  fatherMobile?: string;
  motherName: string;
  motherMobile?: string;
  highestEducation: string;
  degreeName: string;
  specialization?: string;
  schoolCollege: string;
  boardUniversity: string;
  yearOfPassing: string;
  passedOrAppearing: "passed" | "appearing";
  marksPercentage?: string;
  certifications?: string;
  isFresher: boolean;
  organizationName?: string;
  postHeld?: string;
  jobPeriodFrom?: string;
  jobPeriodTo?: string;
  reasonOfLeaving?: string;
  previousCTC?: string;
  totalExperience?: string;
  dateOfJoining: string;
  designation: string;
  additionalCharge?: string;
  responsibilities: string;
  username: string;
  password: string;
}

const usernameRegex = /^[a-zA-Z0-9._@-]+$/;

const toText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const toNullableText = (value: unknown): string | null => {
  const text = toText(value);
  return text.length > 0 ? text : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";

    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRows, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(1);

    if (roleError) {
      console.error("Error fetching role:", roleError);
      return new Response(JSON.stringify({ error: "Failed to verify access" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requesterRole = roleRows?.[0]?.role;
    if (requesterRole !== "hr" && requesterRole !== "admin") {
      return new Response(JSON.stringify({ error: "Only HR/Admin can create employees" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: CreateEmployeeRequest = await req.json();

    const name = toText(payload.name);
    const address = toText(payload.address);
    const phone = toText(payload.phone);
    const email = toText(payload.email);
    const username = toText(payload.username);
    const password = toText(payload.password);
    const dateOfJoining = toText(payload.dateOfJoining);
    const designation = toText(payload.designation);

    if (!name || !address || !phone || !email || !username || !password || !dateOfJoining || !designation) {
      return new Response(JSON.stringify({ error: "Missing required employee fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!usernameRegex.test(username) || username.length < 3 || username.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid username format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6 || password.length > 100) {
      return new Response(JSON.stringify({ error: "Password must be 6-100 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email.includes("@") || email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [employeeUsernameCheck, employeeEmailCheck, portalUsernameCheck] = await Promise.all([
      adminClient.from("employees").select("id").ilike("username", username).limit(1),
      adminClient.from("employees").select("id").ilike("email", email).limit(1),
      adminClient.from("portal_users").select("id").ilike("username", username).limit(1),
    ]);

    if (employeeUsernameCheck.error || employeeEmailCheck.error || portalUsernameCheck.error) {
      console.error("Error checking duplicates:", {
        employeeUsernameCheck: employeeUsernameCheck.error,
        employeeEmailCheck: employeeEmailCheck.error,
        portalUsernameCheck: portalUsernameCheck.error,
      });
      return new Response(JSON.stringify({ error: "Failed to validate employee data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((employeeUsernameCheck.data?.length || 0) > 0 || (portalUsernameCheck.data?.length || 0) > 0) {
      return new Response(JSON.stringify({ error: "Username already exists" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((employeeEmailCheck.data?.length || 0) > 0) {
      return new Response(JSON.stringify({ error: "Email already exists" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use pgcrypto via SQL to hash the password (bcrypt Worker not available in edge runtime)
    const { data: hashResult, error: hashError } = await adminClient.rpc("hash_password", { raw_password: password });

    if (hashError || !hashResult) {
      console.error("Error hashing password:", hashError);
      return new Response(JSON.stringify({ error: "Failed to process credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passwordHash = hashResult;

    const { data: employeeRow, error: employeeError } = await adminClient
      .from("employees")
      .insert({
        name,
        photo: toNullableText(payload.photo),
        address,
        phone,
        email,
        aadhaar_number: toText(payload.aadhaarNumber),
        pan_number: toText(payload.panNumber),
        blood_group: toText(payload.bloodGroup),
        father_name: toText(payload.fatherName),
        father_mobile: toNullableText(payload.fatherMobile),
        mother_name: toText(payload.motherName),
        mother_mobile: toNullableText(payload.motherMobile),
        highest_education: toText(payload.highestEducation),
        degree_name: toText(payload.degreeName),
        specialization: toNullableText(payload.specialization),
        school_college: toText(payload.schoolCollege),
        board_university: toText(payload.boardUniversity),
        year_of_passing: toText(payload.yearOfPassing),
        passed_or_appearing: payload.passedOrAppearing === "appearing" ? "appearing" : "passed",
        marks_percentage: toNullableText(payload.marksPercentage),
        certifications: toNullableText(payload.certifications),
        is_fresher: payload.isFresher,
        organization_name: toNullableText(payload.organizationName),
        post_held: toNullableText(payload.postHeld),
        job_period_from: toNullableText(payload.jobPeriodFrom),
        job_period_to: toNullableText(payload.jobPeriodTo),
        reason_of_leaving: toNullableText(payload.reasonOfLeaving),
        previous_ctc: toNullableText(payload.previousCTC),
        total_experience: toNullableText(payload.totalExperience),
        date_of_joining: dateOfJoining,
        designation,
        additional_charge: toNullableText(payload.additionalCharge),
        responsibilities: toText(payload.responsibilities),
        username,
        is_active: true,
        paid_leave_balance: 6,
        medical_leave_balance: 6,
        exchange_leave_balance: 0,
      })
      .select("id, name, username, created_at, paid_leave_balance, medical_leave_balance, exchange_leave_balance")
      .single();

    if (employeeError || !employeeRow) {
      console.error("Error inserting employee:", employeeError);
      return new Response(JSON.stringify({ error: "Failed to create employee" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: portalUserError } = await adminClient.from("portal_users").insert({
      username,
      password_hash: passwordHash,
      role: "employee",
      employee_id: employeeRow.id,
      is_active: true,
    });

    if (portalUserError) {
      console.error("Error creating portal user:", portalUserError);
      await adminClient.from("employees").delete().eq("id", employeeRow.id);

      return new Response(JSON.stringify({ error: "Failed to create employee credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        employee: employeeRow,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in create-employee:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
