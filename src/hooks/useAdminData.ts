import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  source?: "hr" | "admin";
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

// localStorage helpers for features without DB tables
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(`admin_${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  localStorage.setItem(`admin_${key}`, JSON.stringify(value));
};

export const useAdminData = () => {
  // Supabase-backed state
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [inwardRecords, setInwardRecords] = useState<InwardRecord[]>([]);
  const [outwardRecords, setOutwardRecords] = useState<OutwardRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Still localStorage (no DB tables)
  const [tasks, setTasks] = useState<AdminTask[]>(() => loadFromStorage("tasks", []));
  const [vehicleAssignments, setVehicleAssignments] = useState<VehicleAssignment[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => loadFromStorage("calendarEvents", []));
  const [notes, setNotes] = useState<Note[]>(() => loadFromStorage("notes", []));

  // Persist localStorage items
  useEffect(() => saveToStorage("tasks", tasks), [tasks]);
  useEffect(() => saveToStorage("calendarEvents", calendarEvents), [calendarEvents]);
  useEffect(() => saveToStorage("notes", notes), [notes]);

  // ---- Supabase fetchers ----
  const fetchPayments = useCallback(async () => {
    const { data, error } = await supabase
      .from("admin_payments")
      .select("*")
      .order("date", { ascending: false });
    if (error) { console.error("Error fetching payments:", error); return; }
    setPayments((data || []).map(p => ({
      id: p.id, date: p.date, purpose: p.purpose, amount: p.amount,
      document: p.receipt_url || "", createdAt: p.created_at || "",
    })));
  }, []);

  const fetchVisitors = useCallback(async () => {
    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .order("check_in", { ascending: false });
    if (error) { console.error("Error fetching visitors:", error); return; }
    setVisitors((data || []).map(v => ({
      id: v.id, name: v.name, mobile: v.phone, organization: v.company || "",
      whomToMeet: v.person_to_meet, purpose: v.purpose,
      purposeDescription: v.remarks || "", checkInTime: v.check_in || "",
      createdAt: v.created_at || "",
    })));
  }, []);

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("admin_employees")
      .select("*")
      .order("name", { ascending: true });
    if (error) { console.error("Error fetching admin employees:", error); return; }
    setEmployees((data || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      designation: e.designation,
      phone: e.phone,
      alternatePhone: e.alternate_phone || "",
      address: e.address,
      photo: e.photo || "",
      createdAt: e.created_at || "",
    })));
  }, []);

  const fetchInwardOutward = useCallback(async () => {
    const { data, error } = await supabase
      .from("inward_outward")
      .select("*")
      .order("date", { ascending: false });
    if (error) { console.error("Error fetching inward/outward:", error); return; }
    const inward: InwardRecord[] = [];
    const outward: OutwardRecord[] = [];
    (data || []).forEach(e => {
      if (e.register_type === "inward") {
        inward.push({
          id: e.id, date: e.date, senderName: e.sender_receiver,
          documentType: e.document_type, receiverName: "",
          modeOfReceipt: [e.document_type], referenceNumber: e.reference_number || "",
          remarks: e.remarks || "", document: e.attachment_url || "",
          createdAt: e.created_at || "",
        });
      } else {
        outward.push({
          id: e.id, date: e.date, receiverName: e.sender_receiver,
          documentType: e.document_type, senderName: "",
          modeOfDispatch: [e.document_type], referenceNumber: e.reference_number || "",
          remarks: e.remarks || "", document: e.attachment_url || "",
          createdAt: e.created_at || "",
        });
      }
    });
    setInwardRecords(inward);
    setOutwardRecords(outward);
  }, []);

  const fetchAssets = useCallback(async () => {
    const { data, error } = await supabase
      .from("admin_assets")
      .select(`*, employees(name)`)
      .order("created_at", { ascending: false });
    if (error) { console.error("Error fetching assets:", error); return; }
    setAssets((data || []).map((a: any) => ({
      id: a.id, name: a.name, category: a.category, brand: "",
      serialNumber: "", purchaseDate: a.purchase_date || "",
      cost: a.purchase_price || 0, invoiceNumber: "",
      vendorName: a.vendor || "", warrantyExpiry: a.warranty_till || "",
      condition: "Good", image: "", assignedTo: a.employees?.name || a.assigned_to || "",
      createdAt: a.created_at || "",
    })));
  }, []);

  const fetchVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) { console.error("Error fetching vehicles:", error); return; }
    setVehicles((data || []).map(v => ({
      id: v.id, type: v.vehicle_type as "Bike" | "Car" | "Other",
      brand: v.brand, model: v.model, numberPlate: v.vehicle_number,
      createdAt: v.created_at || "",
    })));
  }, []);

  const fetchVehicleAssignments = useCallback(async () => {
    const { data, error } = await supabase
      .from("vehicle_assignments")
      .select("*")
      .order("date", { ascending: false });
    if (error) { console.error("Error fetching vehicle assignments:", error); return; }
    setVehicleAssignments((data || []).map((a: any) => ({
      id: a.id, vehicleId: a.vehicle_id || "", vehicleInfo: a.vehicle_info || "",
      date: a.date, employeeName: a.employee_name,
      previousKm: Number(a.previous_km) || 0, currentKm: Number(a.current_km) || 0,
      image: a.image || "", createdAt: a.created_at || "",
    })));
  }, []);

  const fetchFuelEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("fuel_entries")
      .select("*")
      .order("date", { ascending: false });
    if (error) { console.error("Error fetching fuel entries:", error); return; }
    setFuelEntries((data || []).map((f: any) => ({
      id: f.id, vehicleId: f.vehicle_id || "", vehicleInfo: f.vehicle_info || "",
      date: f.date, quantity: Number(f.quantity) || 0,
      amount: Number(f.amount) || 0, createdAt: f.created_at || "",
    })));
  }, []);

  // Initial load
  useEffect(() => {
    fetchPayments();
    fetchVisitors();
    fetchEmployees();
    fetchInwardOutward();
    fetchAssets();
    fetchVehicles();
    fetchVehicleAssignments();
    fetchFuelEntries();
  }, [fetchPayments, fetchVisitors, fetchEmployees, fetchInwardOutward, fetchAssets, fetchVehicles, fetchVehicleAssignments, fetchFuelEntries]);

  // Realtime subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel("admin-payments-sync").on("postgres_changes", { event: "*", schema: "public", table: "admin_payments" }, () => fetchPayments()).subscribe(),
      supabase.channel("admin-visitors-sync").on("postgres_changes", { event: "*", schema: "public", table: "visitors" }, () => fetchVisitors()).subscribe(),
      supabase.channel("admin-employees-sync").on("postgres_changes", { event: "*", schema: "public", table: "admin_employees" }, () => fetchEmployees()).subscribe(),
      supabase.channel("admin-io-sync").on("postgres_changes", { event: "*", schema: "public", table: "inward_outward" }, () => fetchInwardOutward()).subscribe(),
      supabase.channel("admin-assets-sync").on("postgres_changes", { event: "*", schema: "public", table: "admin_assets" }, () => fetchAssets()).subscribe(),
      supabase.channel("admin-vehicles-sync").on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => fetchVehicles()).subscribe(),
      supabase.channel("admin-va-sync").on("postgres_changes", { event: "*", schema: "public", table: "vehicle_assignments" }, () => fetchVehicleAssignments()).subscribe(),
      supabase.channel("admin-fe-sync").on("postgres_changes", { event: "*", schema: "public", table: "fuel_entries" }, () => fetchFuelEntries()).subscribe(),
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [fetchPayments, fetchVisitors, fetchEmployees, fetchInwardOutward, fetchAssets, fetchVehicles, fetchVehicleAssignments, fetchFuelEntries]);

  // ---- CRUD Operations (Supabase-backed) ----

  const addPayment = async (payment: Omit<AdminPayment, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("admin_payments")
      .insert({
        date: payment.date,
        purpose: payment.purpose,
        amount: payment.amount,
        paid_to: "Admin",
        payment_mode: "Cash",
        receipt_url: payment.document || null,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchPayments();
    return { id: data.id, ...payment, createdAt: data.created_at || "" };
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase.from("admin_payments").delete().eq("id", id);
    if (error) throw error;
    await fetchPayments();
  };

  const addVisitor = async (visitor: Omit<Visitor, "id" | "createdAt" | "checkInTime">) => {
    const { data, error } = await supabase
      .from("visitors")
      .insert({
        name: visitor.name,
        phone: visitor.mobile,
        company: visitor.organization,
        person_to_meet: visitor.whomToMeet,
        purpose: visitor.purpose,
        remarks: visitor.purposeDescription || null,
        check_in: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    await fetchVisitors();
    return { id: data.id, ...visitor, checkInTime: data.check_in || "", createdAt: data.created_at || "" };
  };

  const deleteVisitor = async (id: string) => {
    const { error } = await supabase.from("visitors").delete().eq("id", id);
    if (error) throw error;
    await fetchVisitors();
  };

  const addInwardRecord = async (record: Omit<InwardRecord, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("inward_outward")
      .insert({
        register_type: "inward",
        date: record.date,
        sender_receiver: record.senderName,
        subject: record.documentType || "General",
        document_type: record.documentType || "General",
        reference_number: record.referenceNumber || null,
        remarks: record.remarks || null,
        attachment_url: record.document || null,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchInwardOutward();
    return { id: data.id, ...record, createdAt: data.created_at || "" };
  };

  const addOutwardRecord = async (record: Omit<OutwardRecord, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("inward_outward")
      .insert({
        register_type: "outward",
        date: record.date,
        sender_receiver: record.receiverName,
        subject: record.documentType || "General",
        document_type: record.documentType || "General",
        reference_number: record.referenceNumber || null,
        remarks: record.remarks || null,
        attachment_url: record.document || null,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchInwardOutward();
    return { id: data.id, ...record, createdAt: data.created_at || "" };
  };

  const addAsset = async (asset: Omit<Asset, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("admin_assets")
      .insert({
        name: asset.name,
        category: asset.category,
        purchase_date: asset.purchaseDate || null,
        purchase_price: asset.cost || null,
        vendor: asset.vendorName || null,
        warranty_till: asset.warrantyExpiry || null,
        location: asset.condition || null,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchAssets();
    return { id: data.id, ...asset, createdAt: data.created_at || "" };
  };

  const updateAsset = async (id: string, data: Partial<Asset>) => {
    const dbUpdates: any = {};
    if (data.name) dbUpdates.name = data.name;
    if (data.category) dbUpdates.category = data.category;
    if (data.vendorName) dbUpdates.vendor = data.vendorName;
    if (data.warrantyExpiry) dbUpdates.warranty_till = data.warrantyExpiry;
    if (data.cost !== undefined) dbUpdates.purchase_price = data.cost;

    const { error } = await supabase.from("admin_assets").update(dbUpdates).eq("id", id);
    if (error) throw error;
    await fetchAssets();
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase.from("admin_assets").delete().eq("id", id);
    if (error) throw error;
    await fetchAssets();
  };

  const addVehicle = async (vehicle: Omit<Vehicle, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        vehicle_type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
        vehicle_number: vehicle.numberPlate,
        fuel_type: "Petrol",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchVehicles();
    return { id: data.id, ...vehicle, createdAt: data.created_at || "" };
  };

  const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from("vehicles").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    await fetchVehicles();
  };

  // Admin employee add/update/delete: these map to the employees table managed by HR
  const addEmployee = async (employee: Omit<AdminEmployee, "id" | "createdAt">) => {
    const { data, error } = await (supabase as any)
      .from("admin_employees")
      .insert({
        name: employee.name,
        designation: employee.designation,
        phone: employee.phone,
        alternate_phone: employee.alternatePhone || null,
        address: employee.address,
        photo: employee.photo || null,
      })
      .select()
      .single();
    if (error) throw error;
    await fetchEmployees();
    return { ...employee, id: data.id, createdAt: data.created_at || "" };
  };

  const updateEmployee = async (id: string, data: Partial<AdminEmployee>) => {
    const dbUpdates: any = {};
    if (data.name !== undefined) dbUpdates.name = data.name;
    if (data.designation !== undefined) dbUpdates.designation = data.designation;
    if (data.phone !== undefined) dbUpdates.phone = data.phone;
    if (data.alternatePhone !== undefined) dbUpdates.alternate_phone = data.alternatePhone || null;
    if (data.address !== undefined) dbUpdates.address = data.address;
    if (data.photo !== undefined) dbUpdates.photo = data.photo || null;
    const { error } = await (supabase as any).from("admin_employees").update(dbUpdates).eq("id", id);
    if (error) throw error;
    await fetchEmployees();
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await (supabase as any).from("admin_employees").delete().eq("id", id);
    if (error) throw error;
    await fetchEmployees();
  };

  // ---- localStorage-backed operations (no DB tables) ----
  const addTask = (task: Omit<AdminTask, "id" | "createdAt" | "status">) => {
    const newTask: AdminTask = { ...task, id: crypto.randomUUID(), status: "pending", createdAt: new Date().toISOString() };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTaskStatus = (id: string, status: "pending" | "completed") => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addVehicleAssignment = async (assignment: Omit<VehicleAssignment, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("vehicle_assignments")
      .insert({
        vehicle_id: assignment.vehicleId || null,
        vehicle_info: assignment.vehicleInfo,
        date: assignment.date,
        employee_name: assignment.employeeName,
        previous_km: assignment.previousKm,
        current_km: assignment.currentKm,
        image: assignment.image || null,
      })
      .select()
      .single();
    if (error) throw error;
    await fetchVehicleAssignments();
    return { ...assignment, id: data.id, createdAt: data.created_at || "" };
  };

  const addFuelEntry = async (entry: Omit<FuelEntry, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("fuel_entries")
      .insert({
        vehicle_id: entry.vehicleId || null,
        vehicle_info: entry.vehicleInfo,
        date: entry.date,
        quantity: entry.quantity,
        amount: entry.amount,
      })
      .select()
      .single();
    if (error) throw error;
    await fetchFuelEntries();
    return { ...entry, id: data.id, createdAt: data.created_at || "" };
  };

  const addCalendarEvent = (event: Omit<CalendarEvent, "id" | "createdAt">) => {
    const newEvent: CalendarEvent = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setCalendarEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const updateCalendarEvent = (id: string, data: Partial<CalendarEvent>) => {
    setCalendarEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  const addNote = (content: string) => {
    const newNote: Note = { id: crypto.randomUUID(), content, createdAt: new Date().toISOString() };
    setNotes(prev => [...prev, newNote]);
    return newNote;
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return {
    payments, tasks, visitors, employees, inwardRecords, outwardRecords,
    assets, vehicles, vehicleAssignments, fuelEntries, calendarEvents, notes,
    addPayment, deletePayment,
    addTask, updateTaskStatus, deleteTask,
    addVisitor, deleteVisitor,
    addEmployee, updateEmployee, deleteEmployee,
    addInwardRecord, addOutwardRecord,
    addAsset, updateAsset, deleteAsset,
    addVehicle, deleteVehicle, addVehicleAssignment, addFuelEntry,
    addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
    addNote, deleteNote,
  };
};
