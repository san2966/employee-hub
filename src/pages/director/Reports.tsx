import { useState, useEffect, useCallback } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";

interface ReportRow {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  task: string;
  status: string;
  description: string;
  additionalInfo: string;
  createdAt: string;
}

const Reports = () => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string; department: string }[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase.from("employees").select("id, name, department, username, email").order("name");
    setEmployees((data || []).map((e: any) => ({
      id: e.id,
      name: e.name || e.username || e.email || "Unknown",
      department: e.department || "",
    })));
  }, []);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("daily_reports")
      .select("*, employees!daily_reports_employee_id_fkey(name, username, email, department)")
      .order("date", { ascending: false });
    if (error) { console.error(error); return; }
    const rows: ReportRow[] = (data || []).map((r: any) => {
      let parsed: any = {};
      try { parsed = JSON.parse(r.content); } catch { parsed = { description: r.content }; }
      const emp = r.employees || {};
      const name = emp.name || emp.username || emp.email || "Unknown";
      return {
        id: r.id,
        employeeId: r.employee_id,
        employeeName: name,
        department: parsed.department || emp.department || "N/A",
        date: r.date,
        task: parsed.task || "",
        status: parsed.status || "pending",
        description: parsed.description || r.content || "",
        additionalInfo: parsed.additionalInfo || "",
        createdAt: r.created_at,
      };
    });
    setReports(rows);
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchReports();
    const ch = supabase
      .channel("dir-daily-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_reports" }, () => fetchReports())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchEmployees, fetchReports]);

  const filtered = reports.filter(r => {
    if (filterEmployee !== "all" && r.employeeId !== filterEmployee) return false;
    if (filterDate && r.date !== filterDate) return false;
    return true;
  });

  return (
    <DirectorLayout title="Reports">
      <div className="space-y-6">
        <div className="card-corporate p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Employee Name</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card-corporate overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold">Reports ({filtered.length})</h3>
            <ExportButtons
              portal="Director"
              type="Reports"
              columns={[
                { key: "employeeName", header: "Employee Name" },
                { key: "date", header: "Date" },
                { key: "department", header: "Department" },
                { key: "task", header: "Task" },
                { key: "status", header: "Status" },
                { key: "description", header: "Description" },
                { key: "additionalInfo", header: "Additional Info" },
              ]}
              data={filtered.map(r => ({
                employeeName: r.employeeName,
                date: new Date(r.date).toLocaleDateString(),
                department: r.department,
                task: r.task,
                status: r.status,
                description: r.description,
                additionalInfo: r.additionalInfo,
              }))}
              dateRange={{ from: filterDate || undefined }}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Employee Name</th>
                  <th className="text-left p-4 text-sm font-medium">Date</th>
                  <th className="text-left p-4 text-sm font-medium">Department</th>
                  <th className="text-left p-4 text-sm font-medium">Task</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Description</th>
                  <th className="text-left p-4 text-sm font-medium">Additional Info</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No reports found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="p-4 text-sm font-medium">{r.employeeName}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">{r.department}</td>
                      <td className="p-4 text-sm">{r.task}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          r.status === "completed" ? "bg-success/10 text-success" :
                          r.status === "in-progress" ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        }`}>
                          {r.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{r.description}</td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{r.additionalInfo || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DirectorLayout>
  );
};

export default Reports;