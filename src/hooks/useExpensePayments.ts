import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { monthLabel } from "@/lib/dateFormat";

export const EXPENSE_TYPES = ["Petrol", "Lunch", "Hotel", "Toll", "Travel", "Stationary", "Other"] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export const HR_STATUSES = ["Pending", "Approved", "Rejected", "Requested Changes"] as const;
export const ACCOUNTS_STATUSES = ["Pending", "Paid", "On Hold"] as const;

export interface ExpensePayment {
  id: string;
  employee_id: string;
  employee_name: string | null;
  /** Resolved display name (never an email) */
  display_name?: string;
  month: number | null;
  year: number | null;
  sheet_url: string | null;
  date: string | null;
  amount: number;
  expense_type: string | null;
  purpose: string | null;
  description: string | null;
  from_location: string | null;
  to_location: string | null;
  payment_mode: string | null;
  receipt_url: string | null;
  hr_status: string | null;
  accounts_status: string | null;
  created_at: string | null;
}

export interface ExpenseSheetInput {
  employee_id: string;
  employee_name?: string | null;
  month: number;
  year: number;
  sheet_url?: string | null;
}

const prettifyName = (value?: string | null) => {
  if (!value) return "";
  if (!value.includes("@")) return value;
  return value
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Shared access to public.employee_payments for Employee, HR and Accounts portals. */
export const useExpensePayments = (employeeId?: string) => {
  const [rows, setRows] = useState<ExpensePayment[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    let query = supabase
      .from("employee_payments")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("created_at", { ascending: false });
    if (employeeId) query = query.eq("employee_id", employeeId);
    const { data, error } = await query;
    if (error) console.error("Failed to load payments", error);
    setRows(((data as any[]) || []).map((p) => ({ ...p, amount: Number(p.amount || 0) })) as ExpensePayment[]);
    setLoading(false);
  }, [employeeId]);

  const fetchNames = useCallback(async () => {
    const { data } = await supabase.from("employees").select("id, name, email, username");
    const map: Record<string, string> = {};
    (data as any[] | null)?.forEach((e) => {
      map[e.id] = e.name || prettifyName(e.email || e.username);
    });
    setNameMap(map);
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchNames();
  }, [fetchPayments, fetchNames]);

  useEffect(() => {
    const channel = supabase
      .channel(`expense-payments-${employeeId || "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_payments" }, () => fetchPayments())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayments, employeeId]);

  const payments = useMemo(
    () =>
      rows.map((p) => ({
        ...p,
        display_name: nameMap[p.employee_id] || prettifyName(p.employee_name) || "Unknown",
      })),
    [rows, nameMap]
  );

  const addSheet = useCallback(async (input: ExpenseSheetInput) => {
    const { error } = await supabase.from("employee_payments").insert({
      employee_id: input.employee_id,
      employee_name: input.employee_name || null,
      month: input.month,
      year: input.year,
      sheet_url: input.sheet_url || null,
      date: `${input.year}-${String(input.month).padStart(2, "0")}-01`,
      hr_status: "Pending",
      accounts_status: "Pending",
    } as any);
    if (error) throw error;
    await fetchPayments();
  }, [fetchPayments]);

  const updateSheet = useCallback(async (id: string, updates: Partial<ExpenseSheetInput>) => {
    const patch: Record<string, any> = { ...updates };
    if (updates.month && updates.year) {
      patch.date = `${updates.year}-${String(updates.month).padStart(2, "0")}-01`;
    }
    const { error } = await supabase.from("employee_payments").update(patch).eq("id", id);
    if (error) throw error;
    await fetchPayments();
  }, [fetchPayments]);

  const deletePayment = useCallback(async (id: string) => {
    const { error } = await supabase.from("employee_payments").delete().eq("id", id);
    if (error) throw error;
    await fetchPayments();
  }, [fetchPayments]);

  const setHrStatus = useCallback(async (ids: string[], status: string) => {
    if (!ids.length) return;
    const { error } = await supabase.from("employee_payments").update({ hr_status: status } as any).in("id", ids);
    if (error) throw error;
    await fetchPayments();
  }, [fetchPayments]);

  const setAccountsStatus = useCallback(async (ids: string[], status: string) => {
    if (!ids.length) return;
    const { error } = await supabase.from("employee_payments").update({ accounts_status: status } as any).in("id", ids);
    if (error) throw error;
    await fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    refresh: fetchPayments,
    addSheet,
    updateSheet,
    deletePayment,
    setHrStatus,
    setAccountsStatus,
  };
};

export const filterPayments = (
  rows: ExpensePayment[],
  opts: { employeeName?: string; month?: string; year?: string }
) =>
  rows.filter((r) => {
    if (opts.employeeName && (r.display_name || r.employee_name || "") !== opts.employeeName) return false;
    if (opts.month && String(r.month || "") !== opts.month) return false;
    if (opts.year && String(r.year || "") !== opts.year) return false;
    return true;
  });

export const paymentExportRows = (rows: ExpensePayment[]) =>
  rows.map((r) => ({
    employee_name: r.display_name || r.employee_name || "-",
    month: monthLabel(r.month),
    year: r.year ?? "-",
    file: r.sheet_url || r.receipt_url ? "Attached" : "Not attached",
    hr_status: r.hr_status || "Pending",
    accounts_status: r.accounts_status || "Pending",
  }));

export const PAYMENT_EXPORT_COLUMNS = [
  { key: "employee_name", header: "Employee Name" },
  { key: "month", header: "Month" },
  { key: "year", header: "Year" },
  { key: "file", header: "File" },
  { key: "hr_status", header: "HR Status" },
  { key: "accounts_status", header: "Accounts Status" },
];
