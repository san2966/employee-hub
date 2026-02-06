import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthRequest {
  username: string;
  password: string;
  expectedRole?: string;
}

// Rate limiting - in-memory store (resets on function cold start)
const rateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // 5 attempts per window
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

function resetRateLimit(key: string): void {
  rateLimiter.delete(key);
}

// Verify password using database crypt() function for pgcrypto compatibility
async function verifyPasswordWithDb(
  supabase: ReturnType<typeof createClient>,
  password: string, 
  hash: string
): Promise<boolean> {
  try {
    // Use database crypt function to verify password
    const { data, error } = await supabase.rpc('verify_password', {
      input_password: password,
      stored_hash: hash
    });
    
    if (error) {
      console.error("Password verification error:", error);
      // Fallback to Deno bcrypt for legacy hashes
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

// Hash a password for storage (exported for user creation/password change)
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password);
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

    // Rate limiting check - use username as key to prevent brute force per user
    const rateLimitKey = `auth:${username.toLowerCase()}`;
    if (!checkRateLimit(rateLimitKey)) {
      console.log("Rate limit exceeded for user:", username);
      return new Response(
        JSON.stringify({ error: "Too many login attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Verify password using bcrypt
    const passwordValid = await verifyPassword(password, portalUser.password_hash);
    
    if (!passwordValid) {
      console.log("Invalid password for user:", username);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Successful login - reset rate limit
    resetRateLimit(rateLimitKey);

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
