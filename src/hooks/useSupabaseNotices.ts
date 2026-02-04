import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  expires_at?: string;
  created_by?: string;
  created_at: string;
}

export const useSupabaseNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = useCallback(async () => {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notices:", error);
      return;
    }

    setNotices(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("notices-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => {
        fetchNotices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotices]);

  const addNotice = async (noticeData: {
    title: string;
    content: string;
    expires_at?: string;
    created_by?: string;
  }) => {
    const { data, error } = await supabase
      .from("notices")
      .insert({
        ...noticeData,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding notice:", error);
      throw error;
    }

    return data;
  };

  const updateNotice = async (id: string, updates: Partial<Notice>) => {
    const { error } = await supabase
      .from("notices")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating notice:", error);
      throw error;
    }
  };

  const deleteNotice = async (id: string) => {
    const { error } = await supabase
      .from("notices")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting notice:", error);
      throw error;
    }
  };

  const getActiveNotices = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return notices.filter((n) => 
      n.is_active && (!n.expires_at || n.expires_at >= today)
    );
  }, [notices]);

  return {
    notices,
    activeNotices: getActiveNotices(),
    loading,
    addNotice,
    updateNotice,
    deleteNotice,
    refreshNotices: fetchNotices,
  };
};
