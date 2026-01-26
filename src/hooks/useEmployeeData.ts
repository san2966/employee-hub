import { useState, useEffect, useCallback } from "react";

// Types
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  employeeId: string;
  subject: string;
  description: string;
  status: "in-progress" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  isPersonal?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  designation?: string;
  department?: string;
  organization: string;
  email?: string;
}

export interface Requirement {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  whyNeeded: string;
  link?: string;
  expectedCost?: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface TravelExpense {
  id: string;
  employeeId: string;
  employeeName: string;
  from: string;
  to: string;
  purpose: string;
  date: string;
  receiptUrl?: string;
  amount: number;
  timestamp: string;
}

export interface MiscPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  purpose: string;
  receiptUrl?: string;
  amount: number;
  timestamp: string;
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

export interface Report {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  department: string;
  task: string;
  status: "completed" | "pending";
  description: string;
  additionalInfo?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  type: "notice" | "announcement";
  title: string;
  content: string;
  recipients: string[];
  createdAt: string;
  read?: boolean;
}

const getEmployeeStorageKey = (employeeId: string, key: string) => 
  `employee_${employeeId}_${key}`;

export const useEmployeeData = (employeeId: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [travelExpenses, setTravelExpenses] = useState<TravelExpense[]>([]);
  const [miscPayments, setMiscPayments] = useState<MiscPayment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [leaveBalance, setLeaveBalance] = useState({ paid: 12, medical: 6, exchange: 0 }); // Exchange starts at 0

  // Load employee-specific data
  useEffect(() => {
    if (!employeeId) return;
    
    const loadData = <T>(key: string, defaultVal: T): T => {
      const data = localStorage.getItem(getEmployeeStorageKey(employeeId, key));
      return data ? JSON.parse(data) : defaultVal;
    };

    setEvents(loadData("events", []));
    setNotes(loadData("notes", []));
    setPersonalTasks(loadData("personal_tasks", []));
    setContacts(loadData("contacts", []));
    setRequirements(loadData("requirements", []));
    setTravelExpenses(loadData("travel_expenses", []));
    setMiscPayments(loadData("misc_payments", []));
    setLeaveRequests(loadData("leave_requests", []));
    setReports(loadData("reports", []));
    setLeaveBalance(loadData("leave_balance", { paid: 12, medical: 6, exchange: 0 }));
  }, [employeeId]);

  const saveData = <T>(key: string, data: T) => {
    localStorage.setItem(getEmployeeStorageKey(employeeId, key), JSON.stringify(data));
  };

  // Calendar Events
  const addEvent = useCallback((event: Omit<CalendarEvent, "id">) => {
    const newEvent = { ...event, id: crypto.randomUUID() };
    const updated = [...events, newEvent];
    setEvents(updated);
    saveData("events", updated);
    return newEvent;
  }, [events, employeeId]);

  const updateEvent = useCallback((id: string, data: Partial<CalendarEvent>) => {
    const updated = events.map(e => e.id === id ? { ...e, ...data } : e);
    setEvents(updated);
    saveData("events", updated);
  }, [events, employeeId]);

  const deleteEvent = useCallback((id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveData("events", updated);
  }, [events, employeeId]);

  // Notes
  const addNote = useCallback((note: Omit<Note, "id" | "createdAt">) => {
    const newNote = { ...note, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveData("notes", updated);
    return newNote;
  }, [notes, employeeId]);

  const deleteNote = useCallback((id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveData("notes", updated);
  }, [notes, employeeId]);

  // Personal Tasks
  const addPersonalTask = useCallback((task: { subject: string; description: string }) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: crypto.randomUUID(),
      employeeId,
      subject: task.subject,
      description: task.description,
      status: "in-progress",
      createdAt: now,
      updatedAt: now,
      isPersonal: true,
    };
    const updated = [...personalTasks, newTask];
    setPersonalTasks(updated);
    saveData("personal_tasks", updated);
    return newTask;
  }, [personalTasks, employeeId]);

  const updatePersonalTask = useCallback((id: string, data: Partial<Task>) => {
    const updated = personalTasks.map(t => 
      t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
    );
    setPersonalTasks(updated);
    saveData("personal_tasks", updated);
  }, [personalTasks, employeeId]);

  const deletePersonalTask = useCallback((id: string) => {
    const updated = personalTasks.filter(t => t.id !== id);
    setPersonalTasks(updated);
    saveData("personal_tasks", updated);
  }, [personalTasks, employeeId]);

  // Contacts
  const addContact = useCallback((contact: Omit<Contact, "id">) => {
    const newContact = { ...contact, id: crypto.randomUUID() };
    const updated = [...contacts, newContact];
    setContacts(updated);
    saveData("contacts", updated);
    return newContact;
  }, [contacts, employeeId]);

  const deleteContact = useCallback((id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    saveData("contacts", updated);
  }, [contacts, employeeId]);

  // Requirements
  const addRequirement = useCallback((req: {
    title: string;
    description: string;
    whyNeeded: string;
    link?: string;
    expectedCost?: number;
    employeeName: string;
  }) => {
    const newReq: Requirement = {
      id: crypto.randomUUID(),
      employeeId,
      employeeName: req.employeeName,
      title: req.title,
      description: req.description,
      whyNeeded: req.whyNeeded,
      link: req.link,
      expectedCost: req.expectedCost,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    
    // Save to employee's requirements
    const updated = [...requirements, newReq];
    setRequirements(updated);
    saveData("requirements", updated);
    
    // Also sync to director's requirements
    const directorReqs = JSON.parse(localStorage.getItem("director_requirements") || "[]");
    localStorage.setItem("director_requirements", JSON.stringify([...directorReqs, newReq]));
    
    return newReq;
  }, [requirements, employeeId]);

  // Travel Expenses
  const addTravelExpense = useCallback((expense: Omit<TravelExpense, "id" | "employeeId" | "timestamp">) => {
    const newExpense: TravelExpense = {
      ...expense,
      id: crypto.randomUUID(),
      employeeId,
      timestamp: new Date().toISOString(),
    };
    
    const updated = [...travelExpenses, newExpense];
    setTravelExpenses(updated);
    saveData("travel_expenses", updated);
    
    // Sync to accounts
    const accountsExpenses = JSON.parse(localStorage.getItem("accounts_travel_expenses") || "[]");
    localStorage.setItem("accounts_travel_expenses", JSON.stringify([...accountsExpenses, newExpense]));
    
    return newExpense;
  }, [travelExpenses, employeeId]);

  // Misc Payments
  const addMiscPayment = useCallback((payment: Omit<MiscPayment, "id" | "employeeId" | "timestamp">) => {
    const newPayment: MiscPayment = {
      ...payment,
      id: crypto.randomUUID(),
      employeeId,
      timestamp: new Date().toISOString(),
    };
    
    const updated = [...miscPayments, newPayment];
    setMiscPayments(updated);
    saveData("misc_payments", updated);
    
    // Sync to accounts vouchers
    const accountsVouchers = JSON.parse(localStorage.getItem("accounts_vouchers") || "[]");
    localStorage.setItem("accounts_vouchers", JSON.stringify([...accountsVouchers, newPayment]));
    
    return newPayment;
  }, [miscPayments, employeeId]);

  // Leave Requests
  const requestLeave = useCallback((leave: {
    date: string;
    reason: string;
    type: "paid" | "medical" | "exchange";
    employeeName: string;
    medicalCertificate?: string;
    workingDate?: string;
    workingReason?: string;
    isAddLeave?: boolean; // For exchange leave
  }) => {
    const newLeave: LeaveRequest = {
      id: crypto.randomUUID(),
      employeeId,
      employeeName: leave.employeeName,
      date: leave.date,
      reason: leave.reason,
      type: leave.type,
      status: "pending",
      medicalCertificate: leave.medicalCertificate,
      workingDate: leave.workingDate,
      workingReason: leave.workingReason,
      isAddLeave: leave.isAddLeave,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...leaveRequests, newLeave];
    setLeaveRequests(updated);
    saveData("leave_requests", updated);
    
    // Sync to director's leaves
    const directorLeaves = JSON.parse(localStorage.getItem("director_leaves") || "[]");
    localStorage.setItem("director_leaves", JSON.stringify([...directorLeaves, newLeave]));
    
    return newLeave;
  }, [leaveRequests, employeeId]);

  // Add Exchange Leave (work extra day to earn leave)
  const addExchangeLeave = useCallback((data: {
    workingDate: string;
    workingReason: string;
    employeeName: string;
  }) => {
    return requestLeave({
      date: data.workingDate,
      reason: `Worked on ${data.workingDate}: ${data.workingReason}`,
      type: "exchange",
      employeeName: data.employeeName,
      workingDate: data.workingDate,
      workingReason: data.workingReason,
      isAddLeave: true,
    });
  }, [requestLeave]);

  // Take Exchange Leave (consume earned leave)
  const takeExchangeLeave = useCallback((data: {
    leaveDate: string;
    leaveReason: string;
    employeeName: string;
  }) => {
    return requestLeave({
      date: data.leaveDate,
      reason: data.leaveReason,
      type: "exchange",
      employeeName: data.employeeName,
      isAddLeave: false,
    });
  }, [requestLeave]);

  // Reports
  const addReport = useCallback((report: {
    date: string;
    department: string;
    task: string;
    status: "completed" | "pending";
    description: string;
    additionalInfo?: string;
    employeeName: string;
  }) => {
    const newReport: Report = {
      id: crypto.randomUUID(),
      employeeId,
      employeeName: report.employeeName,
      date: report.date,
      department: report.department,
      task: report.task,
      status: report.status,
      description: report.description,
      additionalInfo: report.additionalInfo,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...reports, newReport];
    setReports(updated);
    saveData("reports", updated);
    
    // Sync to director's tasks/reports
    const directorTasks = JSON.parse(localStorage.getItem("director_tasks") || "[]");
    const taskEntry = {
      id: newReport.id,
      employeeId,
      subject: report.task,
      description: report.description,
      status: report.status === "completed" ? "completed" : "in-progress",
      createdAt: newReport.createdAt,
      updatedAt: newReport.createdAt,
    };
    localStorage.setItem("director_tasks", JSON.stringify([...directorTasks, taskEntry]));
    
    return newReport;
  }, [reports, employeeId]);

  // Get assigned tasks from Director
  const getAssignedTasks = useCallback((): Task[] => {
    const directorTasks = JSON.parse(localStorage.getItem("director_tasks") || "[]");
    return directorTasks.filter((t: Task) => t.employeeId === employeeId && !t.isPersonal);
  }, [employeeId]);

  // Complete assigned task
  const completeAssignedTask = useCallback((taskId: string) => {
    const directorTasks = JSON.parse(localStorage.getItem("director_tasks") || "[]");
    const updated = directorTasks.map((t: Task) => 
      t.id === taskId ? { ...t, status: "completed", updatedAt: new Date().toISOString() } : t
    );
    localStorage.setItem("director_tasks", JSON.stringify(updated));
  }, []);

  // Get notices for this employee
  const getNotices = useCallback((): Notice[] => {
    const directorNotices = JSON.parse(localStorage.getItem("director_notices") || "[]");
    return directorNotices.filter((n: Notice) => 
      n.type === "announcement" || n.recipients.includes(employeeId) || n.recipients.includes("all")
    );
  }, [employeeId]);

  // Get updated leave requests (synced from director's decisions)
  const getUpdatedLeaveRequests = useCallback((): LeaveRequest[] => {
    const directorLeaves: LeaveRequest[] = JSON.parse(localStorage.getItem("director_leaves") || "[]");
    return directorLeaves.filter(l => l.employeeId === employeeId);
  }, [employeeId]);

  // Calculate exchange leave balance from approved add/take requests
  const calculateExchangeBalance = useCallback(() => {
    const allLeaves = getUpdatedLeaveRequests();
    const exchangeLeaves = allLeaves.filter(l => l.type === "exchange" && l.status === "approved");
    
    let balance = 0;
    exchangeLeaves.forEach(leave => {
      if (leave.isAddLeave) {
        balance++; // Earned a leave
      } else {
        balance--; // Used a leave
      }
    });
    
    return Math.max(0, balance);
  }, [getUpdatedLeaveRequests]);

  // Update leave balance based on approved leaves
  const updateLeaveBalanceFromApproved = useCallback(() => {
    const approvedLeaves = getUpdatedLeaveRequests().filter(l => l.status === "approved");
    const balance = { paid: 12, medical: 6, exchange: 0 };
    
    // Calculate paid and medical used
    approvedLeaves.forEach(leave => {
      if (leave.type === "paid") balance.paid--;
      if (leave.type === "medical") balance.medical--;
    });
    
    // Calculate exchange balance
    balance.exchange = calculateExchangeBalance();
    
    // Ensure non-negative
    balance.paid = Math.max(0, balance.paid);
    balance.medical = Math.max(0, balance.medical);
    
    setLeaveBalance(balance);
    saveData("leave_balance", balance);
    return balance;
  }, [getUpdatedLeaveRequests, calculateExchangeBalance, employeeId]);

  // Get pending exchange add requests (for showing earned but not approved)
  const getPendingExchangeAdds = useCallback(() => {
    const allLeaves = getUpdatedLeaveRequests();
    return allLeaves.filter(l => l.type === "exchange" && l.isAddLeave && l.status === "pending").length;
  }, [getUpdatedLeaveRequests]);

  return {
    // Calendar
    events, addEvent, updateEvent, deleteEvent,
    // Notes
    notes, addNote, deleteNote,
    // Tasks
    personalTasks, addPersonalTask, updatePersonalTask, deletePersonalTask,
    getAssignedTasks, completeAssignedTask,
    // Contacts
    contacts, addContact, deleteContact,
    // Requirements
    requirements, addRequirement,
    // Payments
    travelExpenses, addTravelExpense,
    miscPayments, addMiscPayment,
    // Leaves
    leaveRequests, requestLeave, getUpdatedLeaveRequests, 
    leaveBalance, updateLeaveBalanceFromApproved,
    addExchangeLeave, takeExchangeLeave,
    calculateExchangeBalance, getPendingExchangeAdds,
    // Reports
    reports, addReport,
    // Notices
    getNotices,
  };
};
