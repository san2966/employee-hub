import { useMemo } from "react";
import { Target, Flame, ListTodo, AlarmClock, PhoneCall, CalendarRange } from "lucide-react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useBusinessCollection, formatDate, formatDateTime, isOverdue, effectiveTaskStatus, STATUS_OPTIONS } from "@/hooks/useBusinessData";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(45 93% 47%)",
  "hsl(142 71% 45%)",
  "hsl(var(--destructive))",
  "hsl(215 20% 55%)",
];

const Kpi = ({ label, value, icon: Icon, tone = "" }: { label: string; value: number; icon: any; tone?: string }) => (
  <Card className="p-4 flex items-center gap-3">
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10 ${tone}`}>
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold leading-tight">{value}</p>
    </div>
  </Card>
);

const ChartCard = ({ title, children }: { title: string; children: any }) => (
  <Card className="p-5">
    <h2 className="font-semibold mb-3">{title}</h2>
    <div className="h-60">{children}</div>
  </Card>
);

const BusinessDashboard = () => {
  const { profile, isHead, isDirector } = useBusinessAuth();
  const { rows: allOpps } = useBusinessCollection<any>("business_opportunities");
  const { rows: allTasks } = useBusinessCollection<any>("business_tasks");
  const { rows: staff } = useBusinessCollection<any>("business_profiles");
  const { rows: calls } = useBusinessCollection<any>("business_followups");
  const { rows: rc } = useBusinessCollection<any>("business_rc_tracker");

  const seesAll = isHead || isDirector;
  const mine = (r: any) => seesAll || (r.assignee_ids || []).includes(profile?.id);

  const opps = useMemo(() => allOpps.filter((o) => !o.is_lead && mine(o)), [allOpps, seesAll, profile?.id]);
  const leads = useMemo(() => allOpps.filter((o) => o.is_lead && mine(o)), [allOpps, seesAll, profile?.id]);
  const tasks = useMemo(() => allTasks.filter(mine), [allTasks, seesAll, profile?.id]);
  const myCalls = useMemo(
    () => (seesAll ? calls : calls.filter((c) => c.caller_id === profile?.id)),
    [calls, seesAll, profile?.id],
  );

  const statusData = useMemo(
    () => STATUS_OPTIONS.map((s, i) => ({
      name: s, value: opps.filter((o) => o.status === s).length, color: PALETTE[i % PALETTE.length],
    })).filter((d) => d.value > 0),
    [opps],
  );

  const taskData = useMemo(() => {
    const buckets = ["Pending", "In Process", "Completed", "Overdue", "Cancelled"];
    return buckets.map((s, i) => ({
      name: s, value: tasks.filter((t) => effectiveTaskStatus(t) === s).length, color: PALETTE[i % PALETTE.length],
    })).filter((d) => d.value > 0);
  }, [tasks]);

  const priorityData = useMemo(() => {
    const p = ["Low", "Medium", "High", "Critical"];
    return p.map((name) => ({
      name,
      Opportunity: opps.filter((o) => o.priority === name).length,
      Lead: leads.filter((o) => o.priority === name).length,
    }));
  }, [opps, leads]);

  const upcoming = useMemo(
    () => [...opps, ...leads]
      .filter((o) => o.next_followup_at)
      .sort((a, b) => new Date(a.next_followup_at).getTime() - new Date(b.next_followup_at).getTime())
      .slice(0, 6),
    [opps, leads],
  );

  const openTasks = tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status));

  return (
    <BusinessLayout title="Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <Kpi label="Opportunity" value={opps.length} icon={Target} />
        <Kpi label="Lead" value={leads.length} icon={Flame} />
        <Kpi label="Open Tasks" value={openTasks.length} icon={ListTodo} />
        <Kpi label="Overdue Tasks" value={tasks.filter(isOverdue).length} icon={AlarmClock} />
        <Kpi label="Calls Logged" value={myCalls.length} icon={PhoneCall} />
        <Kpi label="RC Records" value={rc.length} icon={CalendarRange} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <ChartCard title="Opportunity by Status">
          {statusData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={78} paddingAngle={2}>
                  {statusData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Task Status">
          {taskData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={78} paddingAngle={2}>
                  {taskData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Priority Mix">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} />
              <Tooltip /><Legend />
              <Bar dataKey="Opportunity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lead" fill="hsl(45 93% 47%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Upcoming Follow-ups</h2>
          {upcoming.map((o) => (
            <div key={o.id} className="py-2 border-b last:border-0 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{o.organization_name}</p>
                <p className="text-xs text-muted-foreground">{o.product_name} · {o.officer_name}</p>
              </div>
              <Badge variant={new Date(o.next_followup_at) < new Date() ? "destructive" : "secondary"}>
                {formatDateTime(o.next_followup_at)}
              </Badge>
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No scheduled follow-ups.</p>}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3">Pending Tasks</h2>
          {openTasks.slice(0, 8).map((t) => (
            <div key={t.id} className="py-2 border-b last:border-0 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">Due {formatDate(t.due_date)}</p>
              </div>
              <Badge variant={isOverdue(t) ? "destructive" : "secondary"}>{effectiveTaskStatus(t)}</Badge>
            </div>
          ))}
          {openTasks.length === 0 && <p className="text-sm text-muted-foreground">No pending tasks.</p>}
        </Card>
      </div>
    </BusinessLayout>
  );
};

export default BusinessDashboard;
