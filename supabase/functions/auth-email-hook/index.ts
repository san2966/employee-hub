// Self-hosted auth email hook - delivers Supabase Auth emails via Resend.
// Configure Supabase Auth -> Hooks -> "Send Email Hook" to point at this
// function and set SEND_EMAIL_HOOK_SECRET in your Supabase env.
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

const SITE_NAME = "EMP CMS";
const SITE_URL = "https://emp-cms.in";

const SUBJECTS: Record<string, string> = {
  signup: `Confirm your email - ${SITE_NAME}`,
  invite: `You've been invited - ${SITE_NAME}`,
  magiclink: `Your login link - ${SITE_NAME}`,
  recovery: `Reset your password - ${SITE_NAME}`,
  email_change: `Confirm your new email - ${SITE_NAME}`,
  reauthentication: `Your verification code - ${SITE_NAME}`,
};

function renderEmail(action: string, data: Record<string, string>): string {
  const link = data.confirmation_url || data.url || "";
  const token = data.token || "";
  const heading = SUBJECTS[action] || `Notification from ${SITE_NAME}`;
  const cta = link
    ? `<p style="text-align:center;margin:32px 0">
         <a href="${link}" style="background:#1E3A8A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Open ${SITE_NAME}</a>
       </p>
       <p style="font-size:12px;color:#666">If the button does not work, paste this URL: ${link}</p>`
    : "";
  const codeBlock = token && action === "reauthentication"
    ? `<p style="font-size:14px;color:#333">Your code:</p>
       <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#1E3A8A">${token}</p>`
    : "";
  return `<!doctype html><html><body style="background:#fff;font-family:Arial,sans-serif;color:#222;padding:24px">
    <div style="max-width:560px;margin:0 auto;border:1px solid #eee;border-radius:8px;padding:24px">
      <h1 style="color:#1E3A8A;margin:0 0 16px;font-size:20px">${heading}</h1>
      <p>Hello,</p>
      <p>This message was sent automatically by <strong>${SITE_NAME}</strong>. If you did not expect it, you can ignore this email.</p>
      ${cta}
      ${codeBlock}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#888">${SITE_NAME} • <a href="${SITE_URL}" style="color:#1E3A8A">${SITE_URL}</a></p>
    </div>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
    const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      console.error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL");
      return new Response(JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rawBody = await req.text();
    let payload: any;

    // Verify Supabase Auth webhook signature when secret is configured.
    if (HOOK_SECRET) {
      try {
        const wh = new Webhook(HOOK_SECRET.replace(/^v1,whsec_/, "").replace(/^whsec_/, ""));
        payload = wh.verify(rawBody, Object.fromEntries(req.headers));
      } catch (err) {
        console.error("Webhook signature invalid:", err);
        return new Response(JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      payload = JSON.parse(rawBody);
    }

    const user = payload.user || {};
    const data = payload.email_data || payload.data || {};
    const action = data.email_action_type || data.action_type || "magiclink";
    const recipient = user.email || data.email;

    if (!recipient) {
      return new Response(JSON.stringify({ error: "Missing recipient" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const html = renderEmail(action, {
      confirmation_url: data.confirmation_url,
      url: data.redirect_to,
      token: data.token,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [recipient],
        subject: SUBJECTS[action] || `${SITE_NAME} notification`,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Resend send failed:", res.status, text);
      return new Response(JSON.stringify({ error: "Failed to send email", detail: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("auth-email-hook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
