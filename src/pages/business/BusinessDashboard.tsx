import { useMemo } from "react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBusinessCollection, formatDate, formatDateTime, isOverdue } from "@/hooks/useBusinessData";

const Stat = ({ label, value }: { label: string; value: number }) => (
  <Card className="p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </Card>
);

const BusinessDashboard = () => {
  const { rows: opps } = useBusinessCollection<any>("business_opportunities");
  const { rows: tasks } = useBusinessCollection<any>("business_tasks");
  const { rows: staff } = useBusinessCollection<any>("business_profiles");
  const { rows: calls } = useBusinessCollection<any>("business_followups");

  const today = new Date().toISOString().slice(0, 10);
  const leads = useMemo(() => opps.filter((o) => o.is_lead), [opps]);
  const opportunities = useMemo(() => opps.filter((o) => !o.is_lead), [opps]);

  return (
    <BusinessLayout title="Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <Stat label="Total Leads" value={leads.length} />
        <Stat label="Total Opportunity" value={opportunities.length} />
        <Stat label="New Today" value={opportunities.filter((o) => (o.created_at || "").slice(0, 10) === today).length} />
        <Stat label="Active Leads" value={leads.filter((l) => (l.assignee_ids || []).length > 0 && l.status !== "Completed").length} />
        <Stat label="Active Staff" value={staff.filter((s) => s.is_active && s.designation !== "business_head").length} />
        <Stat label="Overdue Task" value={tasks.filter(isOverdue).length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Recent Leads</h2>
          {leads.slice(0, 5).map((l) => (
            <div key={l.id} className="py-2 border-b last:border-0">
              <p className="text-sm font-medium">{l.product_name} — {l.organization_name}</p>
              <p className="text-xs text-muted-foreground">{l.officer_name} · {formatDate(l.created_at)}</p>
            </div>
          ))}
          {leads.length === 0 && <p className="text-sm text-muted-foreground">No leads yet.</p>}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3">Recent Opportunity</h2>
          {opportunities.slice(0, 5).map((o) => (
            <div key={o.id} className="py-2 border-b last:border-0">
              <p className="text-sm font-medium">{o.product_name} — {o.organization_name}</p>
              <p className="text-xs text-muted-foreground">{o.officer_name} · {formatDate(o.created_at)}</p>
            </div>
          ))}
          {opportunities.length === 0 && <p className="text-sm text-muted-foreground">No opportunities yet.</p>}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3">Pending Task</h2>
          {tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status)).slice(0, 8).map((t) => (
            <div key={t.id} className="py-2 border-b last:border-0 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">Due {formatDate(t.due_date)}</p>
              </div>
              <Badge variant={isOverdue(t) ? "destructive" : "secondary"}>{isOverdue(t) ? "Overdue" : t.status}</Badge>
            </div>
          ))}
          {tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status)).length === 0 && (
            <p className="text-sm text-muted-foreground">No pending tasks.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3">Overdue Follow-ups</h2>
          {opps.filter((o) => o.next_followup_at && new Date(o.next_followup_at) < new Date()).slice(0, 8).map((o) => (
            <div key={o.id} className="py-2 border-b last:border-0">
              <p className="text-sm font-medium">{o.organization_name}</p>
              <p className="text-xs text-muted-foreground">Scheduled {formatDateTime(o.next_followup_at)}</p>
            </div>
          ))}
          {calls.filter((c) => c.review_status === "Pending").slice(0, 3).map((c) => (
            <div key={c.id} className="py-2 border-b last:border-0">
              <p className="text-sm font-medium">{c.organization} (call review pending)</p>
              <p className="text-xs text-muted-foreground">{formatDate(c.called_on)}</p>
            </div>
          ))}
        </Card>
      </div>
    </BusinessLayout>
  );
};

export default BusinessDashboard;