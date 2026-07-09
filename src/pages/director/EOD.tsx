import { useEffect, useState, useMemo } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ExportButtons } from "@/components/ExportButtons";
import { useDirectorData } from "@/hooks/useDirectorData";

interface EodRow {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  department: string;
  task: string;
  status: string;
  description: string;
}

const parseContent = (content: string) => {
  try {
    const j = JSON.parse(content);
    return {
      department: j.department || "",
      task: j.task || "",
      status: (j.status || "pending") as string,
      description: j.description || content,
    };
  } catch {
    return { department: "", task: "", status: "pending", description: content };
  }
};

const DailyTaskTab = () => {
  const { employees, tasks } = useDirectorData();
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");

  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || "Unknown";
  const getEmployeeDepartment = (id: string) => employees.find(e => e.id === id)?.department || "N/A";

  const filteredTasks = tasks.filter(t => {
    if (!t.isPersonal) return false;
    if (filterEmployee !== "all" && t.employeeId !== filterEmployee) return false;
    if (filterDate && !t.createdAt.startsWith(filterDate)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="card-corporate p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Employee Name</Label>
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card-corporate overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold">Daily Tasks ({filteredTasks.length})</h3>
          <ExportButtons
            portal="Director"
            type="DailyTasks"
            columns={[
              { key: "employeeName", header: "Employee Name" },
              { key: "date", header: "Date" },
              { key: "department", header: "Department" },
              { key: "task", header: "Task" },
              { key: "status", header: "Status" },
              { key: "description", header: "Description" },
            ]}
            data={filteredTasks.map(t => ({
              employeeName: getEmployeeName(t.employeeId),
              date: new Date(t.createdAt).toLocaleDateString(),
              department: getEmployeeDepartment(t.employeeId),
              task: t.subject,
              status: t.status.replace("-", " "),
              description: t.description,
            }))}
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTasks.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tasks found</p>
                </td></tr>
              ) : filteredTasks.map(t => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="p-4 text-sm">{getEmployeeName(t.employeeId)}</td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-muted-foreground">{getEmployeeDepartment(t.employeeId)}</td>
                  <td className="p-4 text-sm font-medium">{t.subject}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      t.status === "completed" ? "bg-success/10 text-success" :
                      t.status === "in-progress" ? "bg-warning/10 text-warning" :
                      "bg-destructive/10 text-destructive"
                    }`}>{t.status.replace("-", " ")}</span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const EODTab = () => {
  const [rows, setRows] = useState<EodRow[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [filterEmp, setFilterEmp] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_reports")
      .select("*, employees!daily_reports_employee_id_fkey(name, department)")
      .order("date", { ascending: false });
    const mapped: EodRow[] = (data || []).map((r: any) => {
      const p = parseContent(r.content);
      return {
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employees?.name || "Unknown",
        date: r.date,
        department: p.department || r.employees?.department || "N/A",
        task: p.task,
        status: p.status,
        description: p.description,
      };
    });
    setRows(mapped);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from("employees").select("id, name").eq("is_active", true).order("name");
    setEmployees(data || []);
  };

  useEffect(() => {
    fetchEmployees();
    fetchData();
    const ch = supabase.channel("director-eod")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_reports" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterEmp !== "all" && r.employeeId !== filterEmp) return false;
    if (fromDate && r.date < format(fromDate, "yyyy-MM-dd")) return false;
    if (toDate && r.date > format(toDate, "yyyy-MM-dd")) return false;
    return true;
  }), [rows, filterEmp, fromDate, toDate]);

  return (
    <div className="space-y-6">
      <div className="card-corporate p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Employee Name</Label>
            <Select value={filterEmp} onValueChange={setFilterEmp}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={fromDate} onSelect={setFromDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={toDate} onSelect={setToDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="card-corporate overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold">EOD Reports ({filtered.length})</h3>
          <ExportButtons
            portal="Director"
            type="EOD"
            columns={[
              { key: "employeeName", header: "Employee Name" },
              { key: "date", header: "Date" },
              { key: "department", header: "Department" },
              { key: "task", header: "Task" },
              { key: "status", header: "Status" },
              { key: "description", header: "Description" },
            ]}
            data={filtered.map(r => ({
              employeeName: r.employeeName,
              date: r.date,
              department: r.department,
              task: r.task,
              status: r.status === "completed" ? "Completed" : "Pending",
              description: r.description,
            }))}
            dateRange={{
              from: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
              to: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
            }}
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No EOD reports found</p>
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="p-4 text-sm">{r.employeeName}</td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-muted-foreground">{r.department}</td>
                  <td className="p-4 text-sm font-medium">{r.task || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      r.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>{r.status === "completed" ? "Completed" : "Pending"}</span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DirectorEOD = () => {
  return (
    <DirectorLayout title="EOD">
      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">Daily Task</TabsTrigger>
          <TabsTrigger value="eod">EOD</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-6"><DailyTaskTab /></TabsContent>
        <TabsContent value="eod" className="mt-6"><EODTab /></TabsContent>
      </Tabs>
    </DirectorLayout>
  );
};

export default DirectorEOD;