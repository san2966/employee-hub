import { supabase } from "@/integrations/supabase/client";

export const PAYMENT_RECEIPT_BUCKET = "employee-payments";

export async function uploadPaymentReceipt(file: File, employeeId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${employeeId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PAYMENT_RECEIPT_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function openPaymentReceipt(pathOrUrl: string) {
  if (!pathOrUrl) return;
  // Backward-compat: if it's already a full URL (legacy blob/http), open directly.
  if (pathOrUrl.startsWith("http") || pathOrUrl.startsWith("blob:")) {
    window.open(pathOrUrl, "_blank", "noopener");
    return;
  }
  const { data, error } = await supabase.storage
    .from(PAYMENT_RECEIPT_BUCKET)
    .createSignedUrl(pathOrUrl, 60 * 10);
  if (error || !data?.signedUrl) {
    console.error("Failed to sign receipt URL", error);
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener");
}