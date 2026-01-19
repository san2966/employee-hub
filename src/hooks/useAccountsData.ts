import { useState, useEffect } from "react";

export interface PaymentRecord {
  id: string;
  employeeName: string;
  amount: number;
  date: string;
  receiptUrl: string;
  type: "payment" | "reimbursement";
  timestamp: string;
}

export interface VoucherRecord {
  id: string;
  employeeName: string;
  amount: number;
  date: string;
  receiptUrl: string;
  timestamp: string;
}

export interface TravelExpense {
  id: string;
  employeeName: string;
  from: string;
  to: string;
  date: string;
  amount: number;
  receiptUrl: string;
  timestamp: string;
}

export const useAccountsData = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [travelExpenses, setTravelExpenses] = useState<TravelExpense[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPayments = localStorage.getItem("accountsPayments");
    const savedVouchers = localStorage.getItem("accountsVouchers");
    const savedTravelExpenses = localStorage.getItem("accountsTravelExpenses");

    if (savedPayments) setPayments(JSON.parse(savedPayments));
    if (savedVouchers) setVouchers(JSON.parse(savedVouchers));
    if (savedTravelExpenses) setTravelExpenses(JSON.parse(savedTravelExpenses));

    // Also check for employee submissions
    syncEmployeeSubmissions();
  }, []);

  // Sync employee submissions from Employee Login module
  const syncEmployeeSubmissions = () => {
    const employeePayments = localStorage.getItem("employeePayments");
    const employeeVouchers = localStorage.getItem("employeeVouchers");
    const employeeTravelExpenses = localStorage.getItem("employeeTravelExpenses");

    if (employeePayments) {
      const parsed = JSON.parse(employeePayments);
      setPayments(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newRecords = parsed.filter((p: PaymentRecord) => !existingIds.has(p.id));
        const updated = [...prev, ...newRecords];
        localStorage.setItem("accountsPayments", JSON.stringify(updated));
        return updated;
      });
    }

    if (employeeVouchers) {
      const parsed = JSON.parse(employeeVouchers);
      setVouchers(prev => {
        const existingIds = new Set(prev.map(v => v.id));
        const newRecords = parsed.filter((v: VoucherRecord) => !existingIds.has(v.id));
        const updated = [...prev, ...newRecords];
        localStorage.setItem("accountsVouchers", JSON.stringify(updated));
        return updated;
      });
    }

    if (employeeTravelExpenses) {
      const parsed = JSON.parse(employeeTravelExpenses);
      setTravelExpenses(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newRecords = parsed.filter((t: TravelExpense) => !existingIds.has(t.id));
        const updated = [...prev, ...newRecords];
        localStorage.setItem("accountsTravelExpenses", JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Filter functions
  const filterByEmployeeAndDate = (
    records: any[],
    employeeName?: string,
    year?: number,
    month?: number
  ) => {
    return records.filter(record => {
      const matchesEmployee = !employeeName || record.employeeName.toLowerCase().includes(employeeName.toLowerCase());
      const recordDate = new Date(record.date);
      const matchesYear = !year || recordDate.getFullYear() === year;
      const matchesMonth = !month || recordDate.getMonth() + 1 === month;
      return matchesEmployee && matchesYear && matchesMonth;
    });
  };

  const getFilteredVouchers = (employeeName?: string, year?: number, month?: number) => {
    return filterByEmployeeAndDate(vouchers, employeeName, year, month);
  };

  const getFilteredTravelExpenses = (employeeName?: string, year?: number, month?: number) => {
    return filterByEmployeeAndDate(travelExpenses, employeeName, year, month);
  };

  const getTotalVoucherAmount = (filteredVouchers: VoucherRecord[]) => {
    return filteredVouchers.reduce((sum, v) => sum + v.amount, 0);
  };

  const getTotalTravelAmount = (filteredExpenses: TravelExpense[]) => {
    return filteredExpenses.reduce((sum, t) => sum + t.amount, 0);
  };

  // Get unique employee names for filters
  const getUniqueEmployees = () => {
    const allNames = [
      ...payments.map(p => p.employeeName),
      ...vouchers.map(v => v.employeeName),
      ...travelExpenses.map(t => t.employeeName)
    ];
    return [...new Set(allNames)];
  };

  // Get available years from records
  const getAvailableYears = () => {
    const allDates = [
      ...payments.map(p => new Date(p.date).getFullYear()),
      ...vouchers.map(v => new Date(v.date).getFullYear()),
      ...travelExpenses.map(t => new Date(t.date).getFullYear())
    ];
    const uniqueYears = [...new Set(allDates)].sort((a, b) => b - a);
    return uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()];
  };

  return {
    payments,
    vouchers,
    travelExpenses,
    syncEmployeeSubmissions,
    getFilteredVouchers,
    getFilteredTravelExpenses,
    getTotalVoucherAmount,
    getTotalTravelAmount,
    getUniqueEmployees,
    getAvailableYears,
  };
};
