import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface ITAsset {
  id: string;
  registrationNumber: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  invoiceUrl?: string;
  processor?: string;
  ramSize?: string;
  ramSerial?: string;
  storageType?: string;
  storageSize?: string;
  storageSerial?: string;
  motherboardModel?: string;
  motherboardSerial?: string;
  displayModel?: string;
  displaySerial?: string;
  macAddress?: string;
  warrantyTill: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
}

export interface ITPassword {
  id: string;
  portal: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface NetworkImage {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface TelephoneEntry {
  id: string;
  department: string;
  intercom: string;
  phoneNumber: string;
  createdAt: string;
}

export interface ITNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface ITHeadProfile {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  designation: string;
  profilePhoto: string;
}

const mapDbToAsset = (a: any): ITAsset => ({
  id: a.id,
  registrationNumber: a.registration_number,
  type: a.asset_type,
  brand: a.brand,
  model: a.model,
  serialNumber: a.serial_number,
  purchaseDate: a.purchase_date,
  invoiceUrl: a.invoice_url || "",
  processor: a.processor || "",
  ramSize: a.ram_size || "",
  ramSerial: a.ram_serial || "",
  storageType: a.storage_type || "",
  storageSize: a.storage_size || "",
  storageSerial: a.storage_serial || "",
  motherboardModel: a.motherboard_model || "",
  motherboardSerial: a.motherboard_serial || "",
  displayModel: a.display_model || "",
  displaySerial: a.display_serial || "",
  macAddress: a.mac_address || "",
  warrantyTill: a.warranty_till,
  assignedTo: a.assigned_to || "",
  assignedToName: a.employees?.name || "",
  createdAt: a.created_at || "",
});

// localStorage for profile (no DB table for IT head profile per se)
const loadProfile = (): ITHeadProfile => {
  try {
    const stored = localStorage.getItem('ithead_profile');
    return stored ? JSON.parse(stored) : {
      firstName: 'IT', lastName: 'Head', mobileNumber: '',
      designation: 'IT Head', profilePhoto: ''
    };
  } catch {
    return { firstName: 'IT', lastName: 'Head', mobileNumber: '', designation: 'IT Head', profilePhoto: '' };
  }
};

export const useITHeadData = () => {
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [passwords, setPasswords] = useState<ITPassword[]>([]);
  const [networkImages, setNetworkImages] = useState<NetworkImage[]>([]);
  const [telephoneImages, setTelephoneImages] = useState<NetworkImage[]>([]);
  const [telephoneEntries, setTelephoneEntries] = useState<TelephoneEntry[]>([]);
  const [notes, setNotes] = useState<ITNote[]>([]);
  const [profile, setProfile] = useState<ITHeadProfile>(loadProfile);

  useEffect(() => {
    localStorage.setItem('ithead_profile', JSON.stringify(profile));
  }, [profile]);

  // ---- Supabase fetchers ----
  const fetchAssets = useCallback(async () => {
    const { data, error } = await supabase
      .from("it_assets")
      .select(`*, employees(name)`)
      .order("created_at", { ascending: false });
    if (error) { console.error("Error:", error); return; }
    setAssets((data || []).map(mapDbToAsset));
  }, []);

  const fetchPasswords = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('encrypt-password', {
      body: { action: 'get' }
    });
    if (error) { console.error("Error:", error); return; }
    setPasswords((data?.passwords || []).map((p: any) => ({
      id: p.id, portal: p.portal, username: p.username,
      password: p.password || p.decrypted_password || "",
      createdAt: p.created_at || "",
    })));
  }, []);

  const fetchNetworkImages = useCallback(async () => {
    const { data, error } = await supabase
      .from("it_network_images")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("Error:", error); return; }
    const mapped = (data || []).map(img => ({
      id: img.id, name: img.name, url: img.url, createdAt: img.created_at || "",
      imageType: img.image_type,
    }));
    setNetworkImages(mapped.filter(i => i.imageType === "network").map(({ imageType, ...rest }) => rest));
    setTelephoneImages(mapped.filter(i => i.imageType === "telephone").map(({ imageType, ...rest }) => rest));
  }, []);

  const fetchTelephoneEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("telephone_directory")
      .select("*")
      .order("department", { ascending: true });
    if (error) { console.error("Error:", error); return; }
    setTelephoneEntries((data || []).map(t => ({
      id: t.id, department: t.department, intercom: t.intercom,
      phoneNumber: t.phone_number, createdAt: t.created_at || "",
    })));
  }, []);

  // Notes - still localStorage (no dedicated IT notes table)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ithead_notes');
      if (stored) setNotes(JSON.parse(stored));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem('ithead_notes', JSON.stringify(notes));
  }, [notes]);

  // Initial load
  useEffect(() => {
    fetchAssets();
    fetchPasswords();
    fetchNetworkImages();
    fetchTelephoneEntries();
  }, [fetchAssets, fetchPasswords, fetchNetworkImages, fetchTelephoneEntries]);

  // Realtime
  useEffect(() => {
    const channels = [
      supabase.channel("it-assets-sync").on("postgres_changes", { event: "*", schema: "public", table: "it_assets" }, () => fetchAssets()).subscribe(),
      supabase.channel("it-images-sync").on("postgres_changes", { event: "*", schema: "public", table: "it_network_images" }, () => fetchNetworkImages()).subscribe(),
      supabase.channel("it-tel-sync").on("postgres_changes", { event: "*", schema: "public", table: "telephone_directory" }, () => fetchTelephoneEntries()).subscribe(),
    ];
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [fetchAssets, fetchNetworkImages, fetchTelephoneEntries]);

  // ---- Asset operations ----
  const generateRegistrationNumber = useCallback((brand: string): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const existingCount = assets.filter(a =>
      a.registrationNumber.includes(`VMCC/${brand.toUpperCase()}/${year}/${month}`)
    ).length;
    const number = String(existingCount + 1).padStart(3, '0');
    return `VMCC/${brand.toUpperCase()}/${year}/${month}/${number}`;
  }, [assets]);

  const addAsset = useCallback(async (asset: Omit<ITAsset, 'id' | 'registrationNumber' | 'createdAt'>) => {
    const registration_number = generateRegistrationNumber(asset.brand);
    const { data, error } = await supabase
      .from("it_assets")
      .insert({
        registration_number,
        asset_type: asset.type,
        brand: asset.brand,
        model: asset.model,
        serial_number: asset.serialNumber,
        purchase_date: asset.purchaseDate,
        invoice_url: asset.invoiceUrl || null,
        processor: asset.processor || null,
        ram_size: asset.ramSize || null,
        ram_serial: asset.ramSerial || null,
        storage_type: asset.storageType || null,
        storage_size: asset.storageSize || null,
        storage_serial: asset.storageSerial || null,
        motherboard_model: asset.motherboardModel || null,
        motherboard_serial: asset.motherboardSerial || null,
        display_model: asset.displayModel || null,
        display_serial: asset.displaySerial || null,
        mac_address: asset.macAddress || null,
        warranty_till: asset.warrantyTill,
        assigned_to: asset.assignedTo || null,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchAssets();
    return { ...asset, id: data.id, registrationNumber: registration_number, createdAt: data.created_at || "" };
  }, [generateRegistrationNumber, fetchAssets]);

  const updateAsset = useCallback(async (id: string, updates: Partial<ITAsset>) => {
    const dbUpdates: any = {};
    if (updates.type) dbUpdates.asset_type = updates.type;
    if (updates.brand) dbUpdates.brand = updates.brand;
    if (updates.model) dbUpdates.model = updates.model;
    if (updates.serialNumber) dbUpdates.serial_number = updates.serialNumber;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo || null;
    if (updates.warrantyTill) dbUpdates.warranty_till = updates.warrantyTill;
    if (updates.processor !== undefined) dbUpdates.processor = updates.processor || null;
    if (updates.ramSize !== undefined) dbUpdates.ram_size = updates.ramSize || null;

    const { error } = await supabase.from("it_assets").update(dbUpdates).eq("id", id);
    if (error) throw error;
    await fetchAssets();
  }, [fetchAssets]);

  const deleteAsset = useCallback(async (id: string) => {
    const { error } = await supabase.from("it_assets").delete().eq("id", id);
    if (error) throw error;
    await fetchAssets();
  }, [fetchAssets]);

  const assignAsset = useCallback(async (id: string, employeeId: string, _employeeName: string) => {
    await updateAsset(id, { assignedTo: employeeId });
  }, [updateAsset]);

  // ---- Password operations ----
  const addPassword = useCallback(async (portal: string, username: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('encrypt-password', {
      body: { action: 'save', portal, username, password }
    });
    if (error || data?.error) throw new Error(error?.message || data?.error);
    await fetchPasswords();
  }, [fetchPasswords]);

  const updatePassword = useCallback(async (id: string, updates: Partial<ITPassword>) => {
    if (updates.password) {
      const { data: encData, error: encError } = await supabase.functions.invoke('encrypt-password', {
        body: { action: 'encrypt', password: updates.password }
      });
      if (encError || encData?.error) throw new Error(encError?.message || encData?.error);

      const dbUpdates: any = { encrypted_password: encData.encrypted };
      if (updates.portal) dbUpdates.portal = updates.portal;
      if (updates.username) dbUpdates.username = updates.username;

      const { error } = await supabase.from("it_passwords").update(dbUpdates).eq("id", id);
      if (error) throw error;
    } else {
      const dbUpdates: any = {};
      if (updates.portal) dbUpdates.portal = updates.portal;
      if (updates.username) dbUpdates.username = updates.username;
      const { error } = await supabase.from("it_passwords").update(dbUpdates).eq("id", id);
      if (error) throw error;
    }
    await fetchPasswords();
  }, [fetchPasswords]);

  const deletePassword = useCallback(async (id: string) => {
    const { data, error } = await supabase.functions.invoke('encrypt-password', {
      body: { action: 'delete', id }
    });
    if (error || data?.error) throw new Error(error?.message || data?.error);
    await fetchPasswords();
  }, [fetchPasswords]);

  // ---- Network image operations ----
  const addNetworkImage = useCallback(async (name: string, url: string) => {
    const { error } = await supabase.from("it_network_images").insert({ name, url, image_type: "network" });
    if (error) throw error;
    await fetchNetworkImages();
  }, [fetchNetworkImages]);

  const deleteNetworkImage = useCallback(async (id: string) => {
    const { error } = await supabase.from("it_network_images").delete().eq("id", id);
    if (error) throw error;
    await fetchNetworkImages();
  }, [fetchNetworkImages]);

  // ---- Telephone image operations ----
  const addTelephoneImage = useCallback(async (name: string, url: string) => {
    const { error } = await supabase.from("it_network_images").insert({ name, url, image_type: "telephone" });
    if (error) throw error;
    await fetchNetworkImages();
  }, [fetchNetworkImages]);

  const deleteTelephoneImage = useCallback(async (id: string) => {
    const { error } = await supabase.from("it_network_images").delete().eq("id", id);
    if (error) throw error;
    await fetchNetworkImages();
  }, [fetchNetworkImages]);

  // ---- Telephone entry operations ----
  const addTelephoneEntry = useCallback(async (department: string, intercom: string, phoneNumber: string) => {
    const { error } = await supabase.from("telephone_directory").insert({ department, intercom, phone_number: phoneNumber });
    if (error) throw error;
    await fetchTelephoneEntries();
  }, [fetchTelephoneEntries]);

  const updateTelephoneEntry = useCallback(async (id: string, updates: Partial<TelephoneEntry>) => {
    const dbUpdates: any = {};
    if (updates.department) dbUpdates.department = updates.department;
    if (updates.intercom) dbUpdates.intercom = updates.intercom;
    if (updates.phoneNumber) dbUpdates.phone_number = updates.phoneNumber;
    const { error } = await supabase.from("telephone_directory").update(dbUpdates).eq("id", id);
    if (error) throw error;
    await fetchTelephoneEntries();
  }, [fetchTelephoneEntries]);

  const deleteTelephoneEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from("telephone_directory").delete().eq("id", id);
    if (error) throw error;
    await fetchTelephoneEntries();
  }, [fetchTelephoneEntries]);

  // ---- Notes operations (localStorage) ----
  const addNote = useCallback((content: string) => {
    const newNote: ITNote = { id: crypto.randomUUID(), content, createdAt: new Date().toISOString() };
    setNotes(prev => [newNote, ...prev]);
  }, []);

  const updateNote = useCallback((id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // ---- Profile operations (localStorage) ----
  const updateProfile = useCallback((updates: Partial<ITHeadProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    assets, passwords, networkImages, telephoneImages, telephoneEntries, notes, profile,
    addAsset, updateAsset, deleteAsset, assignAsset, generateRegistrationNumber,
    addPassword, updatePassword, deletePassword,
    addNetworkImage, deleteNetworkImage,
    addTelephoneImage, deleteTelephoneImage,
    addTelephoneEntry, updateTelephoneEntry, deleteTelephoneEntry,
    addNote, updateNote, deleteNote,
    updateProfile,
  };
};
