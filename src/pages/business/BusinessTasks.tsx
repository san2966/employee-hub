import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";
import {
  useBusinessCollection, formatDate, effectiveTaskStatus,
  PRIORITY_OPTIONS, TASK_STATUS_OPTIONS,
} from "@/hooks/useBusinessData";

const empty = {
  title: "", opportunity_id: "", assignee_ids: [] as string[], due_date: "",
  priority: "Medium", description: "",
};

const BusinessTasks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isHead } = useBusinessAuth();
  const { rows: tasks, refresh } = useBusinessCollection<any>("business_tasks");
  const { rows: staff } = useBusinessCollection<any>("business_profiles", { orderBy: "name", ascending: true });
  const { rows: opps } = useBusinessCollection<any>("business_opportunities");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fPriority, setFPriority] = useState("all");
  const [fAssignee, setFAssignee] = useState("all");

  const nameOf = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";

  const visible = useMemo(
    () => (isHead ? tasks : tasks.filter((t) => (t.assignee_ids || []).includes(profile?.id))),
    [tasks, isHead, profile?.id],
  );

  const filtered = useMemo(() => visible
    .filter((t) => fStatus === "all" || effectiveTaskStatus(t) === fStatus)
    .filter((t) => fPriority === "all" || t.priority === fPriority)
    .filter((t) => fAssignee === "all" || (t.assignee_ids || []).includes(fAssignee))
    .filter((t) => {
      const q = search.trim().toLowerCase();
      return !q || `${t.title} ${t.description ?? ""}`.toLowerCase().includes(q);
    }), [visible, fStatus, fPriority, fAssignee, search]);

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Task title is required", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("business_tasks").insert({
      title: form.title,
      opportunity_id: form.opportunity_id || null,
      assignee_ids: form.assignee_ids,
      due_date: form.due_date || null,
      priority: form.priority,
      status: "Pending",
      description: form.description || null,
      created_by: user?.id ?? null,
    });
    if (error) { toast({ title: "Could not save task", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Task saved" });
    setOpen(false); setForm(empty); void refresh();
  };

  const toggleAssignee = (id: string) =>
    setForm((f: any) => ({
      ...f,
      assignee_ids: f.assignee_ids.includes(id)
        ? f.assignee_ids.filter((x: string) => x !== id)
        : [...f.assignee_ids, id],
    }));

  const badgeVariant = (s: string) =>
    s === "Overdue" ? "destructive" : s === "Completed" ? "default" : "secondary";

  return (
    <BusinessLayout title="Tasks">
      <Card className="p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks" />
            </div>
          </div>
          <div className="w-full md:w-40">
            <Label className="text-xs">Status</Label>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {TASK_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-40">
            <Label className="text-xs">Priority</Label>
            <Select value={fPriority} onValueChange={setFPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {PRIORITY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label className="text-xs">Assignee</Label>
            <Select value={fAssignee} onValueChange={setFAssignee}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {isHead && (
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Task</Button>
          )}
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/business/tasks/${t.id}`)}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell className="text-sm">{(t.assignee_ids || []).map(nameOf).join(", ") || "—"}</TableCell>
                <TableCell>{formatDate(t.due_date)}</TableCell>
                <TableCell>{t.priority}</TableCell>
                <TableCell><Badge variant={badgeVariant(effectiveTaskStatus(t))}>{effectiveTaskStatus(t)}</Badge></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tasks found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Task *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Related Opportunity</Label>
              <Select value={form.opportunity_id || "none"} onValueChange={(v) => setForm({ ...form, opportunity_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {opps.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.product_name} — {o.organization_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned Employees</Label>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1.5 mt-1">
                {staff.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.assignee_ids.includes(s.id)} onCheckedChange={() => toggleAssignee(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessTasks;