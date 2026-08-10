import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";
import {
  useBusinessCollection, formatDate, formatDateTime, effectiveTaskStatus, TASK_STATUS_OPTIONS,
} from "@/hooks/useBusinessData";

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value || "—"}</p></div>
);

const BusinessTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, readOnly } = useBusinessAuth();
  const { rows: tasks, refresh } = useBusinessCollection<any>("business_tasks");
  const { rows: staff } = useBusinessCollection<any>("business_profiles", { orderBy: "name", ascending: true });
  const { rows: opps } = useBusinessCollection<any>("business_opportunities");
  const { rows: reports, refresh: refreshReports } = useBusinessCollection<any>("business_task_reports");

  const [report, setReport] = useState("");
  const [status, setStatus] = useState("Completed");

  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);
  const opp = useMemo(() => opps.find((o) => o.id === task?.opportunity_id), [opps, task]);
  const taskReports = useMemo(() => reports.filter((r) => r.task_id === id), [reports, id]);
  const nameOf = (sid: string) => staff.find((s) => s.id === sid)?.name ?? "—";

  const submit = async () => {
    if (!report.trim()) { toast({ title: "Report is required", variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("business_task_reports").insert({
      task_id: id, profile_id: profile?.id ?? null, reporter_name: profile?.name ?? null,
      report, status, created_by: user?.id ?? null,
    });
    if (error) { toast({ title: "Could not submit report", description: error.message, variant: "destructive" }); return; }
    await (supabase as any).from("business_tasks").update({ status }).eq("id", id);
    toast({ title: "Report submitted" });
    setReport(""); void refreshReports(); void refresh();
  };

  return (
    <BusinessLayout title="Task Details">
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/business/tasks")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {!task ? (
        <Card className="p-6 text-sm text-muted-foreground">Task not found.</Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">{task.title}</h2>
              <Badge variant={effectiveTaskStatus(task) === "Overdue" ? "destructive" : "secondary"}>
                {effectiveTaskStatus(task)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Row label="Due Date" value={formatDate(task.due_date)} />
              <Row label="Priority" value={task.priority} />
              <Row label="Assignees" value={(task.assignee_ids || []).map(nameOf).join(", ")} />
              <Row label="Created" value={formatDateTime(task.created_at)} />
            </div>
            {task.description && <p className="text-sm mt-4 whitespace-pre-wrap">{task.description}</p>}
          </Card>

          {opp && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Related Opportunity / Lead</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Row label="Product" value={opp.product_name} />
                <Row label="Organization" value={opp.organization_name} />
                <Row label="Officer" value={opp.officer_name} />
                <Row label="Status" value={opp.status} />
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate(`/business/opportunities/${opp.id}`)}>
                Open record
              </Button>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Employee Reports</h3>
            {taskReports.length === 0 && <p className="text-sm text-muted-foreground">No reports submitted yet.</p>}
            {taskReports.map((r) => (
              <div key={r.id} className="py-2 border-b last:border-0">
                <p className="text-sm whitespace-pre-wrap">{r.report}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {r.reporter_name || "—"} · {r.status} · {formatDateTime(r.created_at)}
                </p>
              </div>
            ))}

            {!readOnly && (task.assignee_ids || []).includes(profile?.id) && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div><Label>Submit Report</Label><Textarea value={report} onChange={(e) => setReport(e.target.value)} /></div>
                <div className="w-48">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TASK_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={submit}>Submit</Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </BusinessLayout>
  );
};

export default BusinessTaskDetail;