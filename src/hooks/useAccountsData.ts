import { useState, useEffect, useCallback } from "react";

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
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time sync function - polls every 2 seconds for new data
  const syncAllData = useCallback(() => {
    // Aggregate vouchers from multiple sources
    const employeeVouchers: VoucherRecord[] = JSON.parse(localStorage.getItem("accounts_vouchers") || "[]");
    const adminPayments = JSON.parse(localStorage.getItem("admin_payments") || "[]");
    
    // Transform admin payments to voucher format
    const adminVouchers: VoucherRecord[] = adminPayments.map((p: any) => ({
      id: p.id,
      employeeName: p.employeeName || "Admin",
      amount: typeof p.amount === "number" ? p.amount : parseFloat(p.amount) || 0,
      date: p.date,
      receiptUrl: p.document || p.receiptUrl,
      purpose: p.purpose,
      timestamp: p.createdAt || p.timestamp || new Date().toISOString(),
      source: "admin" as const,
    }));

    // Merge and deduplicate vouchers
    const allVouchersMap = new Map<string, VoucherRecord>();
    [...employeeVouchers, ...adminVouchers].forEach(v => {
      if (!allVouchersMap.has(v.id)) {
        allVouchersMap.set(v.id, v);
      }
    });
    const mergedVouchers = Array.from(allVouchersMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setVouchers(mergedVouchers);

    // Aggregate travel expenses
    const accountsTravelExpenses: TravelExpense[] = JSON.parse(localStorage.getItem("accounts_travel_expenses") || "[]");
    const sortedTravel = [...accountsTravelExpenses].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setTravelExpenses(sortedTravel);
  }, []);

  // Initial load and periodic sync
  useEffect(() => {
    syncAllData();

    // Real-time polling every 2 seconds
    const interval = setInterval(() => {
      syncAllData();
    }, 2000);

    return () => clearInterval(interval);
  }, [syncAllData, refreshKey]);

  // Manual refresh trigger
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Filter functions
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

  // Get unique employee names for filters
  const getUniqueEmployees = useCallback(() => {
    const allNames = [
      ...vouchers.map(v => v.employeeName),
      ...travelExpenses.map(t => t.employeeName)
    ].filter(Boolean);
    return [...new Set(allNames)].sort();
  }, [vouchers, travelExpenses]);

  // Get available years from records
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
