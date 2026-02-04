import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DailyReport {
  id: string;
  employee_id: string;
  date: string;
  content: string;
  created_at: string;
  // Joined field
  employee_name?: string;
}

export const useSupabaseReports = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("daily_reports")
      .select(`
        *,
        employees(name)
      `)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      return;
    }

    const reportsWithNames = (data || []).map((report: any) => ({
      ...report,
      employee_name: report.employees?.name || "Unknown",
    }));

    setReports(reportsWithNames);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const addReport = async (reportData: {
    employee_id: string;
    date: string;
    content: string;
  }) => {
    const { data, error } = await supabase
      .from("daily_reports")
      .insert(reportData)
      .select()
      .single();

    if (error) {
      console.error("Error adding report:", error);
      throw error;
    }

    await fetchReports();
    return data;
  };

  const updateReport = async (id: string, content: string) => {
    const { error } = await supabase
      .from("daily_reports")
      .update({ content })
      .eq("id", id);

    if (error) {
      console.error("Error updating report:", error);
      throw error;
    }

    await fetchReports();
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase
      .from("daily_reports")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting report:", error);
      throw error;
    }

    await fetchReports();
  };

  const getReportsByEmployee = useCallback((employeeId: string) => {
    return reports.filter((r) => r.employee_id === employeeId);
  }, [reports]);

  const getReportsByDate = useCallback((date: string) => {
    return reports.filter((r) => r.date === date);
  }, [reports]);

  return {
    reports,
    loading,
    addReport,
    updateReport,
    deleteReport,
    getReportsByEmployee,
    getReportsByDate,
    refreshReports: fetchReports,
  };
};
