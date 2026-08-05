import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface Slice { name: string; value: number; color: string }

const COLORS = {
  notCreated: "hsl(var(--muted-foreground))",
  pending: "hsl(45 93% 47%)",
  completed: "hsl(142 71% 45%)",
  assigned: "hsl(var(--primary))",
  overdue: "hsl(var(--destructive))",
};

const PieBlock = ({ title, data }: { title: string; data: Slice[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card-corporate p-6">
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <div className="h-56">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={2}>
                {data.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconSize={8} formatter={(v, e: any) => `${v}: ${e?.payload?.value ?? 0}`} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

const DashboardPieCharts = () => {
  const [daily, setDaily] = useState<Slice[]>([]);
  const [eod, setEod] = useState<Slice[]>([]);
  const [dept, setDept] = useState<Slice[]>([]);

  const load = useCallback(async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    const { data: emps } = await supabase.from("employees").select("id").eq("is_active", true);
    const empIds = (emps || []).map((e: any) => e.id);
    const totalEmps = empIds.length;

    // ---- Employee-wise Daily Task ----
    const { data: personal } = await (supabase as any)
      .from("tasks")
      .select("assigned_to, status, created_at, is_personal")
      .eq("is_personal", true);
    const todaysPersonal = (personal || []).filter((t: any) => (t.created_at || "").slice(0, 10) === today);
    const doneEmps = new Set<string>();
    const pendEmps = new Set<string>();
    todaysPersonal.forEach((t: any) => {
      if (!t.assigned_to) return;
      if (t.status === "completed") doneEmps.add(t.assigned_to);
      else pendEmps.add(t.assigned_to);
    });
    pendEmps.forEach((id) => { if (doneEmps.has(id)) pendEmps.delete(id); });
    setDaily([
      { name: "Not Created", value: Math.max(0, totalEmps - doneEmps.size - pendEmps.size), color: COLORS.notCreated },
      { name: "Pending", value: pendEmps.size, color: COLORS.pending },
      { name: "Completed", value: doneEmps.size, color: COLORS.completed },
    ]);

    // ---- Employee-wise EOD ----
    const { data: reports } = await supabase
      .from("daily_reports")
      .select("employee_id, content, date")
      .eq("date", today);
    const eodDone = new Set<string>();
    const eodPending = new Set<string>();
    (reports || []).forEach((r: any) => {
      let status = "pending";
      try {
        const parsed = JSON.parse(r.content);
        if (parsed && typeof parsed === "object" && parsed.status) status = String(parsed.status).toLowerCase();
      } catch { /* plain text report */ }
      if (status === "completed") eodDone.add(r.employee_id);
      else eodPending.add(r.employee_id);
    });
    eodPending.forEach((id) => { if (eodDone.has(id)) eodPending.delete(id); });
    setEod([
      { name: "Not Created", value: Math.max(0, totalEmps - eodDone.size - eodPending.size), color: COLORS.notCreated },
      { name: "Pending", value: eodPending.size, color: COLORS.pending },
      { name: "Completed", value: eodDone.size, color: COLORS.completed },
    ]);

    // ---- Daywise Department Task ----
    const { data: dTasks } = await (supabase as any)
      .from("director_tasks")
      .select("status, expected_days, created_at");
    const now = new Date();
    let completed = 0, pending = 0, overdue = 0;
    (dTasks || []).forEach((t: any) => {
      if (t.status === "Completed") { completed += 1; return; }
      const deadline = new Date(t.created_at);
      deadline.setDate(deadline.getDate() + (t.expected_days || 0));
      if (now > deadline) overdue += 1; else pending += 1;
    });
    setDept([
      { name: "Assigned", value: (dTasks || []).length, color: COLORS.assigned },
      { name: "Pending", value: pending, color: COLORS.pending },
      { name: "Completed", value: completed, color: COLORS.completed },
      { name: "Overdue", value: overdue, color: COLORS.overdue },
    ]);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("director-dashboard-charts")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_reports" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "director_tasks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return (
    <>
      <PieBlock title="Employee-wise Daily Task" data={daily} />
      <PieBlock title="Employee-wise EOD" data={eod} />
      <PieBlock title="Daywise Department Task" data={dept} />
    </>
  );
};

export default DashboardPieCharts;
