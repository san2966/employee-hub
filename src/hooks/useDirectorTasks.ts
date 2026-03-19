import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DirectorTask {
  id: string;
  date: string;
  department: string;
  task: string;
  expected_days: number;
  status: string;
  report: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export const useDirectorTasks = (departmentFilter?: string) => {
  const [tasks, setTasks] = useState<DirectorTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    let query = (supabase as any)
      .from("director_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (departmentFilter) {
      query = query.eq("department", departmentFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching director tasks:", error);
    } else {
      // Check overdue status client-side
      const now = new Date();
      const updated = (data || []).map((t: DirectorTask) => {
        if (t.status === "Pending") {
          const created = new Date(t.created_at);
          const deadline = new Date(created);
          deadline.setDate(deadline.getDate() + t.expected_days);
          if (now > deadline) {
            return { ...t, status: "Overdue" };
          }
        }
        return t;
      });
      setTasks(updated);
    }
    setLoading(false);
  }, [departmentFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("director-tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "director_tasks" }, () => {
        fetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const addTask = async (data: { department: string; task: string; expected_days: number }) => {
    const { error } = await (supabase as any)
      .from("director_tasks")
      .insert({ ...data, status: "Pending" });
    if (error) throw error;
  };

  const submitReport = async (id: string, report: string) => {
    const { error } = await (supabase as any)
      .from("director_tasks")
      .update({ report, status: "Completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  };

  const deleteTask = async (id: string) => {
    const { error } = await (supabase as any)
      .from("director_tasks")
      .delete()
      .eq("id", id);
    if (error) throw error;
  };

  return { tasks, loading, addTask, submitReport, deleteTask, refresh: fetchTasks };
};
