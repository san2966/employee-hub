import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  location: string;
  in_time: string | null;
  out_time: string | null;
  status: string;
  approved_by: string | null;
  created_at: string;
  employee_name?: string;
  employee_designation?: string;
}

export interface ApprovalRequest {
  id: string;
  employee_id: string;
  date: string;
  location: string;
  status: string;
  hr_notes: string | null;
  attendance_id: string | null;
  created_at: string;
  employee_name?: string;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
}

export type LocationType = "Office" | "WFH" | "Field" | "Half-Day" | "Leave" | "Absent";

export const LOCATION_COLORS: Record<LocationType, { bg: string; text: string; emoji: string; label: string }> = {
  Office: { bg: "bg-green-100", text: "text-green-700", emoji: "🟢", label: "Office" },
  WFH: { bg: "bg-sky-100", text: "text-sky-700", emoji: "🟦", label: "WFH" },
  Field: { bg: "bg-orange-100", text: "text-orange-700", emoji: "🟠", label: "Field" },
  "Half-Day": { bg: "bg-yellow-100", text: "text-yellow-700", emoji: "🟡", label: "Half-Day" },
  Leave: { bg: "bg-gray-200", text: "text-gray-700", emoji: "⚫", label: "Leave" },
  Absent: { bg: "bg-red-100", text: "text-red-700", emoji: "🔴", label: "Absent" },
};

export function useAttendanceData(selectedDate: Date) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, designation")
      .eq("is_active", true)
      .order("name");
    if (!error && data) setEmployees(data);
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("date", dateStr);
    
    if (!error && data) {
      // Join with employee names
      const { data: emps } = await supabase
        .from("employees")
        .select("id, name, designation")
        .eq("is_active", true);
      
      const empMap = new Map((emps || []).map(e => [e.id, e]));
      const enriched = data.map(r => ({
        ...r,
        employee_name: empMap.get(r.employee_id)?.name || "Unknown",
        employee_designation: empMap.get(r.employee_id)?.designation || "",
      }));
      setRecords(enriched);
    }
    setLoading(false);
  }, [dateStr]);

  const fetchApprovalRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("approval_requests")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      const { data: emps } = await supabase
        .from("employees")
        .select("id, name");
      const empMap = new Map((emps || []).map(e => [e.id, e]));
      setApprovalRequests(data.map(r => ({
        ...r,
        employee_name: empMap.get(r.employee_id)?.name || "Unknown",
      })));
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchRecords();
    fetchApprovalRequests();
  }, [fetchRecords, fetchApprovalRequests]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("attendance-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        fetchRecords();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "approval_requests" }, () => {
        fetchApprovalRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRecords, fetchApprovalRequests]);

  const saveAttendance = async (employeeId: string, location: LocationType, inTime: string, outTime: string) => {
    const needsApproval = ["WFH", "Field", "Half-Day"].includes(location);
    const status = needsApproval ? "Pending" : "Approved";

    const { data, error } = await supabase
      .from("attendance")
      .upsert({
        employee_id: employeeId,
        date: dateStr,
        location,
        in_time: inTime || null,
        out_time: outTime || null,
        status,
      }, { onConflict: "employee_id,date" })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    // Auto-create approval request for WFH/Field/Half-Day
    if (needsApproval && data) {
      await supabase.from("approval_requests").upsert({
        employee_id: employeeId,
        date: dateStr,
        location,
        status: "Pending",
        attendance_id: data.id,
      }, { onConflict: "employee_id,date" }).select();
    }

    toast({ title: "Saved", description: `Attendance recorded for ${dateStr}` });
    return true;
  };

  const deleteAttendance = async (id: string) => {
    const { error } = await supabase.from("attendance").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Deleted", description: "Attendance record removed" });
    return true;
  };

  const approveRequest = async (requestId: string, attendanceId: string | null, approved: boolean, notes?: string) => {
    const newStatus = approved ? "Approved" : "Rejected";
    
    await supabase.from("approval_requests").update({
      status: newStatus,
      hr_notes: notes || null,
    }).eq("id", requestId);

    if (attendanceId) {
      if (approved) {
        await supabase.from("attendance").update({ status: "Approved" }).eq("id", attendanceId);
      } else {
        await supabase.from("attendance").update({ status: "Rejected", location: "Absent" }).eq("id", attendanceId);
      }
    }

    toast({ title: approved ? "Approved" : "Rejected", description: `Request has been ${newStatus.toLowerCase()}` });
  };

  // Counts for selected date
  const counts = {
    Office: records.filter(r => r.location === "Office").length,
    WFH: records.filter(r => r.location === "WFH").length,
    Field: records.filter(r => r.location === "Field").length,
    "Half-Day": records.filter(r => r.location === "Half-Day").length,
    Leave: records.filter(r => r.location === "Leave").length,
    Absent: records.filter(r => r.location === "Absent").length,
  };

  const pendingCounts = {
    WFH: records.filter(r => r.location === "WFH" && r.status === "Pending").length,
    Field: records.filter(r => r.location === "Field" && r.status === "Pending").length,
    "Half-Day": records.filter(r => r.location === "Half-Day" && r.status === "Pending").length,
  };

  return {
    records,
    employees,
    approvalRequests,
    loading,
    counts,
    pendingCounts,
    saveAttendance,
    deleteAttendance,
    approveRequest,
    fetchRecords,
    fetchMonthlyRecords: async (year: number, month: number) => {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, "0")}-01`;
      
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .gte("date", startDate)
        .lt("date", endDate);
      
      if (data) {
        const { data: emps } = await supabase
          .from("employees")
          .select("id, name, designation");
        const empMap = new Map((emps || []).map(e => [e.id, e]));
        return data.map(r => ({
          ...r,
          employee_name: empMap.get(r.employee_id)?.name || "Unknown",
          employee_designation: empMap.get(r.employee_id)?.designation || "",
        }));
      }
      return [];
    },
  };
}
