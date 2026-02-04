import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_by?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined field
  assigned_to_name?: string;
}

export const useSupabaseTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        employees!tasks_assigned_to_fkey(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      return;
    }

    const tasksWithNames = (data || []).map((task: any) => ({
      ...task,
      assigned_to_name: task.employees?.name || "Unassigned",
    }));

    setTasks(tasksWithNames);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const addTask = async (taskData: {
    title: string;
    description?: string;
    assigned_to?: string;
    assigned_by?: string;
    priority?: "low" | "medium" | "high";
    due_date?: string;
  }) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...taskData,
        status: "pending",
        priority: taskData.priority || "medium",
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding task:", error);
      throw error;
    }

    return data;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updateData: any = { ...updates };
    
    // Set completed_at when task is completed
    if (updates.status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const getTasksByEmployee = useCallback((employeeId: string) => {
    return tasks.filter((t) => t.assigned_to === employeeId);
  }, [tasks]);

  const getTasksByStatus = useCallback((status: Task["status"]) => {
    return tasks.filter((t) => t.status === status);
  }, [tasks]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    getTasksByEmployee,
    getTasksByStatus,
    refreshTasks: fetchTasks,
  };
};
