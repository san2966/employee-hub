import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const EXPENSE_TYPES = ["Petrol", "Lunch", "Hotel", "Toll", "Travel", "Stationary", "Other"] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export interface ExpensePayment {
  id: string;
  employee_id: string;
  employee_name: string | null;
  date: string;
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

export interface ExpensePaymentInput {
  employee_id: string;
  employee_name?: string | null;
  date: string;
  amount: number;
  expense_type: string;
  purpose: string;
  from_location?: string | null;
  to_location?: string | null;
  payment_mode: string;
  receipt_url?: string | null;
}

/** Shared access to public.employee_payments for Employee, HR and Accounts portals. */
export const useExpensePayments = (employeeId?: string) => {
  const [payments, setPayments] = useState<ExpensePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    let query = supabase
      .from("employee_payments")
      .select("*")
      .order("date", { ascending: false });
    if (employeeId) query = query.eq("employee_id", employeeId);
    const { data, error } = await query;
    if (error) console.error("Failed to load payments", error);
    setPayments(((data as any[]) || []).map((p) => ({ ...p, amount: Number(p.amount) })) as ExpensePayment[]);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    const channel = supabase
      .channel(`expense-payments-${employeeId || "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_payments" }, () => fetchPayments())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayments, employeeId]);

  const addPayment = useCallback(async (input: ExpensePaymentInput) => {
    const { error } = await supabase.from("employee_payments").insert({
      employee_id: input.employee_id,
      employee_name: input.employee_name || null,
      date: input.date,
      amount: input.amount,
      expense_type: input.expense_type,
      category: input.expense_type === "Travel" ? "travel" : "misc",
      description: input.purpose,
      purpose: input.purpose,
      from_location: input.from_location || null,
      to_location: input.to_location || null,
      payment_mode: input.payment_mode,
      receipt_url: input.receipt_url || null,
      hr_status: "Pending",
      accounts_status: "Pending",
    } as any);
    if (error) throw error;
    await fetchPayments();
  }, [fetchPayments]);

  const updatePayment = useCallback(async (id: string, updates: Partial<ExpensePaymentInput>) => {
    const patch: Record<string, any> = { ...updates };
    if (updates.purpose) patch.description = updates.purpose;
    if (updates.expense_type) patch.category = updates.expense_type === "Travel" ? "travel" : "misc";
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

  return { payments, loading, refresh: fetchPayments, addPayment, updatePayment, deletePayment, setHrStatus, setAccountsStatus };
};

export const filterPayments = (
  rows: ExpensePayment[],
  opts: { employeeName?: string; from?: string; to?: string }
) =>
  rows.filter((r) => {
    if (opts.employeeName && (r.employee_name || "") !== opts.employeeName) return false;
    if (opts.from && r.date < opts.from) return false;
    if (opts.to && r.date > opts.to) return false;
    return true;
  });

export const PAYMENT_EXPORT_COLUMNS = [
  { key: "employee_name", header: "Employee Name" },
  { key: "date", header: "Date" },
  { key: "expense_type", header: "Expense Type" },
  { key: "amount", header: "Amount (INR)" },
  { key: "payment_mode", header: "Mode" },
  { key: "purpose", header: "Purpose" },
  { key: "hr_status", header: "HR Status" },
  { key: "accounts_status", header: "Accounts Status" },
];