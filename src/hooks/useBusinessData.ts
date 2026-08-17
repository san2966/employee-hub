import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/dateFormat";

/** Weeks run Friday -> Thursday (the plan resets every Friday morning). */
export const getWeekStart = (d: Date = new Date()) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (date.getDay() - 5 + 7) % 7; // 5 = Friday
  date.setDate(date.getDate() - diff);
  return date.toISOString().slice(0, 10);
};

export const dayName = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long" });

export const formatDate = (value?: string | null) =>
  value ? formatDate(value) : "—";

export const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

export const isOverdue = (task: { due_date?: string | null; status?: string }) => {
  if (!task.due_date) return false;
  if (["Completed", "Cancelled"].includes(task.status || "")) return false;
  return new Date(`${task.due_date}T23:59:59`) < new Date();
};

export const effectiveTaskStatus = (task: any) =>
  isOverdue(task) && task.status === "Pending" ? "Overdue" : task.status;

/** Generic realtime-backed collection reader for the business module. */
export function useBusinessCollection<T = any>(
  table: string,
  opts: { orderBy?: string; ascending?: boolean; enabled?: boolean } = {},
) {
  const { orderBy = "created_at", ascending = false, enabled = true } = opts;
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    const { data, error } = await (supabase as any)
      .from(table)
      .select("*")
      .order(orderBy, { ascending });
    if (!error) setRows((data ?? []) as T[]);
    setLoading(false);
  }, [table, orderBy, ascending, enabled]);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => { void refresh(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [table, refresh]);

  return { rows, loading, refresh, setRows };
}

export const uploadBusinessDoc = async (file: File, folder: string) => {
  const path = `${folder}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("business-docs").upload(path, file);
  if (error) throw error;
  const { data } = await supabase.storage.from("business-docs").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  return data?.signedUrl ?? path;
};

export const STATUS_OPTIONS = ["New", "Contacted", "Proposal Sent", "Negotiation"];
export const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
export const SOURCE_OPTIONS = ["Call", "Mail", "Walk-in", "Referral", "Website"];
export const TASK_STATUS_OPTIONS = ["Pending", "In Process", "Completed", "Overdue", "Cancelled"];