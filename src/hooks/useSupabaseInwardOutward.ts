import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InwardOutward {
  id: string;
  register_type: "inward" | "outward";
  date: string;
  sender_receiver: string;
  subject: string;
  reference_number?: string;
  document_type: string;
  remarks?: string;
  attachment_url?: string;
  created_at: string;
}

export const useSupabaseInwardOutward = () => {
  const [entries, setEntries] = useState<InwardOutward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("inward_outward")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching inward/outward entries:", error);
      return;
    }

    const mappedData = (data || []).map((entry) => ({
      ...entry,
      register_type: entry.register_type as "inward" | "outward",
    }));

    setEntries(mappedData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (entryData: Omit<InwardOutward, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("inward_outward")
      .insert(entryData)
      .select()
      .single();

    if (error) {
      console.error("Error adding entry:", error);
      throw error;
    }

    await fetchEntries();
    return data;
  };

  const updateEntry = async (id: string, updates: Partial<InwardOutward>) => {
    const { error } = await supabase
      .from("inward_outward")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating entry:", error);
      throw error;
    }

    await fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from("inward_outward")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }

    await fetchEntries();
  };

  const getInwardEntries = useCallback(() => {
    return entries.filter((e) => e.register_type === "inward");
  }, [entries]);

  const getOutwardEntries = useCallback(() => {
    return entries.filter((e) => e.register_type === "outward");
  }, [entries]);

  return {
    entries,
    inwardEntries: getInwardEntries(),
    outwardEntries: getOutwardEntries(),
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshEntries: fetchEntries,
  };
};
