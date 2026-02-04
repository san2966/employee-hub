import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  photo?: string;
  address: string;
  phone: string;
  email: string;
  aadhaar_number: string;
  pan_number: string;
  blood_group: string;
  father_name: string;
  father_mobile?: string;
  mother_name: string;
  mother_mobile?: string;
  highest_education: string;
  degree_name: string;
  specialization?: string;
  school_college: string;
  board_university: string;
  year_of_passing: string;
  passed_or_appearing: "passed" | "appearing";
  marks_percentage?: string;
  certifications?: string;
  is_fresher: boolean;
  organization_name?: string;
  post_held?: string;
  job_period_from?: string;
  job_period_to?: string;
  reason_of_leaving?: string;
  previous_ctc?: string;
  total_experience?: string;
  date_of_joining: string;
  designation: string;
  additional_charge?: string;
  responsibilities: string;
  username: string;
  paid_leave_balance: number;
  medical_leave_balance: number;
  exchange_leave_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  date: string;
  reason: string;
  leave_type: "paid" | "medical" | "exchange";
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  medical_certificate?: string;
  working_date?: string;
  working_reason?: string;
  is_add_leave: boolean;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Joined field
  employee_name?: string;
}

export const useSupabaseEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      return;
    }

    // Map data to match interface types
    const mappedData = (data || []).map((emp) => ({
      ...emp,
      passed_or_appearing: emp.passed_or_appearing as "passed" | "appearing",
    }));

    setEmployees(mappedData);
  }, []);

  // Fetch leave requests with employee names
  const fetchLeaveRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select(`
        *,
        employees(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leave requests:", error);
      return;
    }

    const requestsWithNames = (data || []).map((req: any) => ({
      ...req,
      leave_type: req.leave_type as "paid" | "medical" | "exchange",
      status: req.status as "pending" | "approved" | "rejected",
      employee_name: req.employees?.name || "Unknown",
    }));

    setLeaveRequests(requestsWithNames);
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchLeaveRequests()]);
      setLoading(false);
    };
    loadData();
  }, [fetchEmployees, fetchLeaveRequests]);

  // Realtime subscriptions
  useEffect(() => {
    const employeesChannel = supabase
      .channel("employees-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => {
        fetchEmployees();
      })
      .subscribe();

    const leavesChannel = supabase
      .channel("leaves-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => {
        fetchLeaveRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(employeesChannel);
      supabase.removeChannel(leavesChannel);
    };
  }, [fetchEmployees, fetchLeaveRequests]);

  // Add employee
  const addEmployee = async (employeeData: Omit<Employee, "id" | "created_at" | "updated_at" | "paid_leave_balance" | "medical_leave_balance" | "exchange_leave_balance" | "is_active">) => {
    const { data, error } = await supabase
      .from("employees")
      .insert({
        ...employeeData,
        paid_leave_balance: 12,
        medical_leave_balance: 6,
        exchange_leave_balance: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding employee:", error);
      throw error;
    }

    return data;
  };

  // Update employee
  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const { error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  };

  // Delete employee (soft delete)
  const deleteEmployee = async (id: string, _reason?: string) => {
    const { error } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }
  };

  // Get employee by ID
  const getEmployeeById = (id: string) => {
    return employees.find((emp) => emp.id === id);
  };

  // Get employee by username
  const getEmployeeByUsername = (username: string) => {
    return employees.find((emp) => emp.username === username);
  };

  // Submit leave request
  const submitLeaveRequest = async (request: {
    employee_id: string;
    date: string;
    reason: string;
    leave_type: "paid" | "medical" | "exchange";
    medical_certificate?: string;
    working_date?: string;
    working_reason?: string;
    is_add_leave?: boolean;
  }) => {
    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        ...request,
        status: "pending",
        is_add_leave: request.is_add_leave || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting leave request:", error);
      throw error;
    }

    return data;
  };

  // Approve leave request
  const approveLeaveRequest = async (id: string, approvedBy?: string) => {
    const request = leaveRequests.find((r) => r.id === id);
    if (!request) return;

    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "approved",
        approved_by: approvedBy,
      })
      .eq("id", id);

    if (error) {
      console.error("Error approving leave:", error);
      throw error;
    }

    // Update employee leave balance
    const employee = employees.find((e) => e.id === request.employee_id);
    if (employee) {
      const balanceField = `${request.leave_type}_leave_balance` as keyof Employee;
      const currentBalance = employee[balanceField] as number;

      if (request.leave_type === "exchange") {
        // Exchange leave: add if is_add_leave, subtract otherwise
        const newBalance = request.is_add_leave 
          ? currentBalance + 1 
          : Math.max(0, currentBalance - 1);
        await updateEmployee(request.employee_id, { [balanceField]: newBalance });
      } else {
        // Paid/Medical: deduct 1
        await updateEmployee(request.employee_id, { 
          [balanceField]: Math.max(0, currentBalance - 1) 
        });
      }
    }
  };

  // Reject leave request
  const rejectLeaveRequest = async (id: string, reason: string) => {
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "rejected",
        rejection_reason: reason,
      })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting leave:", error);
      throw error;
    }
  };

  // Clear leave record (HR only)
  const clearLeaveRecord = async (id: string) => {
    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error clearing leave record:", error);
      throw error;
    }
  };

  // Get leave stats
  const getLeaveStats = useCallback(() => {
    const pending = leaveRequests.filter((l) => l.status === "pending").length;
    const approved = leaveRequests.filter((l) => l.status === "approved").length;
    const rejected = leaveRequests.filter((l) => l.status === "rejected").length;
    const paidLeaves = leaveRequests.filter((l) => l.leave_type === "paid").length;
    const medicalLeaves = leaveRequests.filter((l) => l.leave_type === "medical").length;
    const exchangeLeaves = leaveRequests.filter((l) => l.leave_type === "exchange").length;

    return { pending, approved, rejected, paidLeaves, medicalLeaves, exchangeLeaves, total: leaveRequests.length };
  }, [leaveRequests]);

  // Get leaves by employee
  const getLeavesByEmployee = useCallback((employeeId: string) => {
    return leaveRequests.filter((l) => l.employee_id === employeeId);
  }, [leaveRequests]);

  return {
    employees: employees.filter((e) => e.is_active),
    allEmployees: employees,
    leaveRequests,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    getEmployeeByUsername,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    clearLeaveRecord,
    getLeaveStats,
    getLeavesByEmployee,
    refreshEmployees: fetchEmployees,
    refreshLeaves: fetchLeaveRequests,
  };
};
