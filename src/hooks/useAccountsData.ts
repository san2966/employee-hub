import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentRecord {
  id: string;
  employeeName: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  purpose?: string;
  type: "payment" | "reimbursement" | "admin";
  timestamp: string;
  source?: "employee" | "admin";
}

export interface VoucherRecord {
  id: string;
  employeeName: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  purpose?: string;
  timestamp: string;
  source?: "employee" | "admin";
}

export interface TravelExpense {
  id: string;
  employeeName: string;
  from: string;
  to: string;
  date: string;
  amount: number;
  receiptUrl?: string;
  purpose?: string;
  timestamp: string;
}

export const useAccountsData = () => {
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [travelExpenses, setTravelExpenses] = useState<TravelExpense[]>([]);

  const fetchData = useCallback(async () => {
    // Fetch admin payments
    const { data: adminData, error: adminError } = await supabase
      .from("admin_payments")
      .select("*")
      .order("date", { ascending: false });

    // Fetch employee payments
    const { data: empData, error: empError } = await supabase
      .from("employee_payments")
      .select(`*, employees(name)`)
      .order("date", { ascending: false });

    if (adminError) console.error("Error fetching admin payments:", adminError);
    if (empError) console.error("Error fetching employee payments:", empError);

    const allVouchers: VoucherRecord[] = [];
    const allTravel: TravelExpense[] = [];

    // Map admin payments to vouchers
    (adminData || []).forEach(p => {
      allVouchers.push({
        id: p.id,
        employeeName: p.paid_to || "Admin",
        amount: p.amount,
        date: p.date,
        receiptUrl: p.receipt_url || undefined,
        purpose: p.purpose,
        timestamp: p.created_at || "",
        source: "admin",
      });
    });

    // Map employee payments
    (empData || []).forEach((p: any) => {
      const empName = p.employee_name || p.employees?.name || "Unknown";
      if (p.category === "travel" || p.category === "traveling") {
        allTravel.push({
          id: p.id,
          employeeName: empName,
          from: p.from_location || "",
          to: p.to_location || "",
          date: p.date,
          amount: p.amount,
          receiptUrl: p.receipt_url || undefined,
          purpose: p.purpose || p.description,
          timestamp: p.created_at || "",
        });
      } else {
        allVouchers.push({
          id: p.id,
          employeeName: empName,
          amount: p.amount,
          date: p.date,
          receiptUrl: p.receipt_url || undefined,
          purpose: p.purpose || p.description,
          timestamp: p.created_at || "",
          source: "employee",
        });
      }
    });

    // Sort by date descending
    allVouchers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    allTravel.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setVouchers(allVouchers);
    setTravelExpenses(allTravel);
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    const ch1 = supabase
      .channel("accounts-admin-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_payments" }, () => fetchData())
      .subscribe();

    const ch2 = supabase
      .channel("accounts-emp-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_payments" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [fetchData]);

  const refresh = useCallback(() => { fetchData(); }, [fetchData]);

  const filterByEmployeeAndDate = useCallback((
    records: any[],
    employeeName?: string,
    year?: number,
    month?: number
  ) => {
    return records.filter(record => {
      const matchesEmployee = !employeeName || 
        record.employeeName?.toLowerCase().includes(employeeName.toLowerCase());
      const recordDate = new Date(record.date);
      const matchesYear = !year || recordDate.getFullYear() === year;
      const matchesMonth = !month || recordDate.getMonth() + 1 === month;
      return matchesEmployee && matchesYear && matchesMonth;
    });
  }, []);

  const getFilteredVouchers = useCallback((employeeName?: string, year?: number, month?: number) => {
    return filterByEmployeeAndDate(vouchers, employeeName, year, month);
  }, [vouchers, filterByEmployeeAndDate]);

  const getFilteredTravelExpenses = useCallback((employeeName?: string, year?: number, month?: number) => {
    return filterByEmployeeAndDate(travelExpenses, employeeName, year, month);
  }, [travelExpenses, filterByEmployeeAndDate]);

  const getTotalVoucherAmount = useCallback((filteredVouchers: VoucherRecord[]) => {
    return filteredVouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
  }, []);

  const getTotalTravelAmount = useCallback((filteredExpenses: TravelExpense[]) => {
    return filteredExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, []);

  const getUniqueEmployees = useCallback(() => {
    const allNames = [
      ...vouchers.map(v => v.employeeName),
      ...travelExpenses.map(t => t.employeeName)
    ].filter(Boolean);
    return [...new Set(allNames)].sort();
  }, [vouchers, travelExpenses]);

  const getAvailableYears = useCallback(() => {
    const allDates = [
      ...vouchers.map(v => new Date(v.date).getFullYear()),
      ...travelExpenses.map(t => new Date(t.date).getFullYear())
    ].filter(y => !isNaN(y));
    const uniqueYears = [...new Set(allDates)].sort((a, b) => b - a);
    return uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()];
  }, [vouchers, travelExpenses]);

  return {
    vouchers,
    travelExpenses,
    refresh,
    getFilteredVouchers,
    getFilteredTravelExpenses,
    getTotalVoucherAmount,
    getTotalTravelAmount,
    getUniqueEmployees,
    getAvailableYears,
  };
};
