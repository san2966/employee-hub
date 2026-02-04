import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminAsset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  location?: string;
  purchase_date?: string;
  purchase_price?: number;
  vendor?: string;
  warranty_till?: string;
  assigned_to?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  // Joined field
  assigned_to_name?: string;
}

export interface ITAsset {
  id: string;
  registration_number: string;
  asset_type: string;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  invoice_url?: string;
  processor?: string;
  ram_size?: string;
  ram_serial?: string;
  storage_type?: string;
  storage_size?: string;
  storage_serial?: string;
  motherboard_model?: string;
  motherboard_serial?: string;
  display_model?: string;
  display_serial?: string;
  mac_address?: string;
  warranty_till: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  // Joined field
  assigned_to_name?: string;
}

export const useSupabaseAssets = () => {
  const [adminAssets, setAdminAssets] = useState<AdminAsset[]>([]);
  const [itAssets, setITAssets] = useState<ITAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminAssets = useCallback(async () => {
    const { data, error } = await supabase
      .from("admin_assets")
      .select(`
        *,
        employees(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin assets:", error);
      return;
    }

    const assetsWithNames = (data || []).map((asset: any) => ({
      ...asset,
      assigned_to_name: asset.employees?.name || "Unassigned",
    }));

    setAdminAssets(assetsWithNames);
  }, []);

  const fetchITAssets = useCallback(async () => {
    const { data, error } = await supabase
      .from("it_assets")
      .select(`
        *,
        employees(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching IT assets:", error);
      return;
    }

    const assetsWithNames = (data || []).map((asset: any) => ({
      ...asset,
      assigned_to_name: asset.employees?.name || "Unassigned",
    }));

    setITAssets(assetsWithNames);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAdminAssets(), fetchITAssets()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAdminAssets, fetchITAssets]);

  // Admin Asset operations
  const addAdminAsset = async (assetData: Omit<AdminAsset, "id" | "created_at" | "updated_at" | "assigned_to_name">) => {
    const { data, error } = await supabase
      .from("admin_assets")
      .insert(assetData)
      .select()
      .single();

    if (error) {
      console.error("Error adding admin asset:", error);
      throw error;
    }

    await fetchAdminAssets();
    return data;
  };

  const updateAdminAsset = async (id: string, updates: Partial<AdminAsset>) => {
    const { error } = await supabase
      .from("admin_assets")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating admin asset:", error);
      throw error;
    }

    await fetchAdminAssets();
  };

  const deleteAdminAsset = async (id: string) => {
    const { error } = await supabase
      .from("admin_assets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting admin asset:", error);
      throw error;
    }

    await fetchAdminAssets();
  };

  // IT Asset operations
  const generateITRegistrationNumber = (brand: string): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = itAssets.filter((a) =>
      a.registration_number.includes(`VMCC/${brand.toUpperCase()}/${year}/${month}`)
    ).length;
    const number = String(count + 1).padStart(3, "0");
    return `VMCC/${brand.toUpperCase()}/${year}/${month}/${number}`;
  };

  const addITAsset = async (assetData: Omit<ITAsset, "id" | "registration_number" | "created_at" | "updated_at" | "assigned_to_name">) => {
    const registration_number = generateITRegistrationNumber(assetData.brand);
    
    const { data, error } = await supabase
      .from("it_assets")
      .insert({
        ...assetData,
        registration_number,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding IT asset:", error);
      throw error;
    }

    await fetchITAssets();
    return data;
  };

  const updateITAsset = async (id: string, updates: Partial<ITAsset>) => {
    const { error } = await supabase
      .from("it_assets")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating IT asset:", error);
      throw error;
    }

    await fetchITAssets();
  };

  const deleteITAsset = async (id: string) => {
    const { error } = await supabase
      .from("it_assets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting IT asset:", error);
      throw error;
    }

    await fetchITAssets();
  };

  const assignITAsset = async (id: string, employeeId: string) => {
    await updateITAsset(id, { assigned_to: employeeId });
  };

  return {
    adminAssets,
    itAssets,
    loading,
    addAdminAsset,
    updateAdminAsset,
    deleteAdminAsset,
    addITAsset,
    updateITAsset,
    deleteITAsset,
    assignITAsset,
    generateITRegistrationNumber,
    refreshAssets: () => Promise.all([fetchAdminAssets(), fetchITAssets()]),
  };
};
