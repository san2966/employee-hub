import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  photo?: string;
  address: string;
  phone: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  bloodGroup: string;
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  highestEducation: string;
  degreeName: string;
  specialization: string;
  schoolCollege: string;
  boardUniversity: string;
  yearOfPassing: string;
  passedOrAppearing: "passed" | "appearing";
  marksPercentage?: string;
  certifications?: string;
  isFresher: boolean;
  organizationName?: string;
  postHeld?: string;
  jobPeriodFrom?: string;
  jobPeriodTo?: string;
  reasonOfLeaving?: string;
  previousCTC?: string;
  totalExperience?: string;
  dateOfJoining: string;
  designation: string;
  additionalCharge?: string;
  responsibilities: string;
  username: string;
  password: string;
  createdAt: string;
  leaveBalance: {
    paid: number;
    medical: number;
    exchange: number;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  reason: string;
  type: "paid" | "medical" | "exchange";
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  medicalCertificate?: string;
  workingDate?: string;
  workingReason?: string;
  createdAt: string;
  isAddLeave?: boolean;
}

// Map DB employee to local Employee interface
const mapDbToEmployee = (emp: any): Employee => ({
  id: emp.id,
  name: emp.name,
  photo: emp.photo || "",
  address: emp.address,
  phone: emp.phone,
  email: emp.email,
  aadhaarNumber: emp.aadhaar_number,
  panNumber: emp.pan_number,
  bloodGroup: emp.blood_group,
  fatherName: emp.father_name,
  fatherMobile: emp.father_mobile || "",
  motherName: emp.mother_name,
  motherMobile: emp.mother_mobile || "",
  highestEducation: emp.highest_education,
  degreeName: emp.degree_name,
  specialization: emp.specialization || "",
  schoolCollege: emp.school_college,
  boardUniversity: emp.board_university,
  yearOfPassing: emp.year_of_passing,
  passedOrAppearing: emp.passed_or_appearing as "passed" | "appearing",
  marksPercentage: emp.marks_percentage || "",
  certifications: emp.certifications || "",
  isFresher: emp.is_fresher ?? true,
  organizationName: emp.organization_name || "",
  postHeld: emp.post_held || "",
  jobPeriodFrom: emp.job_period_from || "",
  jobPeriodTo: emp.job_period_to || "",
  reasonOfLeaving: emp.reason_of_leaving || "",
  previousCTC: emp.previous_ctc || "",
  totalExperience: emp.total_experience || "",
  dateOfJoining: emp.date_of_joining,
  designation: emp.designation,
  additionalCharge: emp.additional_charge || "",
  responsibilities: emp.responsibilities,
  username: emp.username,
  password: "",
  createdAt: emp.created_at,
  leaveBalance: {
    paid: emp.paid_leave_balance ?? 6,
    medical: emp.medical_leave_balance ?? 6,
    exchange: emp.exchange_leave_balance ?? 0,
  },
});

const mapDbToLeave = (req: any): LeaveRequest => ({
  id: req.id,
  employeeId: req.employee_id,
  employeeName: req.employees?.name || "Unknown",
  date: req.date,
  reason: req.reason,
  type: req.leave_type as "paid" | "medical" | "exchange",
  status: req.status as "pending" | "approved" | "rejected",
  rejectionReason: req.rejection_reason,
  medicalCertificate: req.medical_certificate,
  workingDate: req.working_date,
  workingReason: req.working_reason,
  createdAt: req.created_at,
  isAddLeave: req.is_add_leave,
});

export const useHRData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      return;
    }

    setEmployees((data || []).map(mapDbToEmployee));
  }, []);

  const fetchLeaves = useCallback(async () => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select(`*, employees(name)`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leave requests:", error);
      return;
    }

    setAllLeaves((data || []).map(mapDbToLeave));
  }, []);

  // Initial load
  useEffect(() => {
    fetchEmployees();
    fetchLeaves();
  }, [fetchEmployees, fetchLeaves]);

  // Realtime subscriptions
  useEffect(() => {
    const empChannel = supabase
      .channel("hr-employees-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => {
        fetchEmployees();
      })
      .subscribe();

    const leaveChannel = supabase
      .channel("hr-leaves-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => {
        fetchLeaves();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(empChannel);
      supabase.removeChannel(leaveChannel);
    };
  }, [fetchEmployees, fetchLeaves]);

  const addEmployee = async (employee: Omit<Employee, "id" | "createdAt" | "leaveBalance">) => {
    const { data, error } = await supabase.functions.invoke("create-employee", {
      body: employee,
    });

    if (error) {
      console.error("Error creating employee account:", error);
      throw new Error(error.message || "Failed to create employee account");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    await fetchEmployees();

    const newEmployee: Employee = {
      ...employee,
      id: data?.employee?.id || crypto.randomUUID(),
      createdAt: data?.employee?.created_at || new Date().toISOString(),
      leaveBalance: {
        paid: data?.employee?.paid_leave_balance ?? 6,
        medical: data?.employee?.medical_leave_balance ?? 6,
        exchange: data?.employee?.exchange_leave_balance ?? 0,
      },
    };

    return newEmployee;
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.designation !== undefined) dbUpdates.designation = updates.designation;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.responsibilities !== undefined) dbUpdates.responsibilities = updates.responsibilities;
    if (updates.additionalCharge !== undefined) dbUpdates.additional_charge = updates.additionalCharge;

    const { error } = await supabase
      .from("employees")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("Error updating employee:", error);
      throw error;
    }

    await fetchEmployees();
  };

  const deleteEmployee = async (id: string, _reason: string) => {
    const { error } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }

    await fetchEmployees();
  };

  const getEmployeeById = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  // Leave Management
  const getAllLeaveRequests = useCallback(() => allLeaves, [allLeaves]);

  const getLeavesByType = useCallback((type: "paid" | "medical" | "exchange") => {
    return allLeaves.filter(l => l.type === type);
  }, [allLeaves]);

  const getLeavesByEmployee = useCallback((employeeId: string) => {
    return allLeaves.filter(l => l.employeeId === employeeId);
  }, [allLeaves]);

  const clearLeaveRecord = useCallback(async (leaveId: string) => {
    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", leaveId);

    if (error) {
      console.error("Error clearing leave record:", error);
      throw error;
    }

    await fetchLeaves();
  }, [fetchLeaves]);

  const clearEmployeeLeaves = useCallback(async (employeeId: string) => {
    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error clearing employee leaves:", error);
      throw error;
    }

    await fetchLeaves();
  }, [fetchLeaves]);

  const getLeaveStats = useCallback(() => {
    const pending = allLeaves.filter(l => l.status === "pending").length;
    const approved = allLeaves.filter(l => l.status === "approved").length;
    const rejected = allLeaves.filter(l => l.status === "rejected").length;
    const paidLeaves = allLeaves.filter(l => l.type === "paid").length;
    const medicalLeaves = allLeaves.filter(l => l.type === "medical").length;
    const exchangeLeaves = allLeaves.filter(l => l.type === "exchange").length;
    
    return { pending, approved, rejected, paidLeaves, medicalLeaves, exchangeLeaves, total: allLeaves.length };
  }, [allLeaves]);

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    getAllLeaveRequests,
    getLeavesByType,
    getLeavesByEmployee,
    clearLeaveRecord,
    clearEmployeeLeaves,
    getLeaveStats,
    refreshLeaves: fetchLeaves,
  };
};
