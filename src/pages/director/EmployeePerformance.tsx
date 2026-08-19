import { useCallback, useEffect, useMemo, useState } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { MONTHS } from "@/lib/dateFormat";
import { Award, CalendarCheck, ClipboardList, FileSpreadsheet, FileText, TrendingUp, Users } from "lucide-react";

interface Row {
  id: string;
  name: string;
  designation: string;
  dailyTasks: number;
  eod: number;
  present: number;
  score: number;
}

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);

/** Monthly employee scorecard based on Daily Tasks, EOD reports and Attendance. */
const EmployeePerformance = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  // Working days elapsed this month (Mon-Sat)
  const workingDays = useMemo(() => {
    let count = 0;
    for (let day = 1; day <= now.getDate(); day++) {
      const d = new Date(now.getFullYear(), now.getMonth(), day);
      if (d.getDay() !== 0) count++;
    }
    return Math.max(count, 1);
  }, [now]);

  const load = useCallback(async () => {
    const [emps, tasks, reports, attendance] = await Promise.all([
      (supabase as any).from("employees").select("id, name, designation, is_active"),
      (supabase as any).from("tasks").select("assigned_to, created_at, is_personal").eq("is_personal", true).gte("created_at", from),
      (supabase as any).from("daily_reports").select("employee_id, date").gte("date", from).lte("date", to),
      (supabase as any).from("attendance").select("employee_id, date, location, status").gte("date", from).lte("date", to),
    ]);

    const list: Row[] = ((emps.data || []) as any[])
      .filter((e) => e.is_active !== false)
      .map((e) => {
        const dailyTasks = ((tasks.data || []) as any[]).filter((t) => t.assigned_to === e.id).length;
        const eod = ((reports.data || []) as any[]).filter((r) => r.employee_id === e.id).length;
        const present = ((attendance.data || []) as any[]).filter(
          (a) => a.employee_id === e.id && !["Absent", "Leave"].includes(a.location || ""),
        ).length;
        const pct = (n: number) => Math.min(100, Math.round((n / workingDays) * 100));
        const score = Math.round(pct(dailyTasks) * 0.35 + pct(eod) * 0.35 + pct(present) * 0.3);
        return { id: e.id, name: e.name, designation: e.designation || "-", dailyTasks, eod, present, score };
      })
      .sort((a, b) => b.score - a.score);

    setRows(list);
    setLoading(false);
  }, [from, to, workingDays]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("director-performance")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_reports" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const filtered = rows.filter((r) => r.name?.toLowerCase().includes(search.trim().toLowerCase()));
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
  const top = rows[0];

  const grade = (score: number) =>
    score >= 85 ? { label: "Excellent", tone: "default" as const }
      : score >= 65 ? { label: "Good", tone: "secondary" as const }
        : score >= 40 ? { label: "Average", tone: "outline" as const }
          : { label: "Needs Attention", tone: "destructive" as const };

  const columns = [
    { key: "name", header: "Employee" },
    { key: "designation", header: "Designation" },
    { key: "dailyTasks", header: "Daily Tasks" },
    { key: "eod", header: "EOD Reports" },
    { key: "present", header: "Days Present" },
    { key: "score", header: "Score" },
  ];

  return (
    <DirectorLayout title="Employee Performance">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Employees Tracked" value={rows.length} sub={`${MONTHS[now.getMonth()]} ${now.getFullYear()}`} icon={Users} tone="primary" />
          <KpiCard label="Average Score" value={`${avg}%`} sub="resets every month" icon={TrendingUp} tone="success" />
          <KpiCard label="Top Performer" value={top?.name || "-"} sub={top ? `${top.score}% score` : "no data"} icon={Award} tone="warning" />
          <KpiCard label="Working Days" value={workingDays} sub="elapsed this month" icon={CalendarCheck} tone="muted" />
        </div>

        <Card className="card-corporate">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Monthly Scorecard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input className="w-48" placeholder="Search employee" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button variant="outline" size="sm" className="gap-2" disabled={!filtered.length}
                onClick={() => exportToCSV({ portal: "Director", type: "Employee Performance", columns, data: filtered as any })}>
                <FileSpreadsheet className="h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" disabled={!filtered.length}
                onClick={() => exportToPDF({ portal: "Director", type: "Employee Performance", columns, data: filtered as any })}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="text-center">Daily Tasks</TableHead>
                  <TableHead className="text-center">EOD Reports</TableHead>
                  <TableHead className="text-center">Days Present</TableHead>
                  <TableHead className="w-48">Performance</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.designation}</TableCell>
                    <TableCell className="text-center">{r.dailyTasks}/{workingDays}</TableCell>
                    <TableCell className="text-center">{r.eod}/{workingDays}</TableCell>
                    <TableCell className="text-center">{r.present}/{workingDays}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={r.score} className="h-2" />
                        <span className="text-xs w-10 text-right">{r.score}%</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={grade(r.score).tone}>{grade(r.score).label}</Badge></TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      {loading ? "Loading performance data..." : "No employees found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DirectorLayout>
  );
};

export default EmployeePerformance;