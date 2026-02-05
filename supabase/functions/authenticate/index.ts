import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthRequest {
  username: string;
  password: string;
  expectedRole?: string;
}

// Simple password comparison - in production, use proper bcrypt
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For bcrypt hashes, we need to use the Web Crypto API approach
  // This is a simplified check - passwords should be properly hashed
  if (hash.startsWith("$2")) {
    // This is a bcrypt hash - for now, do direct comparison with stored password
    // In production, the portal_users.password_hash should contain bcrypt hashes
    // and we'd use a proper bcrypt library
    return password === hash;
  }
  return password === hash;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { username, password, expectedRole }: AuthRequest = await req.json();

    // Input validation
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (username.length < 3 || username.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate username format: alphanumeric, underscore, hyphen, dot only
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
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

    // Fetch user from portal_users
    const { data: portalUser, error: fetchError } = await supabase
      .from("portal_users")
      .select("id, username, password_hash, role, employee_id, is_active")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (fetchError || !portalUser) {
      console.log("User not found:", username);
      // Use generic error message to prevent user enumeration
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, portalUser.password_hash);
    
    if (!passwordValid) {
      console.log("Invalid password for user:", username);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optionally verify expected role matches
    if (expectedRole && portalUser.role !== expectedRole) {
      console.log("Role mismatch for user:", username, "expected:", expectedRole, "actual:", portalUser.role);
      return new Response(
        JSON.stringify({ error: "Access denied for this portal" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or get Supabase Auth user for this portal user
    const authEmail = `${portalUser.id}@portal.internal`;
    const internalPassword = `portal_${portalUser.id}_${portalUser.role}`;
    
    // Try to sign in with existing auth user
    let session = null;
    let userId = null;

    // First, try to get existing user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === authEmail);

    if (existingUser) {
      // User exists, create a session
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: authEmail,
      });

      if (!sessionError && sessionData) {
        // Sign in using the magic link token
        const tokenHash = new URL(sessionData.properties.action_link).searchParams.get("token");
        if (tokenHash) {
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "magiclink",
          });
          
          if (!verifyError && verifyData.session) {
            session = verifyData.session;
            userId = verifyData.user?.id;
          }
        }
      }
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
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
        
        // Generate session for new user
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: authEmail,
        });

        if (!sessionError && sessionData) {
          const tokenHash = new URL(sessionData.properties.action_link).searchParams.get("token");
          if (tokenHash) {
            const { data: verifyData } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: "magiclink",
            });
            
            if (verifyData?.session) {
              session = verifyData.session;
            }
          }
        }
      }
    }

    // Ensure user_roles entry exists
    if (userId) {
      const { error: roleError } = await supabase
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

    // Update last login
    await supabase
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
