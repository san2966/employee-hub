import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TicketEmailRequest {
  type: "new" | "resolved";
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  description?: string;
  problemCause?: string;
  solutionProvided?: string;
}

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute per email
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(email);
  
  if (!record || now > record.resetTime) {
    rateLimiter.set(email, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
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

  return roleData?.role === "ithead" || roleData?.role === "admin" || roleData?.role === "director";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const data: TicketEmailRequest = await req.json();
    console.log("Received ticket email request:", data);

    const { type, ticketNumber, name, email, subject, description, problemCause, solutionProvided } = data;

    // Validate email format
    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(email)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For "resolved" type, verify IT Head/Admin role
    if (type === "resolved") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authHeader = req.headers.get("Authorization") || "";
      
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const hasAccess = await verifyITHeadRole(supabaseAuth, authHeader);
      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - IT Head or Admin access required" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const itHeadEmail = "it.headvmcc@gmail.com";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // HTML escape function to prevent XSS in emails
    const escapeHtml = (text: string): string => {
      const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
    };

    // Sanitize all user inputs
    const safeTicketNumber = escapeHtml(ticketNumber || '');
    const safeName = escapeHtml(name || '');
    const safeEmail = escapeHtml(email || '');
    const safeSubject = escapeHtml(subject || '');
    const safeDescription = escapeHtml(description || '');
    const safeProblemCause = escapeHtml(problemCause || 'Not specified');
    const safeSolutionProvided = escapeHtml(solutionProvided || 'Not specified');

    const sendEmail = async (to: string[], emailSubject: string, html: string) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Support <onboarding@resend.dev>",
          to,
          subject: emailSubject,
          html,
        }),
      });
      return response.json();
    };

    if (type === "new") {
      // Send to IT Head
      const itHeadResponse = await sendEmail(
        [itHeadEmail],
        `New Support Ticket: ${safeTicketNumber} - ${safeSubject}`,
        `
          <h1>New Support Ticket Received</h1>
          <p><strong>Ticket Number:</strong> ${safeTicketNumber}</p>
          <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Description:</strong></p>
          <p>${safeDescription}</p>
          <hr>
          <p>Please login to the IT Head portal to manage this ticket.</p>
        `
      );
      console.log("IT Head email sent:", itHeadResponse);

      // Send confirmation to user
      const userResponse = await sendEmail(
        [email],
        `Ticket Received: ${safeTicketNumber}`,
        `
          <h1>Your Support Request Has Been Received</h1>
          <p>Dear ${safeName},</p>
          <p>Thank you for contacting us. Your support ticket has been created.</p>
          <p><strong>Ticket Number:</strong> ${safeTicketNumber}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p>Our IT team will review your request and get back to you soon.</p>
          <hr>
          <p>Best regards,<br>IT Support Team</p>
        `
      );
      console.log("User confirmation email sent:", userResponse);

    } else if (type === "resolved") {
      // Send resolution notification to user
      const userResponse = await sendEmail(
        [email],
        `Ticket Resolved: ${safeTicketNumber}`,
        `
          <h1>Your Support Ticket Has Been Resolved</h1>
          <p>Dear ${safeName},</p>
          <p>Your support ticket has been resolved.</p>
          <p><strong>Ticket Number:</strong> ${safeTicketNumber}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <h3>Problem Cause:</h3>
          <p>${safeProblemCause}</p>
          <h3>Solution Provided:</h3>
          <p>${safeSolutionProvided}</p>
          <hr>
          <p>If you have any further questions, please submit a new ticket.</p>
          <p>Best regards,<br>IT Support Team</p>
        `
      );
      console.log("Resolution email sent:", userResponse);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-ticket-email function:", errorMessage);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
