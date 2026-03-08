import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  // Basic Information
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
  // Educational Information
  highestEducation: string;
  degreeName: string;
  specialization: string;
  schoolCollege: string;
  boardUniversity: string;
  yearOfPassing: string;
  passedOrAppearing: "passed" | "appearing";
  marksPercentage?: string;
  certifications?: string;
  // Experience Information
  isFresher: boolean;
  organizationName?: string;
  postHeld?: string;
  jobPeriodFrom?: string;
  jobPeriodTo?: string;
  reasonOfLeaving?: string;
  previousCTC?: string;
  totalExperience?: string;
  // Office Use
  dateOfJoining: string;
  designation: string;
  additionalCharge?: string;
  responsibilities: string;
  username: string;
  password: string;
  // System
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
  isAddLeave?: boolean; // For exchange leave - true if adding leave, false if taking leave
}

export const useHRData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    const savedEmployees = localStorage.getItem("hr_employees");
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    }
    loadAllLeaves();
  }, []);

  const loadAllLeaves = useCallback(() => {
    const directorLeaves = JSON.parse(localStorage.getItem("director_leaves") || "[]");
    setAllLeaves(directorLeaves);
  }, []);

  // Refresh leaves periodically
  useEffect(() => {
    const interval = setInterval(loadAllLeaves, 2000);
    return () => clearInterval(interval);
  }, [loadAllLeaves]);

  const saveEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    localStorage.setItem("hr_employees", JSON.stringify(newEmployees));
    // Also update director's view
    localStorage.setItem("director_employees", JSON.stringify(newEmployees));
  };

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

    const newEmployee: Employee = {
      ...employee,
      id: data?.employee?.id || crypto.randomUUID(),
      createdAt: data?.employee?.created_at || new Date().toISOString(),
      leaveBalance: {
        paid: data?.employee?.paid_leave_balance ?? 12,
        medical: data?.employee?.medical_leave_balance ?? 6,
        exchange: data?.employee?.exchange_leave_balance ?? 0,
      },
    };

    const updated = [...employees, newEmployee];
    saveEmployees(updated);
    return newEmployee;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const updated = employees.map(emp => 
      emp.id === id ? { ...emp, ...updates } : emp
    );
    saveEmployees(updated);
  };

  const deleteEmployee = (id: string, reason: string) => {
    console.log(`Employee deleted. Reason: ${reason}`);
    const updated = employees.filter(emp => emp.id !== id);
    saveEmployees(updated);
  };

  const getEmployeeById = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  // HR Leave Management
  const getAllLeaveRequests = useCallback(() => {
    return allLeaves;
  }, [allLeaves]);

  const getLeavesByType = useCallback((type: "paid" | "medical" | "exchange") => {
    return allLeaves.filter(l => l.type === type);
  }, [allLeaves]);

  const getLeavesByEmployee = useCallback((employeeId: string) => {
    return allLeaves.filter(l => l.employeeId === employeeId);
  }, [allLeaves]);

  // HR-only: Clear/delete leave records
  const clearLeaveRecord = useCallback((leaveId: string) => {
    const directorLeaves: LeaveRequest[] = JSON.parse(localStorage.getItem("director_leaves") || "[]");
    const updated = directorLeaves.filter(l => l.id !== leaveId);
    localStorage.setItem("director_leaves", JSON.stringify(updated));
    setAllLeaves(updated);
  }, []);

  // HR-only: Clear all leaves for an employee
  const clearEmployeeLeaves = useCallback((employeeId: string) => {
    const directorLeaves: LeaveRequest[] = JSON.parse(localStorage.getItem("director_leaves") || "[]");
    const updated = directorLeaves.filter(l => l.employeeId !== employeeId);
    localStorage.setItem("director_leaves", JSON.stringify(updated));
    setAllLeaves(updated);
  }, []);

  // Get leave statistics
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
    // Leave Management
    getAllLeaveRequests,
    getLeavesByType,
    getLeavesByEmployee,
    clearLeaveRecord,
    clearEmployeeLeaves,
    getLeaveStats,
    refreshLeaves: loadAllLeaves,
  };
};
