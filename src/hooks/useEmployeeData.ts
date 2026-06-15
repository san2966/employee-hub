import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  isAddLeave?: boolean;
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
  // localStorage items (personal, no DB table)
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);

  // Supabase items
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [travelExpenses, setTravelExpenses] = useState<TravelExpense[]>([]);
  const [miscPayments, setMiscPayments] = useState<MiscPayment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [leaveBalance, setLeaveBalance] = useState({ paid: 12, medical: 6, exchange: 0 });
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);

  // Load localStorage items
  useEffect(() => {
    if (!employeeId) return;
    const loadData = <T,>(key: string, defaultVal: T): T => {
      const data = localStorage.getItem(getEmployeeStorageKey(employeeId, key));
      return data ? JSON.parse(data) : defaultVal;
    };
    setEvents(loadData("events", []));
    setNotes(loadData("notes", []));
    setPersonalTasks(loadData("personal_tasks", []));
  }, [employeeId]);

  const saveData = <T,>(key: string, data: T) => {
    localStorage.setItem(getEmployeeStorageKey(employeeId, key), JSON.stringify(data));
  };

  // ─── Supabase: Contacts (read from shared contacts table) ───
  const fetchContacts = useCallback(async () => {
    const { data } = await supabase.from("contacts").select("*").eq("is_active", true);
    if (data) {
      setContacts(data.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        designation: c.designation || undefined,
        department: c.department || undefined,
        organization: c.department || "",
        email: c.email || undefined,
      })));
    }
  }, []);

  // ─── Supabase: Leave Requests ───
  const fetchLeaveRequests = useCallback(async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from("leave_requests")
      .select("*, employees!leave_requests_employee_id_fkey(name)")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });
    if (data) {
      setLeaveRequests(data.map(l => ({
        id: l.id,
        employeeId: l.employee_id,
        employeeName: (l.employees as any)?.name || "",
        date: l.date,
        reason: l.reason,
        type: l.leave_type as LeaveRequest["type"],
        status: (l.status || "pending") as LeaveRequest["status"],
        rejectionReason: l.rejection_reason || undefined,
        medicalCertificate: l.medical_certificate || undefined,
        workingDate: l.working_date || undefined,
        workingReason: l.working_reason || undefined,
        createdAt: l.created_at || new Date().toISOString(),
        isAddLeave: l.is_add_leave || false,
      })));
    }
  }, [employeeId]);

  // ─── Supabase: Employee Payments (travel + misc) ───
  const fetchPayments = useCallback(async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from("employee_payments")
      .select("*, employees!employee_payments_employee_id_fkey(name)")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });
    if (data) {
      const travel: TravelExpense[] = [];
      const misc: MiscPayment[] = [];
      data.forEach(p => {
        const empName = (p.employees as any)?.name || "";
        if (p.category === "travel") {
          // Parse description for from/to/purpose
          let from = "", to = "", purpose = p.description;
          try {
            const parsed = JSON.parse(p.description);
            from = parsed.from || "";
            to = parsed.to || "";
            purpose = parsed.purpose || p.description;
          } catch { /* plain text */ }
          travel.push({
            id: p.id,
            employeeId: p.employee_id,
            employeeName: empName,
            from, to, purpose,
            date: p.date,
            receiptUrl: p.receipt_url || undefined,
            amount: Number(p.amount),
            timestamp: p.created_at || new Date().toISOString(),
          });
        } else {
          misc.push({
            id: p.id,
            employeeId: p.employee_id,
            employeeName: empName,
            date: p.date,
            purpose: p.description,
            receiptUrl: p.receipt_url || undefined,
            amount: Number(p.amount),
            timestamp: p.created_at || new Date().toISOString(),
          });
        }
      });
      setTravelExpenses(travel);
      setMiscPayments(misc);
    }
  }, [employeeId]);

  // ─── Supabase: Reports (daily_reports) ───
  const fetchReports = useCallback(async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from("daily_reports")
      .select("*, employees!daily_reports_employee_id_fkey(name)")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });
    if (data) {
      setReports(data.map(r => {
        const empName = (r.employees as any)?.name || "";
        let parsed: any = {};
        try { parsed = JSON.parse(r.content); } catch { parsed = { description: r.content }; }
        return {
          id: r.id,
          employeeId: r.employee_id,
          employeeName: empName,
          date: r.date,
          department: parsed.department || "",
          task: parsed.task || "",
          status: parsed.status || "pending",
          description: parsed.description || r.content,
          additionalInfo: parsed.additionalInfo || undefined,
          createdAt: r.created_at || new Date().toISOString(),
        };
      }));
    }
  }, [employeeId]);

  // ─── Supabase: Requirements ───
  const fetchRequirements = useCallback(async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from("requirements")
      .select("*, employees:requested_by(name)")
      .eq("requested_by", employeeId)
      .order("created_at", { ascending: false });
    if (data) {
      setRequirements(data.map(r => {
        let parsed: any = {};
        try { parsed = JSON.parse(r.description); } catch { parsed = { description: r.description }; }
        return {
          id: r.id,
          employeeId: r.requested_by || employeeId,
          employeeName: (r.employees as any)?.name || "",
          title: r.title,
          description: parsed.description || r.description,
          whyNeeded: parsed.whyNeeded || "",
          link: parsed.link || undefined,
          expectedCost: parsed.expectedCost || undefined,
          status: (r.status || "pending") as Requirement["status"],
          createdAt: r.created_at || new Date().toISOString(),
        };
      }));
    }
  }, [employeeId]);

  // ─── Supabase: Tasks assigned to this employee (from Director / Manager) ───
  const fetchAssignedTasks = useCallback(async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", employeeId)
      .order("created_at", { ascending: false });
    if (data) {
      setAssignedTasks(data.map((t: any) => ({
        id: t.id,
        employeeId: t.assigned_to || employeeId,
        subject: t.title,
        description: t.description || "",
        status: t.status === "completed" ? "completed" : "in-progress",
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        isPersonal: false,
      })));
    }
  }, [employeeId]);

  // ─── Supabase: Notices ───
  const fetchNotices = useCallback(async () => {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    return (data || []).map(n => ({
      id: n.id,
      type: "announcement" as const,
      title: n.title,
      content: n.content,
      recipients: ["all"],
      createdAt: n.created_at || new Date().toISOString(),
    }));
  }, []);

  // ─── Load all Supabase data + realtime ───
  useEffect(() => {
    if (!employeeId) return;
    fetchContacts();
    fetchLeaveRequests();
    fetchPayments();
    fetchReports();
    fetchRequirements();
    fetchAssignedTasks();

    const channel = supabase
      .channel(`employee-${employeeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, fetchLeaveRequests)
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_payments" }, fetchPayments)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_reports" }, fetchReports)
      .on("postgres_changes", { event: "*", schema: "public", table: "requirements" }, fetchRequirements)
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, fetchContacts)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchAssignedTasks)
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => {})
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [employeeId, fetchContacts, fetchLeaveRequests, fetchPayments, fetchReports, fetchRequirements, fetchAssignedTasks]);

  // ─── Leave balance from DB employee record ───
  useEffect(() => {
    if (!employeeId) return;
    const fetchBalance = async () => {
      const { data } = await supabase
        .from("employees")
        .select("paid_leave_balance, medical_leave_balance, exchange_leave_balance")
        .eq("id", employeeId)
        .single();
      if (data) {
        setLeaveBalance({
          paid: data.paid_leave_balance ?? 12,
          medical: data.medical_leave_balance ?? 6,
          exchange: data.exchange_leave_balance ?? 0,
        });
      }
    };
    fetchBalance();
    const channel = supabase
      .channel(`employee-balance-${employeeId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "employees", filter: `id=eq.${employeeId}` },
        () => fetchBalance()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [employeeId]);

  // ════════════════════════════════════════════
  // Calendar Events (localStorage)
  // ════════════════════════════════════════════
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

  // ════════════════════════════════════════════
  // Notes (localStorage)
  // ════════════════════════════════════════════
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

  // ════════════════════════════════════════════
  // Personal Tasks (localStorage)
  // ════════════════════════════════════════════
  const addPersonalTask = useCallback((task: { subject: string; description: string }) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: crypto.randomUUID(), employeeId, subject: task.subject, description: task.description,
      status: "in-progress", createdAt: now, updatedAt: now, isPersonal: true,
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

  // ════════════════════════════════════════════
  // Contacts (Supabase - read-only for employees, shared table)
  // ════════════════════════════════════════════
  const addContact = useCallback(async (contact: Omit<Contact, "id">) => {
    // Employees can read contacts but adding goes to the shared table
    // This will only work if RLS allows it - currently employees have read access
    // For personal contacts, keep in localStorage as fallback
    const personalContacts = JSON.parse(localStorage.getItem(getEmployeeStorageKey(employeeId, "contacts")) || "[]");
    const newContact = { ...contact, id: crypto.randomUUID() };
    const updated = [...personalContacts, newContact];
    localStorage.setItem(getEmployeeStorageKey(employeeId, "contacts"), JSON.stringify(updated));
    // Merge with DB contacts
    setContacts(prev => [...prev, newContact]);
    return newContact;
  }, [employeeId]);

  const deleteContact = useCallback((id: string) => {
    // Only delete personal contacts from localStorage
    const personalContacts = JSON.parse(localStorage.getItem(getEmployeeStorageKey(employeeId, "contacts")) || "[]");
    const updated = personalContacts.filter((c: Contact) => c.id !== id);
    localStorage.setItem(getEmployeeStorageKey(employeeId, "contacts"), JSON.stringify(updated));
    setContacts(prev => prev.filter(c => c.id !== id));
  }, [employeeId]);

  // Load personal contacts and merge with DB contacts
  useEffect(() => {
    if (!employeeId) return;
    const personalContacts = JSON.parse(localStorage.getItem(getEmployeeStorageKey(employeeId, "contacts")) || "[]");
    if (personalContacts.length > 0) {
      setContacts(prev => {
        const dbIds = new Set(prev.map(c => c.id));
        const unique = personalContacts.filter((c: Contact) => !dbIds.has(c.id));
        return [...prev, ...unique];
      });
    }
  }, [employeeId]);

  // ════════════════════════════════════════════
  // Requirements (Supabase)
  // ════════════════════════════════════════════
  const addRequirement = useCallback(async (req: {
    title: string; description: string; whyNeeded: string;
    link?: string; expectedCost?: number; employeeName: string;
  }) => {
    const payload = {
      title: req.title,
      description: JSON.stringify({
        description: req.description,
        whyNeeded: req.whyNeeded,
        link: req.link,
        expectedCost: req.expectedCost,
      }),
      requested_by: employeeId,
      status: "pending" as const,
      priority: "medium" as const,
    };
    const { data, error } = await supabase.from("requirements").insert(payload).select().single();
    if (!error && data) {
      await fetchRequirements();
    }
    return data;
  }, [employeeId, fetchRequirements]);

  // ════════════════════════════════════════════
  // Travel Expenses (Supabase - employee_payments with category=travel)
  // ════════════════════════════════════════════
  const addTravelExpense = useCallback(async (expense: Omit<TravelExpense, "id" | "employeeId" | "timestamp">) => {
    const { error } = await supabase.from("employee_payments").insert({
      employee_id: employeeId,
      date: expense.date,
      description: JSON.stringify({ from: expense.from, to: expense.to, purpose: expense.purpose }),
      amount: expense.amount,
      category: "travel",
      receipt_url: expense.receiptUrl || null,
    });
    if (!error) await fetchPayments();
  }, [employeeId, fetchPayments]);

  // ════════════════════════════════════════════
  // Misc Payments (Supabase - employee_payments with category=misc)
  // ════════════════════════════════════════════
  const addMiscPayment = useCallback(async (payment: Omit<MiscPayment, "id" | "employeeId" | "timestamp">) => {
    const { error } = await supabase.from("employee_payments").insert({
      employee_id: employeeId,
      date: payment.date,
      description: payment.purpose,
      amount: payment.amount,
      category: "misc",
      receipt_url: payment.receiptUrl || null,
    });
    if (!error) await fetchPayments();
  }, [employeeId, fetchPayments]);

  // ════════════════════════════════════════════
  // Leave Requests (Supabase)
  // ════════════════════════════════════════════
  const requestLeave = useCallback(async (leave: {
    date: string; reason: string; type: "paid" | "medical" | "exchange";
    employeeName: string; medicalCertificate?: string;
    workingDate?: string; workingReason?: string; isAddLeave?: boolean;
  }) => {
    const { error } = await supabase.from("leave_requests").insert({
      employee_id: employeeId,
      date: leave.date,
      reason: leave.reason,
      leave_type: leave.type,
      medical_certificate: leave.medicalCertificate || null,
      working_date: leave.workingDate || null,
      working_reason: leave.workingReason || null,
      is_add_leave: leave.isAddLeave || false,
    });
    if (!error) await fetchLeaveRequests();
  }, [employeeId, fetchLeaveRequests]);

  const addExchangeLeave = useCallback((data: {
    workingDate: string; workingReason: string; employeeName: string;
  }) => {
    return requestLeave({
      date: data.workingDate,
      reason: `Worked on ${data.workingDate}: ${data.workingReason}`,
      type: "exchange", employeeName: data.employeeName,
      workingDate: data.workingDate, workingReason: data.workingReason, isAddLeave: true,
    });
  }, [requestLeave]);

  const takeExchangeLeave = useCallback((data: {
    leaveDate: string; leaveReason: string; employeeName: string;
  }) => {
    return requestLeave({
      date: data.leaveDate, reason: data.leaveReason,
      type: "exchange", employeeName: data.employeeName, isAddLeave: false,
    });
  }, [requestLeave]);

  // ════════════════════════════════════════════
  // Reports (Supabase - daily_reports)
  // ════════════════════════════════════════════
  const addReport = useCallback(async (report: {
    date: string; department: string; task: string;
    status: "completed" | "pending"; description: string;
    additionalInfo?: string; employeeName: string;
  }) => {
    const content = JSON.stringify({
      department: report.department, task: report.task,
      status: report.status, description: report.description,
      additionalInfo: report.additionalInfo,
    });
    const { error } = await supabase.from("daily_reports").insert({
      employee_id: employeeId,
      date: report.date,
      content,
    });
    if (!error) await fetchReports();
  }, [employeeId, fetchReports]);

  // ════════════════════════════════════════════
  // Assigned Tasks (Supabase - tasks table, read-only for employees)
  // ════════════════════════════════════════════
  const getAssignedTasks = useCallback((): Task[] => assignedTasks, [assignedTasks]);

  const completeAssignedTask = useCallback(async (taskId: string) => {
    await supabase.from("tasks").update({
      status: "completed",
      completed_at: new Date().toISOString(),
    }).eq("id", taskId);
    await fetchAssignedTasks();
  }, [fetchAssignedTasks]);

  // ════════════════════════════════════════════
  // Notices (Supabase)
  // ════════════════════════════════════════════
  const getNotices = useCallback((): Notice[] => {
    // This is synchronous for backward compat - notices loaded via state
    return [];
  }, []);

  // Async notices loader
  const [noticesList, setNoticesList] = useState<Notice[]>([]);
  useEffect(() => {
    fetchNotices().then(setNoticesList);
    const channel = supabase
      .channel(`employee-notices-${employeeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => {
        fetchNotices().then(setNoticesList);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotices, employeeId]);

  // Override getNotices to return loaded notices
  const getNoticesSync = useCallback((): Notice[] => noticesList, [noticesList]);

  // ════════════════════════════════════════════
  // Leave balance helpers
  // ════════════════════════════════════════════
  const getUpdatedLeaveRequests = useCallback((): LeaveRequest[] => leaveRequests, [leaveRequests]);

  const calculateExchangeBalance = useCallback(() => {
    return leaveBalance.exchange;
  }, [leaveBalance]);

  const updateLeaveBalanceFromApproved = useCallback(() => {
    return leaveBalance;
  }, [leaveBalance]);

  const getPendingExchangeAdds = useCallback(() => {
    return leaveRequests.filter(l => l.type === "exchange" && l.isAddLeave && l.status === "pending").length;
  }, [leaveRequests]);

  return {
    events, addEvent, updateEvent, deleteEvent,
    notes, addNote, deleteNote,
    personalTasks, addPersonalTask, updatePersonalTask, deletePersonalTask,
    getAssignedTasks, completeAssignedTask,
    contacts, addContact, deleteContact,
    requirements, addRequirement,
    travelExpenses, addTravelExpense,
    miscPayments, addMiscPayment,
    leaveRequests, requestLeave, getUpdatedLeaveRequests,
    leaveBalance, updateLeaveBalanceFromApproved,
    addExchangeLeave, takeExchangeLeave,
    calculateExchangeBalance, getPendingExchangeAdds,
    reports, addReport,
    getNotices: getNoticesSync,
  };
};
