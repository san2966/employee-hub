import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminPayment {
  id: string;
  date: string;
  paid_to: string;
  amount: number;
  purpose: string;
  payment_mode: string;
  remarks?: string;
  receipt_url?: string;
  created_at: string;
}

export interface EmployeePayment {
  id: string;
  employee_id: string;
  date: string;
  amount: number;
  category: "miscellaneous" | "traveling";
  description: string;
  status: "pending" | "approved" | "rejected";
  approved_by?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
  // Joined field
  employee_name?: string;
}

export const useSupabasePayments = () => {
  const [adminPayments, setAdminPayments] = useState<AdminPayment[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminPayments = useCallback(async () => {
    const { data, error } = await supabase
      .from("admin_payments")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching admin payments:", error);
      return;
    }

    setAdminPayments(data || []);
  }, []);

  const fetchEmployeePayments = useCallback(async () => {
    const { data, error } = await supabase
      .from("employee_payments")
      .select(`
        *,
        employees(name)
      `)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching employee payments:", error);
      return;
    }

    const paymentsWithNames = (data || []).map((payment: any) => ({
      ...payment,
      employee_name: payment.employees?.name || "Unknown",
    }));

    setEmployeePayments(paymentsWithNames);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAdminPayments(), fetchEmployeePayments()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAdminPayments, fetchEmployeePayments]);

  // Admin Payment operations
  const addAdminPayment = async (paymentData: Omit<AdminPayment, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("admin_payments")
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      console.error("Error adding admin payment:", error);
      throw error;
    }

    await fetchAdminPayments();
    return data;
  };

  const updateAdminPayment = async (id: string, updates: Partial<AdminPayment>) => {
    const { error } = await supabase
      .from("admin_payments")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating admin payment:", error);
      throw error;
    }

    await fetchAdminPayments();
  };

  const deleteAdminPayment = async (id: string) => {
    const { error } = await supabase
      .from("admin_payments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting admin payment:", error);
      throw error;
    }

    await fetchAdminPayments();
  };

  // Employee Payment operations
  const addEmployeePayment = async (paymentData: {
    employee_id: string;
    date: string;
    amount: number;
    category: "miscellaneous" | "traveling";
    description: string;
    receipt_url?: string;
  }) => {
    const { data, error } = await supabase
      .from("employee_payments")
      .insert({
        ...paymentData,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding employee payment:", error);
      throw error;
    }

    await fetchEmployeePayments();
    return data;
  };

  const approveEmployeePayment = async (id: string, approvedBy?: string) => {
    const { error } = await supabase
      .from("employee_payments")
      .update({
        status: "approved",
        approved_by: approvedBy,
      })
      .eq("id", id);

    if (error) {
      console.error("Error approving payment:", error);
      throw error;
    }

    await fetchEmployeePayments();
  };

  const rejectEmployeePayment = async (id: string) => {
    const { error } = await supabase
      .from("employee_payments")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting payment:", error);
      throw error;
    }

    await fetchEmployeePayments();
  };

  const getPaymentsByEmployee = useCallback((employeeId: string) => {
    return employeePayments.filter((p) => p.employee_id === employeeId);
  }, [employeePayments]);

  const getPaymentsByCategory = useCallback((category: "miscellaneous" | "traveling") => {
    return employeePayments.filter((p) => p.category === category);
  }, [employeePayments]);

  return {
    adminPayments,
    employeePayments,
    loading,
    addAdminPayment,
    updateAdminPayment,
    deleteAdminPayment,
    addEmployeePayment,
    approveEmployeePayment,
    rejectEmployeePayment,
    getPaymentsByEmployee,
    getPaymentsByCategory,
    refreshPayments: () => Promise.all([fetchAdminPayments(), fetchEmployeePayments()]),
  };
};
