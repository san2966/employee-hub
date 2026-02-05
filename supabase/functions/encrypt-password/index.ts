import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM encryption for IT passwords
const ENCRYPTION_KEY = Deno.env.get("IT_PASSWORD_ENCRYPTION_KEY") || "default-key-change-in-production-32ch";

async function getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ENCRYPTION_KEY.padEnd(32, "0").substring(0, 32)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("it-password-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPassword(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV and ciphertext, then base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptPassword(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

async function verifyITHeadRole(supabase: ReturnType<typeof createClient>, authHeader: string): Promise<boolean> {
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

  return roleData?.role === "ithead" || roleData?.role === "director";
}

interface PasswordRequest {
  action: "encrypt" | "decrypt" | "save" | "get" | "delete";
  password?: string;
  portal?: string;
  username?: string;
  id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization") || "";
    
    // Create client for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Verify IT Head or Director role
    const hasAccess = await verifyITHeadRole(supabaseAuth, authHeader);
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - IT Head or Director access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: PasswordRequest = await req.json();
    const { action, password, portal, username, id } = body;

    switch (action) {
      case "encrypt": {
        if (!password) {
          return new Response(
            JSON.stringify({ error: "Password is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const encrypted = await encryptPassword(password);
        return new Response(
          JSON.stringify({ encrypted }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "decrypt": {
        if (!password) {
          return new Response(
            JSON.stringify({ error: "Encrypted password is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        try {
          const decrypted = await decryptPassword(password);
          return new Response(
            JSON.stringify({ decrypted }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch {
          return new Response(
            JSON.stringify({ error: "Failed to decrypt - password may be in old format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "save": {
        if (!portal || !username || !password) {
          return new Response(
            JSON.stringify({ error: "Portal, username, and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const encrypted = await encryptPassword(password);
        
        const { data, error } = await supabase
          .from("it_passwords")
          .insert({
            portal,
            username,
            encrypted_password: encrypted,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({ success: true, id: data.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get": {
        const { data, error } = await supabase
          .from("it_passwords")
          .select("id, portal, username, encrypted_password, created_at, updated_at")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        // Decrypt passwords before returning
        const decryptedData = await Promise.all(
          (data || []).map(async (item) => {
            try {
              const decrypted = await decryptPassword(item.encrypted_password);
              return { ...item, password: decrypted };
            } catch {
              // If decryption fails, return as-is (legacy data)
              return { ...item, password: item.encrypted_password };
            }
          })
        );

        return new Response(
          JSON.stringify({ passwords: decryptedData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Password ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("it_passwords")
          .delete()
          .eq("id", id);

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in encrypt-password function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
