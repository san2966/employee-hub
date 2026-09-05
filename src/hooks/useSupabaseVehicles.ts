import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  brand: string;
  model: string;
  fuel_type: string;
  assigned_to?: string;
  insurance_expiry?: string;
  puc_expiry?: string;
  fitness_expiry?: string;
  last_service_date?: string;
  next_service_due?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined field
  assigned_to_name?: string;
}

export const useSupabaseVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select(`
        *,
        employees(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching vehicles:", error);
      return;
    }

    const vehiclesWithNames = (data || []).map((vehicle: any) => ({
      ...vehicle,
      assigned_to_name: vehicle.employees?.name || "Unassigned",
    }));

    setVehicles(vehiclesWithNames);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const addVehicle = async (vehicleData: Omit<Vehicle, "id" | "created_at" | "updated_at" | "is_active" | "assigned_to_name">) => {
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        ...vehicleData,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding vehicle:", error);
      throw error;
    }

    await fetchVehicles();
    return data;
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const { error } = await supabase
      .from("vehicles")
      .update(updates as never)
      .eq("id", id);

    if (error) {
      console.error("Error updating vehicle:", error);
      throw error;
    }

    await fetchVehicles();
  };

  const deleteVehicle = async (id: string) => {
    const { error } = await supabase
      .from("vehicles")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting vehicle:", error);
      throw error;
    }

    await fetchVehicles();
  };

  const assignVehicle = async (id: string, employeeId: string) => {
    await updateVehicle(id, { assigned_to: employeeId });
  };

  return {
    vehicles: vehicles.filter((v) => v.is_active),
    allVehicles: vehicles,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    assignVehicle,
    refreshVehicles: fetchVehicles,
  };
};
