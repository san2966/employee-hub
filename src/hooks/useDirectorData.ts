import { useState, useEffect } from "react";

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
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// Storage keys
const STORAGE_KEYS = {
  events: "director_events",
  notes: "director_notes",
  organizations: "director_organizations",
  employees: "director_employees",
  tasks: "director_tasks",
  products: "director_products",
  contacts: "director_contacts",
  leaves: "director_leaves",
  notices: "director_notices",
  requirements: "director_requirements",
};

// Helper functions
const getStoredData = <T>(key: string, defaultValue: T[]): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setStoredData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Custom hook for director data management
export const useDirectorData = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  // Load data on mount
  useEffect(() => {
    setEvents(getStoredData(STORAGE_KEYS.events, []));
    setNotes(getStoredData(STORAGE_KEYS.notes, []));
    setOrganizations(getStoredData(STORAGE_KEYS.organizations, []));
    setEmployees(getStoredData(STORAGE_KEYS.employees, []));
    setTasks(getStoredData(STORAGE_KEYS.tasks, []));
    setProducts(getStoredData(STORAGE_KEYS.products, []));
    setContacts(getStoredData(STORAGE_KEYS.contacts, []));
    setLeaves(getStoredData(STORAGE_KEYS.leaves, []));
    setNotices(getStoredData(STORAGE_KEYS.notices, []));
    setRequirements(getStoredData(STORAGE_KEYS.requirements, []));
  }, []);

  // Event methods
  const addEvent = (event: Omit<CalendarEvent, "id">) => {
    const newEvent = { ...event, id: crypto.randomUUID() };
    const updated = [...events, newEvent];
    setEvents(updated);
    setStoredData(STORAGE_KEYS.events, updated);
    return newEvent;
  };

  const updateEvent = (id: string, data: Partial<CalendarEvent>) => {
    const updated = events.map(e => e.id === id ? { ...e, ...data } : e);
    setEvents(updated);
    setStoredData(STORAGE_KEYS.events, updated);
  };

  const deleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    setStoredData(STORAGE_KEYS.events, updated);
  };

  // Note methods
  const addNote = (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newNote = { ...note, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setStoredData(STORAGE_KEYS.notes, updated);
    return newNote;
  };

  const updateNote = (id: string, data: Partial<Note>) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n);
    setNotes(updated);
    setStoredData(STORAGE_KEYS.notes, updated);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    setStoredData(STORAGE_KEYS.notes, updated);
  };

  // Organization methods
  const addOrganization = (org: Omit<Organization, "id" | "status">) => {
    const newOrg: Organization = {
      ...org,
      id: crypto.randomUUID(),
      status: {
        proposalSubmitted: false,
        presentationDone: false,
        followup: false,
        tender: false,
        bidRaised: false,
        bidAwarded: false,
        workOrder: false,
        deliveryInitiated: false,
        deliveryDone: false,
        paymentDone: false,
      },
    };
    const updated = [...organizations, newOrg];
    setOrganizations(updated);
    setStoredData(STORAGE_KEYS.organizations, updated);
    return newOrg;
  };

  const updateOrganization = (id: string, data: Partial<Organization>) => {
    const updated = organizations.map(o => o.id === id ? { ...o, ...data } : o);
    setOrganizations(updated);
    setStoredData(STORAGE_KEYS.organizations, updated);
  };

  const deleteOrganization = (id: string) => {
    const updated = organizations.filter(o => o.id !== id);
    setOrganizations(updated);
    setStoredData(STORAGE_KEYS.organizations, updated);
  };

  // Task methods
  const addTask = (task: Omit<Task, "id" | "status" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newTask: Task = { ...task, id: crypto.randomUUID(), status: "in-progress", createdAt: now, updatedAt: now };
    const updated = [...tasks, newTask];
    setTasks(updated);
    setStoredData(STORAGE_KEYS.tasks, updated);
    return newTask;
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t);
    setTasks(updated);
    setStoredData(STORAGE_KEYS.tasks, updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    setStoredData(STORAGE_KEYS.tasks, updated);
  };

  // Product methods
  const addProduct = (product: Omit<Product, "id" | "sales">) => {
    const newProduct: Product = { ...product, id: crypto.randomUUID(), sales: [] };
    const updated = [...products, newProduct];
    setProducts(updated);
    setStoredData(STORAGE_KEYS.products, updated);
    return newProduct;
  };

  const sellProduct = (id: string, quantity: number, date: string) => {
    const year = new Date(date).getFullYear();
    const updated = products.map(p => {
      if (p.id === id) {
        return { ...p, sales: [...p.sales, { year, quantity, date }] };
      }
      return p;
    });
    setProducts(updated);
    setStoredData(STORAGE_KEYS.products, updated);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    setStoredData(STORAGE_KEYS.products, updated);
  };

  // Contact methods
  const addContact = (contact: Omit<Contact, "id">) => {
    const newContact = { ...contact, id: crypto.randomUUID() };
    const updated = [...contacts, newContact];
    setContacts(updated);
    setStoredData(STORAGE_KEYS.contacts, updated);
    return newContact;
  };

  const deleteContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    setStoredData(STORAGE_KEYS.contacts, updated);
  };

  // Leave methods
  const updateLeave = (id: string, status: "approved" | "rejected", rejectionReason?: string) => {
    const updated = leaves.map(l => l.id === id ? { ...l, status, rejectionReason } : l);
    setLeaves(updated);
    setStoredData(STORAGE_KEYS.leaves, updated);
  };

  // Notice methods
  const addNotice = (notice: Omit<Notice, "id" | "createdAt">) => {
    const newNotice = { ...notice, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updated = [newNotice, ...notices];
    setNotices(updated);
    setStoredData(STORAGE_KEYS.notices, updated);
    return newNotice;
  };

  // Get tasks per day for graph
  const getTasksPerDay = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = days.map(() => 0);
    
    tasks.forEach(task => {
      const dayIndex = new Date(task.createdAt).getDay();
      counts[dayIndex]++;
    });

    return days.map((day, index) => ({ day, tasks: counts[index] }));
  };

  // Get product sales per year for graph
  const getProductSalesPerYear = () => {
    const salesByYear: Record<number, number> = {};
    
    products.forEach(product => {
      product.sales.forEach(sale => {
        salesByYear[sale.year] = (salesByYear[sale.year] || 0) + sale.quantity;
      });
    });

    const years = Object.keys(salesByYear).map(Number).sort();
    if (years.length === 0) {
      const currentYear = new Date().getFullYear();
      return [{ year: currentYear, sales: 0 }];
    }

    return years.map(year => ({ year, sales: salesByYear[year] }));
  };

  return {
    events, addEvent, updateEvent, deleteEvent,
    notes, addNote, updateNote, deleteNote,
    organizations, addOrganization, updateOrganization, deleteOrganization,
    employees, setEmployees,
    tasks, addTask, updateTask, deleteTask, getTasksPerDay,
    products, addProduct, sellProduct, deleteProduct, getProductSalesPerYear,
    contacts, addContact, deleteContact,
    leaves, updateLeave, setLeaves,
    notices, addNotice,
    requirements, setRequirements,
  };
};
