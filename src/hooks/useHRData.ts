import { useState, useEffect } from "react";

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

export const useHRData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const savedEmployees = localStorage.getItem("hr_employees");
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    }
  }, []);

  const saveEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    localStorage.setItem("hr_employees", JSON.stringify(newEmployees));
    // Also update director's view
    localStorage.setItem("director_employees", JSON.stringify(newEmployees));
  };

  const addEmployee = (employee: Omit<Employee, "id" | "createdAt" | "leaveBalance">) => {
    const newEmployee: Employee = {
      ...employee,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      leaveBalance: {
        paid: 12,
        medical: 6,
        exchange: 3,
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

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
  };
};
