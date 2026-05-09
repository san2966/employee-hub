// Self-hosted queue dispatcher: drains pgmq email queues and sends via Resend.
// Schedule with pg_cron every minute, or invoke manually with the service-role key.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_RETRIES = 5;
const BATCH_SIZE = 25;

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

  if (!SUPABASE_URL || !SERVICE_ROLE || !RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return new Response(JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }

  // Require service-role bearer token.
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ") || auth.slice(7).trim() !== SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  let totalSent = 0;
  let totalFailed = 0;

  for (const queue of ["auth_emails", "transactional_emails"]) {
    const { data: messages, error } = await supabase.rpc("read_email_batch", {
      queue_name: queue,
      batch_size: BATCH_SIZE,
      vt: 30,
    });
    if (error) { console.error("read_email_batch failed:", queue, error); continue; }
    if (!messages?.length) continue;

    for (const msg of messages as any[]) {
      const p = msg.message || {};
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: p.from || RESEND_FROM_EMAIL,
            to: Array.isArray(p.to) ? p.to : [p.to],
            subject: p.subject,
            html: p.html,
            text: p.text,
          }),
        });
        if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);

        await supabase.from("email_send_log").insert({
          message_id: p.message_id,
          template_name: p.label || queue,
          recipient_email: Array.isArray(p.to) ? p.to[0] : p.to,
          status: "sent",
        });
        await supabase.rpc("delete_email", { queue_name: queue, message_id: msg.msg_id });
        totalSent++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("send failed:", queue, msg.msg_id, errMsg);
        await supabase.from("email_send_log").insert({
          message_id: p.message_id,
          template_name: p.label || queue,
          recipient_email: Array.isArray(p.to) ? p.to[0] : p.to,
          status: "failed",
          error_message: errMsg.slice(0, 1000),
        });
        if ((msg.read_ct || 0) >= MAX_RETRIES) {
          await supabase.rpc("move_to_dlq", {
            source_queue: queue,
            dlq_name: `${queue}_dlq`,
            message_id: msg.msg_id,
            payload: p,
          });
        }
        totalFailed++;
      }
    }
  }

  return new Response(JSON.stringify({ sent: totalSent, failed: totalFailed }),
    { headers: { "Content-Type": "application/json" } });
});
