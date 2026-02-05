import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface Employee {
  id: string;
  name: string;
  paid_leave_balance: number;
  medical_leave_balance: number;
  exchange_leave_balance: number;
}

async function verifyAdminOrHRRole(supabase: ReturnType<typeof createClient>, authHeader: string): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    return false;
  }

  // Check user_roles table
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  return roleData?.role === "admin" || roleData?.role === "hr" || roleData?.role === "director";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization") || "";
    const cronSecret = req.headers.get("X-Cron-Secret");
    
    // Allow cron jobs with secret or authenticated admin/HR users
    const isCronJob = cronSecret === Deno.env.get("CRON_SECRET");
    
    if (!isCronJob) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const hasAccess = await verifyAdminOrHRRole(supabaseAuth, authHeader);
      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Admin, HR, or Director access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current year
    const currentYear = new Date().getFullYear();

    // Fetch all active employees
    const { data: employees, error: fetchError } = await supabase
      .from("employees")
      .select("id, name, paid_leave_balance, medical_leave_balance, exchange_leave_balance")
      .eq("is_active", true);

    if (fetchError) {
      throw new Error(`Failed to fetch employees: ${fetchError.message}`);
    }

    if (!employees || employees.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active employees found", resetCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auditLogs: Array<{
      employee_id: string;
      reset_year: number;
      paid_leaves_reset: number;
      medical_leaves_reset: number;
      exchange_leaves_reset: number;
    }> = [];

    // Reset leave balances for each employee
    for (const employee of employees as Employee[]) {
      // Create audit log entry with previous balances
      auditLogs.push({
        employee_id: employee.id,
        reset_year: currentYear,
        paid_leaves_reset: employee.paid_leave_balance,
        medical_leaves_reset: employee.medical_leave_balance,
        exchange_leaves_reset: employee.exchange_leave_balance,
      });

      // Update employee leave balances
      const { error: updateError } = await supabase
        .from("employees")
        .update({
          paid_leave_balance: 12,      // Reset to 12 paid leaves
          medical_leave_balance: 6,     // Reset to 6 medical leaves
          exchange_leave_balance: 0,    // Reset to 0 exchange leaves
        })
        .eq("id", employee.id);

      if (updateError) {
        console.error(`Failed to reset leaves for employee ${employee.id}:`, updateError.message);
      }
    }

    // Insert audit logs
    if (auditLogs.length > 0) {
      const { error: auditError } = await supabase
        .from("leave_reset_audit")
        .insert(auditLogs);

      if (auditError) {
        console.error("Failed to insert audit logs:", auditError.message);
      }
    }

    console.log(`Successfully reset leaves for ${employees.length} employees for year ${currentYear}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Leave balances reset for ${employees.length} employees`,
        resetCount: employees.length,
        year: currentYear,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in reset-yearly-leaves function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
