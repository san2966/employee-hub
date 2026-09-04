import { supabase } from "@/integrations/supabase/client";

export type DeviceType = "phone" | "tablet" | "laptop" | "desktop";

export interface DeviceHistoryRecord {
  id: string;
  account_key: string;
  account_label: string | null;
  device_name: string | null;
  device_type: string;
  ip_address: string | null;
  browser: string | null;
  is_application: boolean;
  status: string;
  login_time: string;
}

const MAX_RECORDS = 10;

/** Detect the device type from the user agent / platform hints. */
export const detectDeviceType = (): DeviceType => {
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|iPhone|Android|Windows Phone/i.test(ua)) return "phone";
  const touch = typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0;
  if (/Mac|Macintosh/i.test(ua) || touch) return "laptop";
  return "desktop";
};

/** Human readable device / hardware name from available browser hardware info. */
export const detectDeviceName = (): string => {
  const ua = navigator.userAgent || "";
  const platform = (navigator as any).userAgentData?.platform as string | undefined;
  let os = platform || "Unknown Device";
  if (!platform) {
    if (/Windows NT 10/i.test(ua)) os = "Windows PC";
    else if (/Windows/i.test(ua)) os = "Windows";
    else if (/iPhone/i.test(ua)) os = "iPhone";
    else if (/iPad/i.test(ua)) os = "iPad";
    else if (/Android/i.test(ua)) os = "Android Device";
    else if (/Mac OS X/i.test(ua)) os = "Mac";
    else if (/Linux/i.test(ua)) os = "Linux";
  }
  const cores = navigator.hardwareConcurrency;
  return cores ? `${os} (${cores}-core)` : os;
};

/** Browser name, or "Application" when running inside an installed/standalone app. */
export const detectBrowser = (): { name: string; isApplication: boolean } => {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
  if (standalone) return { name: "Application", isApplication: true };

  const ua = navigator.userAgent || "";
  let name = "Unknown Browser";
  if (/Edg\//i.test(ua)) name = "Microsoft Edge";
  else if (/OPR\/|Opera/i.test(ua)) name = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) name = "Google Chrome";
  else if (/Firefox\//i.test(ua)) name = "Mozilla Firefox";
  else if (/Safari\//i.test(ua)) name = "Safari";
  return { name, isApplication: false };
};

/** Best-effort public IP lookup (network info). Never throws. */
export const detectIpAddress = async (): Promise<string | null> => {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.ip ?? null;
  } catch {
    return null;
  }
};

/**
 * Record a login attempt for an account and keep only the latest 10 records.
 * Never throws — logging must not block a login.
 */
export const recordLoginAttempt = async (
  accountKey: string,
  status: "successful" | "failed",
  accountLabel?: string
): Promise<void> => {
  try {
    if (!accountKey) return;
    const key = accountKey.trim().toLowerCase();
    const browser = detectBrowser();
    const ip = await detectIpAddress();

    await (supabase as any).from("device_login_history").insert({
      account_key: key,
      account_label: accountLabel ?? null,
      device_name: detectDeviceName(),
      device_type: detectDeviceType(),
      ip_address: ip,
      browser: browser.name,
      is_application: browser.isApplication,
      status,
      login_time: new Date().toISOString(),
    });

    // Prune: keep only the latest 10 records for this account.
    const { data } = await (supabase as any)
      .from("device_login_history")
      .select("id")
      .eq("account_key", key)
      .order("login_time", { ascending: false });

    const rows = (data as { id: string }[] | null) ?? [];
    if (rows.length > MAX_RECORDS) {
      const stale = rows.slice(MAX_RECORDS).map((r) => r.id);
      await (supabase as any).from("device_login_history").delete().in("id", stale);
    }
  } catch {
    /* logging is best effort */
  }
};

export const fetchDeviceHistory = async (accountKey: string): Promise<DeviceHistoryRecord[]> => {
  if (!accountKey) return [];
  const { data } = await (supabase as any)
    .from("device_login_history")
    .select("*")
    .eq("account_key", accountKey.trim().toLowerCase())
    .order("login_time", { ascending: false })
    .limit(MAX_RECORDS);
  return (data as DeviceHistoryRecord[] | null) ?? [];
};

/** Identify the currently signed-in portal account from session storage. */
export const getCurrentAccountKey = (): string => {
  const read = (k: string) => {
    try {
      const raw = sessionStorage.getItem(k);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const candidates: Array<[string, string]> = [
    ["employee_session", "employee"],
    ["directorSession", "director"],
    ["hrSession", "hr"],
    ["accountsSession", "accounts"],
    ["adminSession", "admin"],
    ["itHeadSession", "ithead"],
    ["tenderSession", "tender"],
    ["purchaseSession", "purchase"],
    ["operationsSession", "operations"],
    ["businessSession", "business"],
  ];

  for (const [storageKey, role] of candidates) {
    const data = read(storageKey);
    if (data) {
      const id = data.username || data.email || data.employeeId || data.name || role;
      return `${role}:${String(id).toLowerCase()}`;
    }
  }

  const authUser = read("authUser");
  if (authUser) {
    return `${authUser.role || "user"}:${String(authUser.username || authUser.email || "").toLowerCase()}`;
  }
  return "";
};
