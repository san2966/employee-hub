import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Requirement {
  id: string;
  title: string;
  description: string;
  why_needed?: string;
  link_url?: string;
  expected_cost?: number;
  employee_name?: string;
  requested_by?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Joined field
  requested_by_name?: string;
}

export const useSupabaseRequirements = () => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequirements = useCallback(async () => {
    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requirements:", error);
      return;
    }

    const requirementsWithNames = (data || []).map((req: any) => {
      let description = req.description || "";
      let whyNeeded = req.why_needed || "";
      let linkUrl = req.link_url || "";
      let expectedCost = req.expected_cost;
      if (typeof description === "string" && description.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(description);
          description = parsed.description ?? description;
          whyNeeded = whyNeeded || parsed.whyNeeded || "";
          linkUrl = linkUrl || parsed.link || "";
          if (expectedCost == null && parsed.expectedCost != null) expectedCost = Number(parsed.expectedCost);
        } catch { /* keep original */ }
      }
      return {
        ...req,
        description,
        why_needed: whyNeeded,
        link_url: linkUrl,
        expected_cost: expectedCost,
        requested_by_name: req.employee_name || "Unknown",
      };
    });

    setRequirements(requirementsWithNames);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const addRequirement = async (requirementData: {
    title: string;
    description: string;
    why_needed?: string;
    link_url?: string;
    expected_cost?: number;
    employee_name?: string;
    requested_by?: string;
    priority?: "low" | "medium" | "high";
  }) => {
    const { data, error } = await supabase
      .from("requirements")
      .insert({
        ...requirementData,
        status: "pending",
        priority: requirementData.priority || "medium",
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding requirement:", error);
      throw error;
    }

    await fetchRequirements();
    return data;
  };

  const updateRequirement = async (id: string, updates: Partial<Requirement>) => {
    const { error } = await supabase
      .from("requirements")
      .update(updates as never)
      .eq("id", id);

    if (error) {
      console.error("Error updating requirement:", error);
      throw error;
    }

    await fetchRequirements();
  };

  const deleteRequirement = async (id: string) => {
    const { error } = await supabase
      .from("requirements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting requirement:", error);
      throw error;
    }

    await fetchRequirements();
  };

  const approveRequirement = async (id: string, approvedBy?: string) => {
    await updateRequirement(id, { status: "in_progress", approved_by: approvedBy });
  };

  return {
    requirements,
    loading,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    approveRequirement,
    refreshRequirements: fetchRequirements,
  };
};
