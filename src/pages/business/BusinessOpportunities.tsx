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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  useBusinessCollection, formatDateTime, STATUS_OPTIONS, PRIORITY_OPTIONS, SOURCE_OPTIONS,
} from "@/hooks/useBusinessData";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";

const empty = {
  product_name: "", organization_name: "", officer_name: "", organization_type: "", phone: "", email: "",
  source: "Call", priority: "Medium", status: "New", description: "", assignee_ids: [] as string[],
};

const BusinessOpportunities = ({ mode = "opportunity" }: { mode?: "opportunity" | "lead" }) => {
  const isLead = mode === "lead";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isHead, isDirector, readOnly } = useBusinessAuth();
  const canAdd = isHead;
  const { rows, refresh } = useBusinessCollection<any>("business_opportunities");
  const { rows: staff } = useBusinessCollection<any>("business_profiles", { orderBy: "name", ascending: true });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fPriority, setFPriority] = useState("all");
  const [fAssignee, setFAssignee] = useState("all");

  const nameOf = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";

  const filtered = useMemo(() => rows
    .filter((r) => !!r.is_lead === isLead)
    .filter((r) => (isHead || isDirector ? true : (r.assignee_ids || []).includes(profile?.id)))
    .filter((r) => fStatus === "all" || r.status === fStatus)
    .filter((r) => fPriority === "all" || r.priority === fPriority)
    .filter((r) => fAssignee === "all" || (r.assignee_ids || []).includes(fAssignee))
    .filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [r.product_name, r.organization_name, r.officer_name].join(" ").toLowerCase().includes(q);
    }), [rows, isLead, isHead, isDirector, profile?.id, fStatus, fPriority, fAssignee, search]);

  const save = async () => {
    if (!form.product_name.trim() || !form.organization_name.trim() || !form.officer_name.trim()) {
      toast({ title: "Product, organization and officer name are required", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("business_opportunities").insert({
      ...form, created_by: user?.id ?? null,
    });
    if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    else { toast({ title: "Opportunity added" }); setForm(empty); setOpen(false); void refresh(); }
  };

  const toggleAssignee = (id: string) => setForm((f: any) => ({
    ...f,
    assignee_ids: f.assignee_ids.includes(id)
      ? f.assignee_ids.filter((x: string) => x !== id)
      : [...f.assignee_ids, id],
  }));

  return (
    <BusinessLayout title={isLead ? "Lead" : "Opportunity"}>
      <Card className="p-4 mb-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fPriority} onValueChange={setFPriority}>
            <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Priority</SelectItem>
              {PRIORITY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fAssignee} onValueChange={setFAssignee}>
            <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Assignees</SelectItem>
              {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Card>

      {!isLead && !readOnly && canAdd && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Opportunity</Button>
        </div>
      )}

      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isLead ? "Lead" : "Opportunity"}</TableHead>
              <TableHead>Organization Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Follow-up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No records</TableCell></TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/business/${isLead ? "leads" : "opportunities"}/${r.id}`)}>
                <TableCell>
                  <p className="font-medium">{r.product_name}</p>
                  <p className="text-xs text-muted-foreground">{r.officer_name}</p>
                </TableCell>
                <TableCell>{r.organization_name}</TableCell>
                <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                <TableCell><Badge variant={r.priority === "Critical" || r.priority === "High" ? "destructive" : "outline"}>{r.priority}</Badge></TableCell>
                <TableCell className="text-sm">{(r.assignee_ids || []).map(nameOf).join(", ") || "—"}</TableCell>
                <TableCell className="text-sm">{formatDateTime(r.next_followup_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Opportunity</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Product Name</Label>
              <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Organization Name</Label>
              <Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Officer Name</Label>
              <Input value={form.officer_name} onChange={(e) => setForm({ ...form, officer_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Organization Type</Label>
              <Input value={form.organization_type} onChange={(e) => setForm({ ...form, organization_type: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-2"><Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Assignee</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {staff.filter((s) => s.is_active).map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.assignee_ids.includes(s.id)} onCheckedChange={() => toggleAssignee(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2"><Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessOpportunities;