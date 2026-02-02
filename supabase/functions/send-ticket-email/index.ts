import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const data: TicketEmailRequest = await req.json();
    console.log("Received ticket email request:", data);

    const { type, ticketNumber, name, email, subject, description, problemCause, solutionProvided } = data;

    const itHeadEmail = "it.headvmcc@gmail.com";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
        `New Support Ticket: ${ticketNumber} - ${subject}`,
        `
          <h1>New Support Ticket Received</h1>
          <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Description:</strong></p>
          <p>${description}</p>
          <hr>
          <p>Please login to the IT Head portal to manage this ticket.</p>
        `
      );
      console.log("IT Head email sent:", itHeadResponse);

      // Send confirmation to user
      const userResponse = await sendEmail(
        [email],
        `Ticket Received: ${ticketNumber}`,
        `
          <h1>Your Support Request Has Been Received</h1>
          <p>Dear ${name},</p>
          <p>Thank you for contacting us. Your support ticket has been created.</p>
          <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p><strong>Subject:</strong> ${subject}</p>
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
        `Ticket Resolved: ${ticketNumber}`,
        `
          <h1>Your Support Ticket Has Been Resolved</h1>
          <p>Dear ${name},</p>
          <p>Your support ticket has been resolved.</p>
          <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <h3>Problem Cause:</h3>
          <p>${problemCause || "Not specified"}</p>
          <h3>Solution Provided:</h3>
          <p>${solutionProvided || "Not specified"}</p>
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
  } catch (error: any) {
    console.error("Error in send-ticket-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
