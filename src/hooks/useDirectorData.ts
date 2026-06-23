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
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  ministry: string;
  status: {
    proposalSubmitted: boolean;
    presentationDone: boolean;
    followup: boolean;
    tender: boolean;
    bidRaised: boolean;
    bidAwarded: boolean;
    workOrder: boolean;
    deliveryInitiated: boolean;
    deliveryDone: boolean;
    paymentDone: boolean;
  };
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  joinDate: string;
}

export interface Task {
  id: string;
  employeeId: string;
  subject: string;
  description: string;
  status: "in-progress" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  model: string;
  description: string;
  image?: string;
  sales: { year: number; quantity: number; date: string }[];
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  designation: string;
  department: string;
  organization: string;
  email: string;
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
  isAddLeave?: boolean;
  createdAt?: string;
}

export interface Notice {
  id: string;
  type: "notice" | "announcement";
  title: string;
  content: string;
  recipients: string[];
  createdAt: string;
}

export interface Requirement {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  whyNeeded?: string;
  link?: string;
  expectedCost?: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// localStorage helpers for features without DB tables
const getStoredData = <T>(key: string, defaultValue: T[]): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};
const setStoredData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const useDirectorData = () => {
  // localStorage-backed (no DB tables for these)
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Supabase-backed
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  // Load localStorage data
  useEffect(() => {
    setEvents(getStoredData("director_events", []));
    setNotes(getStoredData("director_notes", []));
    setOrganizations(getStoredData("director_organizations", []));
  }, []);

  // ---- Supabase fetchers ----
  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, email, designation, phone, date_of_joining, additional_charge")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) { console.error("Error:", error); return; }
    setEmployees((data || []).map(e => ({
      id: e.id, name: e.name, email: e.email,
      department: e.additional_charge || "General",
      designation: e.designation, phone: e.phone,
      joinDate: e.date_of_joining,
    })));
  }, []);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(`*, employees!tasks_assigned_to_fkey(name)`)
      .order("created_at", { ascending: false });
    if (error) { console.error("Error:", error); return; }
    setTasks((data || []).map((t: any) => ({
      id: t.id, employeeId: t.assigned_to || "",
      subject: t.title, description: t.description || "",
      status: t.status === "completed" ? "completed" : t.status === "in_progress" ? "in-progress" : "in-progress" as any,
      createdAt: t.created_at, updatedAt: t.updated_at,
    })));
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) { console.error("Error:", error); return; }
    setProducts((data || []).map(p => ({
      id: p.id, name: p.name, model: p.unit || "",
      description: p.description || "", image: "",
      sales: [], // Sales data would need a separate table
    })));
  }, []);

  const fetchContacts = useCallback(async () => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) { console.error("Error:", error); return; }
    setContacts((data || []).map(c => ({
      id: c.id, name: c.name, phone: c.phone,
      designation: c.designation, department: c.department,
      organization: "", email: c.email || "",
    })));
  }, []);

  const fetchLeaves = useCallback(async () => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select(`*, employees(name)`)
      .order("created_at", { ascending: false });
    if (error) { console.error("Error:", error); return; }
    setLeaves((data || []).map((l: any) => ({
      id: l.id, employeeId: l.employee_id,
      employeeName: l.employees?.name || "Unknown",
      date: l.date, reason: l.reason,
      type: l.leave_type as "paid" | "medical" | "exchange",
      status: l.status as "pending" | "approved" | "rejected",
      rejectionReason: l.rejection_reason,
      medicalCertificate: l.medical_certificate,
      workingDate: l.working_date,
      workingReason: l.working_reason,
      isAddLeave: l.is_add_leave,
      createdAt: l.created_at,
    })));
  }, []);

  const fetchNotices = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("notices")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) { console.error("Error:", error); return; }
    setNotices((data || []).map((n: any) => ({
      id: n.id, type: (n.notice_type || (n.is_global === false ? "notice" : "announcement")) as "notice" | "announcement",
      title: n.title, content: n.content,
      recipients: Array.isArray(n.recipient_employee_ids) ? n.recipient_employee_ids : [],
      createdAt: n.created_at || "",
    })));
  }, []);

  const fetchRequirements = useCallback(async () => {
    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("Error:", error); return; }
    setRequirements((data || []).map((r: any) => {
      let description = r.description || "";
      let whyNeeded = r.why_needed || "";
      let link = r.link_url || "";
      let expectedCost = r.expected_cost;
      if (typeof description === "string" && description.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(description);
          description = parsed.description ?? description;
          whyNeeded = whyNeeded || parsed.whyNeeded || "";
          link = link || parsed.link || "";
          if (expectedCost == null && parsed.expectedCost != null) expectedCost = Number(parsed.expectedCost);
        } catch { /* keep original text */ }
      }

      return {
        id: r.id,
        employeeId: r.requested_by || "",
        employeeName: r.employee_name || "Employee",
        title: r.title,
        description,
        whyNeeded,
        link,
        expectedCost: expectedCost != null ? Number(expectedCost) : undefined,
        status: (r.status || "pending") as "pending" | "approved" | "rejected",
        createdAt: r.created_at,
      };
    }));
  }, []);

  // Initial load
  useEffect(() => {
    fetchEmployees();
    fetchTasks();
    fetchProducts();
    fetchContacts();
    fetchLeaves();
    fetchNotices();
    fetchRequirements();
  }, [fetchEmployees, fetchTasks, fetchProducts, fetchContacts, fetchLeaves, fetchNotices, fetchRequirements]);

  // Realtime subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel("dir-emp").on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => fetchEmployees()).subscribe(),
      supabase.channel("dir-tasks").on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks()).subscribe(),
      supabase.channel("dir-products").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts()).subscribe(),
      supabase.channel("dir-contacts").on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, () => fetchContacts()).subscribe(),
      supabase.channel("dir-leaves").on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => fetchLeaves()).subscribe(),
      supabase.channel("dir-notices").on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => fetchNotices()).subscribe(),
      supabase.channel("dir-reqs").on("postgres_changes", { event: "*", schema: "public", table: "requirements" }, () => fetchRequirements()).subscribe(),
    ];

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [fetchEmployees, fetchTasks, fetchProducts, fetchContacts, fetchLeaves, fetchNotices, fetchRequirements]);

  // ---- Event methods (localStorage) ----
  const addEvent = (event: Omit<CalendarEvent, "id">) => {
    const newEvent = { ...event, id: crypto.randomUUID() };
    const updated = [...events, newEvent];
    setEvents(updated);
    setStoredData("director_events", updated);
    return newEvent;
  };
  const updateEvent = (id: string, data: Partial<CalendarEvent>) => {
    const updated = events.map(e => e.id === id ? { ...e, ...data } : e);
    setEvents(updated);
    setStoredData("director_events", updated);
  };
  const deleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    setStoredData("director_events", updated);
  };

  // ---- Note methods (localStorage) ----
  const addNote = (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newNote = { ...note, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setStoredData("director_notes", updated);
    return newNote;
  };
  const updateNote = (id: string, data: Partial<Note>) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n);
    setNotes(updated);
    setStoredData("director_notes", updated);
  };
  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    setStoredData("director_notes", updated);
  };

  // ---- Organization methods (localStorage) ----
  const addOrganization = (org: Omit<Organization, "id" | "status">) => {
    const newOrg: Organization = {
      ...org, id: crypto.randomUUID(),
      status: {
        proposalSubmitted: false, presentationDone: false, followup: false,
        tender: false, bidRaised: false, bidAwarded: false, workOrder: false,
        deliveryInitiated: false, deliveryDone: false, paymentDone: false,
      },
    };
    const updated = [...organizations, newOrg];
    setOrganizations(updated);
    setStoredData("director_organizations", updated);
    return newOrg;
  };
  const updateOrganization = (id: string, data: Partial<Organization>) => {
    const updated = organizations.map(o => o.id === id ? { ...o, ...data } : o);
    setOrganizations(updated);
    setStoredData("director_organizations", updated);
  };
  const deleteOrganization = (id: string) => {
    const updated = organizations.filter(o => o.id !== id);
    setOrganizations(updated);
    setStoredData("director_organizations", updated);
  };

  // ---- Task methods (Supabase) ----
  const addTask = async (task: Omit<Task, "id" | "status" | "createdAt" | "updatedAt">) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: task.subject,
        description: task.description,
        assigned_to: task.employeeId || null,
        status: "in_progress",
        priority: "medium",
      })
      .select()
      .single();

    if (error) throw error;
    await fetchTasks();
    return {
      id: data.id, ...task, status: "in-progress" as const,
      createdAt: data.created_at, updatedAt: data.updated_at,
    };
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    const dbUpdates: any = {};
    if (data.subject) dbUpdates.title = data.subject;
    if (data.description) dbUpdates.description = data.description;
    if (data.status) {
      dbUpdates.status = data.status === "in-progress" ? "in_progress" : data.status;
      if (data.status === "completed") dbUpdates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase.from("tasks").update(dbUpdates).eq("id", id);
    if (error) throw error;
    await fetchTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    await fetchTasks();
  };

  // ---- Product methods (Supabase) ----
  const addProduct = async (product: Omit<Product, "id" | "sales">) => {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: product.name,
        category: product.model || "General",
        description: product.description,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchProducts();
    return { id: data.id, ...product, sales: [] };
  };

  const sellProduct = async (id: string, quantity: number, date: string) => {
    // Update stock in products table
    const product = products.find(p => p.id === id);
    if (!product) return;
    const currentStock = ((product as any)?.stock_quantity ?? 0) as number;
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: currentStock + quantity })
      .eq("id", id);
    if (error) throw error;
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    await fetchProducts();
  };

  // ---- Contact methods (Supabase) ----
  const addContact = async (contact: Omit<Contact, "id">) => {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        name: contact.name,
        phone: contact.phone,
        designation: contact.designation,
        department: contact.department,
        email: contact.email || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchContacts();
    return { id: data.id, ...contact };
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from("contacts").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    await fetchContacts();
  };

  // ---- Leave methods (Supabase) ----
  const updateLeave = async (id: string, status: "approved" | "rejected", rejectionReason?: string) => {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status, rejection_reason: rejectionReason || null })
      .eq("id", id);

    if (error) throw error;
    await fetchLeaves();
  };

  const getLeaveStats = () => {
    const pending = leaves.filter(l => l.status === "pending").length;
    const approved = leaves.filter(l => l.status === "approved").length;
    const rejected = leaves.filter(l => l.status === "rejected").length;
    return { pending, approved, rejected, total: leaves.length };
  };

  // ---- Notice methods (Supabase) ----
  const addNotice = async (notice: Omit<Notice, "id" | "createdAt">) => {
    const isAnnouncement = notice.type === "announcement";
    const { data, error } = await (supabase as any)
      .from("notices")
      .insert({
        title: notice.title,
        content: notice.content,
        notice_type: notice.type,
        recipient_employee_ids: isAnnouncement ? [] : notice.recipients,
        is_global: isAnnouncement,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchNotices();
    return { id: data.id, ...notice, createdAt: data.created_at || "" };
  };

  // ---- Computed ----
  const getTasksPerDay = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = days.map(() => 0);
    tasks.forEach(task => {
      const dayIndex = new Date(task.createdAt).getDay();
      counts[dayIndex]++;
    });
    return days.map((day, index) => ({ day, tasks: counts[index] }));
  };

  const getProductSalesPerYear = () => {
    // Since we don't have a sales table yet, return placeholder
    const currentYear = new Date().getFullYear();
    return [{ year: currentYear, sales: products.length }];
  };

  const refreshLeaves = () => { fetchLeaves(); };

  const updateRequirementStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("requirements").update({ status: status as any }).eq("id", id);
    if (error) { console.error("updateRequirementStatus failed:", error); return; }
    await fetchRequirements();
  };

  return {
    events, addEvent, updateEvent, deleteEvent,
    notes, addNote, updateNote, deleteNote,
    organizations, addOrganization, updateOrganization, deleteOrganization,
    employees, setEmployees,
    tasks, addTask, updateTask, deleteTask, getTasksPerDay,
    products, addProduct, sellProduct, deleteProduct, getProductSalesPerYear,
    contacts, addContact, deleteContact,
    leaves, updateLeave, setLeaves, getLeaveStats, refreshLeaves,
    notices, addNotice,
    requirements, setRequirements, updateRequirementStatus,
  };
};
