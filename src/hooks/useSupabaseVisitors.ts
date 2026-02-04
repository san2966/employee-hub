import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Visitor {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  purpose: string;
  person_to_meet: string;
  check_in: string;
  check_out?: string;
  photo?: string;
  id_proof?: string;
  badge_number?: string;
  remarks?: string;
  created_at: string;
}

export const useSupabaseVisitors = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisitors = useCallback(async () => {
    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .order("check_in", { ascending: false });

    if (error) {
      console.error("Error fetching visitors:", error);
      return;
    }

    setVisitors(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const addVisitor = async (visitorData: Omit<Visitor, "id" | "created_at" | "check_in" | "check_out">) => {
    const { data, error } = await supabase
      .from("visitors")
      .insert({
        ...visitorData,
        check_in: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding visitor:", error);
      throw error;
    }

    await fetchVisitors();
    return data;
  };

  const checkOutVisitor = async (id: string) => {
    const { error } = await supabase
      .from("visitors")
      .update({ check_out: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error checking out visitor:", error);
      throw error;
    }

    await fetchVisitors();
  };

  const updateVisitor = async (id: string, updates: Partial<Visitor>) => {
    const { error } = await supabase
      .from("visitors")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating visitor:", error);
      throw error;
    }

    await fetchVisitors();
  };

  const deleteVisitor = async (id: string) => {
    const { error } = await supabase
      .from("visitors")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting visitor:", error);
      throw error;
    }

    await fetchVisitors();
  };

  const getActiveVisitors = useCallback(() => {
    return visitors.filter((v) => !v.check_out);
  }, [visitors]);

  const getTodayVisitors = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return visitors.filter((v) => v.check_in.startsWith(today));
  }, [visitors]);

  return {
    visitors,
    loading,
    addVisitor,
    checkOutVisitor,
    updateVisitor,
    deleteVisitor,
    getActiveVisitors,
    getTodayVisitors,
    refreshVisitors: fetchVisitors,
  };
};
