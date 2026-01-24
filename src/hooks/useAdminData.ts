import { useState, useEffect } from "react";

export interface AdminPayment {
  id: string;
  date: string;
  purpose: string;
  amount: number;
  document: string;
  createdAt: string;
}

export interface AdminTask {
  id: string;
  employeeId: string;
  employeeName: string;
  subject: string;
  description: string;
  status: "pending" | "completed";
  createdAt: string;
}

export interface Visitor {
  id: string;
  name: string;
  mobile: string;
  organization: string;
  whomToMeet: string;
  purpose: string;
  purposeDescription?: string;
  checkInTime: string;
  createdAt: string;
}

export interface AdminEmployee {
  id: string;
  name: string;
  designation: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  photo: string;
  createdAt: string;
}

export interface InwardRecord {
  id: string;
  date: string;
  senderName: string;
  documentType?: string;
  receiverName: string;
  modeOfReceipt: string[];
  referenceNumber?: string;
  remarks?: string;
  document?: string;
  createdAt: string;
}

export interface OutwardRecord {
  id: string;
  date: string;
  receiverName: string;
  documentType?: string;
  senderName: string;
  modeOfDispatch: string[];
  referenceNumber?: string;
  remarks?: string;
  document?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  brand?: string;
  serialNumber?: string;
  purchaseDate: string;
  cost: number;
  invoiceNumber?: string;
  vendorName?: string;
  warrantyExpiry?: string;
  condition: string;
  image?: string;
  assignedTo?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  type: "Bike" | "Car" | "Other";
  brand: string;
  model: string;
  numberPlate: string;
  createdAt: string;
}

export interface VehicleAssignment {
  id: string;
  vehicleId: string;
  vehicleInfo: string;
  date: string;
  employeeName: string;
  previousKm: number;
  currentKm: number;
  image?: string;
  createdAt: string;
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  vehicleInfo: string;
  date: string;
  quantity: number;
  amount: number;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

const STORAGE_PREFIX = "admin_";

const getStorageKey = (key: string) => `${STORAGE_PREFIX}${key}`;

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(getStorageKey(key));
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  localStorage.setItem(getStorageKey(key), JSON.stringify(value));
};

export const useAdminData = () => {
  const [payments, setPayments] = useState<AdminPayment[]>(() => 
    loadFromStorage("payments", [])
  );
  const [tasks, setTasks] = useState<AdminTask[]>(() => 
    loadFromStorage("tasks", [])
  );
  const [visitors, setVisitors] = useState<Visitor[]>(() => 
    loadFromStorage("visitors", [])
  );
  const [employees, setEmployees] = useState<AdminEmployee[]>(() => 
    loadFromStorage("employees", [])
  );
  const [inwardRecords, setInwardRecords] = useState<InwardRecord[]>(() => 
    loadFromStorage("inward", [])
  );
  const [outwardRecords, setOutwardRecords] = useState<OutwardRecord[]>(() => 
    loadFromStorage("outward", [])
  );
  const [assets, setAssets] = useState<Asset[]>(() => 
    loadFromStorage("assets", [])
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => 
    loadFromStorage("vehicles", [])
  );
  const [vehicleAssignments, setVehicleAssignments] = useState<VehicleAssignment[]>(() => 
    loadFromStorage("vehicleAssignments", [])
  );
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>(() => 
    loadFromStorage("fuelEntries", [])
  );
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => 
    loadFromStorage("calendarEvents", [])
  );
  const [notes, setNotes] = useState<Note[]>(() => 
    loadFromStorage("notes", [])
  );

  // Save to localStorage whenever data changes
  useEffect(() => saveToStorage("payments", payments), [payments]);
  useEffect(() => saveToStorage("tasks", tasks), [tasks]);
  useEffect(() => saveToStorage("visitors", visitors), [visitors]);
  useEffect(() => saveToStorage("employees", employees), [employees]);
  useEffect(() => saveToStorage("inward", inwardRecords), [inwardRecords]);
  useEffect(() => saveToStorage("outward", outwardRecords), [outwardRecords]);
  useEffect(() => saveToStorage("assets", assets), [assets]);
  useEffect(() => saveToStorage("vehicles", vehicles), [vehicles]);
  useEffect(() => saveToStorage("vehicleAssignments", vehicleAssignments), [vehicleAssignments]);
  useEffect(() => saveToStorage("fuelEntries", fuelEntries), [fuelEntries]);
  useEffect(() => saveToStorage("calendarEvents", calendarEvents), [calendarEvents]);
  useEffect(() => saveToStorage("notes", notes), [notes]);

  // Sync payments to Accounts module
  useEffect(() => {
    const accountsVouchers = loadFromStorage("accounts_vouchers", []);
    const adminPaymentIds = payments.map(p => p.id);
    
    const newVouchers = payments
      .filter(p => !accountsVouchers.some((v: any) => v.id === p.id))
      .map(p => ({
        id: p.id,
        employeeName: "Admin",
        amount: p.amount,
        date: p.date,
        purpose: p.purpose,
        receiptUrl: p.document,
        createdAt: p.createdAt,
      }));

    if (newVouchers.length > 0) {
      localStorage.setItem("accounts_vouchers", JSON.stringify([...accountsVouchers, ...newVouchers]));
    }
  }, [payments]);

  // Payment functions
  const addPayment = (payment: Omit<AdminPayment, "id" | "createdAt">) => {
    const newPayment: AdminPayment = {
      ...payment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setPayments(prev => [...prev, newPayment]);
    return newPayment;
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // Task functions
  const addTask = (task: Omit<AdminTask, "id" | "createdAt" | "status">) => {
    const newTask: AdminTask = {
      ...task,
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTaskStatus = (id: string, status: "pending" | "completed") => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Visitor functions
  const addVisitor = (visitor: Omit<Visitor, "id" | "createdAt" | "checkInTime">) => {
    const newVisitor: Visitor = {
      ...visitor,
      id: crypto.randomUUID(),
      checkInTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setVisitors(prev => [...prev, newVisitor]);
    return newVisitor;
  };

  const deleteVisitor = (id: string) => {
    setVisitors(prev => prev.filter(v => v.id !== id));
  };

  // Employee functions
  const addEmployee = (employee: Omit<AdminEmployee, "id" | "createdAt">) => {
    const newEmployee: AdminEmployee = {
      ...employee,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEmployees(prev => [...prev, newEmployee]);
    return newEmployee;
  };

  const updateEmployee = (id: string, data: Partial<AdminEmployee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // Inward/Outward functions
  const addInwardRecord = (record: Omit<InwardRecord, "id" | "createdAt">) => {
    const newRecord: InwardRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setInwardRecords(prev => [...prev, newRecord]);
    return newRecord;
  };

  const addOutwardRecord = (record: Omit<OutwardRecord, "id" | "createdAt">) => {
    const newRecord: OutwardRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setOutwardRecords(prev => [...prev, newRecord]);
    return newRecord;
  };

  // Asset functions
  const addAsset = (asset: Omit<Asset, "id" | "createdAt">) => {
    const newAsset: Asset = {
      ...asset,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setAssets(prev => [...prev, newAsset]);
    return newAsset;
  };

  const updateAsset = (id: string, data: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // Vehicle functions
  const addVehicle = (vehicle: Omit<Vehicle, "id" | "createdAt">) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setVehicles(prev => [...prev, newVehicle]);
    return newVehicle;
  };

  const deleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const addVehicleAssignment = (assignment: Omit<VehicleAssignment, "id" | "createdAt">) => {
    const newAssignment: VehicleAssignment = {
      ...assignment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setVehicleAssignments(prev => [...prev, newAssignment]);
    return newAssignment;
  };

  const addFuelEntry = (entry: Omit<FuelEntry, "id" | "createdAt">) => {
    const newEntry: FuelEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setFuelEntries(prev => [...prev, newEntry]);
    return newEntry;
  };

  // Calendar functions
  const addCalendarEvent = (event: Omit<CalendarEvent, "id" | "createdAt">) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setCalendarEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const updateCalendarEvent = (id: string, data: Partial<CalendarEvent>) => {
    setCalendarEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  // Notes functions
  const addNote = (content: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, newNote]);
    return newNote;
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return {
    // Data
    payments,
    tasks,
    visitors,
    employees,
    inwardRecords,
    outwardRecords,
    assets,
    vehicles,
    vehicleAssignments,
    fuelEntries,
    calendarEvents,
    notes,
    // Payment functions
    addPayment,
    deletePayment,
    // Task functions
    addTask,
    updateTaskStatus,
    deleteTask,
    // Visitor functions
    addVisitor,
    deleteVisitor,
    // Employee functions
    addEmployee,
    updateEmployee,
    deleteEmployee,
    // Inward/Outward functions
    addInwardRecord,
    addOutwardRecord,
    // Asset functions
    addAsset,
    updateAsset,
    deleteAsset,
    // Vehicle functions
    addVehicle,
    deleteVehicle,
    addVehicleAssignment,
    addFuelEntry,
    // Calendar functions
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    // Notes functions
    addNote,
    deleteNote,
  };
};
