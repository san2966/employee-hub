import { useMemo, useState } from "react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToPDF } from "@/lib/exportUtils";
import {
  useBusinessCollection, formatDate, formatDateTime, effectiveTaskStatus, TASK_STATUS_OPTIONS,
} from "@/hooks/useBusinessData";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";

const Stat = ({ label, value }: { label: string; value: number }) => (
  <Card className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></Card>
);

const BusinessReports = () => {
  const { profile, isHead, isDirector } = useBusinessAuth();
  const { rows: allTasks } = useBusinessCollection<any>("business_tasks");
  const { rows: allOpps } = useBusinessCollection<any>("business_opportunities");
  const { rows: staff } = useBusinessCollection<any>("business_profiles", { orderBy: "name", ascending: true });

  const seesAll = isHead || isDirector;
  const mine = (r: any) => seesAll || (r.assignee_ids || []).includes(profile?.id);
  const tasks = useMemo(() => allTasks.filter(mine), [allTasks, seesAll, profile?.id]);
  const opps = useMemo(() => allOpps.filter(mine), [allOpps, seesAll, profile?.id]);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [emp, setEmp] = useState("all");
  const [status, setStatus] = useState("all");
  const [applied, setApplied] = useState<any>(null);

  const nameOf = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";

  const inRange = (value?: string | null) => {
    if (!value) return false;
    const d = value.slice(0, 10);
    if (applied?.from && d < applied.from) return false;
    if (applied?.to && d > applied.to) return false;
    return true;
  };

  const filteredTasks = useMemo(() => {
    if (!applied) return [];
    return tasks
      .filter((t) => inRange(t.due_date || t.created_at))
      .filter((t) => applied.emp === "all" || (t.assignee_ids || []).includes(applied.emp))
      .filter((t) => applied.status === "all" || effectiveTaskStatus(t) === applied.status);
  }, [tasks, applied]);

  const filteredOpps = useMemo(() => {
    if (!applied) return [];
    return opps
      .filter((o) => inRange(o.next_followup_at || o.updated_at || o.created_at))
      .filter((o) => applied.emp === "all" || (o.assignee_ids || []).includes(applied.emp));
  }, [opps, applied]);

  const exportTasks = () => exportToPDF({
    portal: "Business", type: "Task Report",
    columns: [
      { key: "title", header: "Task" }, { key: "assignees", header: "Assignee" },
      { key: "due", header: "Due" }, { key: "priority", header: "Priority" }, { key: "status", header: "Status" },
    ],
    data: filteredTasks.map((t) => ({
      title: t.title, assignees: (t.assignee_ids || []).map(nameOf).join(", "),
      due: formatDate(t.due_date), priority: t.priority, status: effectiveTaskStatus(t),
    })),
    dateRange: { from: applied?.from, to: applied?.to },
  });

  const exportPipeline = () => exportToPDF({
    portal: "Business", type: "Opportunity and Lead Report",
    columns: [
      { key: "kind", header: "Type" }, { key: "product", header: "Product" },
      { key: "org", header: "Organization" }, { key: "status", header: "Status" },
      { key: "priority", header: "Priority" }, { key: "followup", header: "Follow-up" },
    ],
    data: filteredOpps.map((o) => ({
      kind: o.is_lead ? "Lead" : "Opportunity", product: o.product_name, org: o.organization_name,
      status: o.status, priority: o.priority, followup: formatDateTime(o.next_followup_at),
    })),
    dateRange: { from: applied?.from, to: applied?.to },
  });

  return (
    <BusinessLayout title="Reports">
      <Card className="p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div className="w-full md:w-48">
            <Label className="text-xs">Employee</Label>
            <Select value={emp} onValueChange={setEmp}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-44">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {TASK_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setApplied({ from, to, emp, status })}>Show Records</Button>
        </div>
      </Card>

      {applied && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <Stat label="Total Tasks" value={filteredTasks.length} />
            <Stat label="Completed" value={filteredTasks.filter((t) => t.status === "Completed").length} />
            <Stat label="Overdue" value={filteredTasks.filter((t) => effectiveTaskStatus(t) === "Overdue").length} />
            <Stat label="Opportunities" value={filteredOpps.filter((o) => !o.is_lead).length} />
            <Stat label="Leads" value={filteredOpps.filter((o) => o.is_lead).length} />
          </div>

          <Card className="p-5 mb-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Tasks</h2>
              <Button variant="outline" size="sm" onClick={exportTasks} disabled={filteredTasks.length === 0}>Export to PDF</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead><TableHead>Assignee</TableHead><TableHead>Due</TableHead>
                  <TableHead>Priority</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-sm">{(t.assignee_ids || []).map(nameOf).join(", ") || "—"}</TableCell>
                    <TableCell>{formatDate(t.due_date)}</TableCell>
                    <TableCell>{t.priority}</TableCell>
                    <TableCell><Badge variant={effectiveTaskStatus(t) === "Overdue" ? "destructive" : "secondary"}>{effectiveTaskStatus(t)}</Badge></TableCell>
                  </TableRow>
                ))}
                {filteredTasks.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No tasks in this range.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-5 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Opportunities &amp; Leads</h2>
              <Button variant="outline" size="sm" onClick={exportPipeline} disabled={filteredOpps.length === 0}>Export to PDF</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead><TableHead>Product</TableHead><TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpps.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.is_lead ? "Lead" : "Opportunity"}</TableCell>
                    <TableCell className="font-medium">{o.product_name}</TableCell>
                    <TableCell>{o.organization_name}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell>{o.priority}</TableCell>
                    <TableCell>{formatDateTime(o.next_followup_at)}</TableCell>
                  </TableRow>
                ))}
                {filteredOpps.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No records in this range.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </BusinessLayout>
  );
};

export default BusinessReports;