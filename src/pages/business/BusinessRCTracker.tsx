import { useState } from "react";
import { Plus } from "lucide-react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessCollection, formatDate } from "@/hooks/useBusinessData";

const RC_STATUS = ["Pending", "No Answer", "Contacted"];
const empty = { organization_name: "", location_name: "", operator_name: "", contact: "", last_contacted: "", status: "Pending" };

const BusinessRCTracker = () => {
  const { toast } = useToast();
  const { rows, refresh } = useBusinessCollection<any>("business_rc_tracker");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const save = async () => {
    if (!form.organization_name.trim() || !form.location_name.trim()) {
      toast({ title: "Organization and location are required", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any).from("business_rc_tracker").insert({
      ...form,
      last_contacted: form.last_contacted || null,
    });
    if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    else { toast({ title: "Record added" }); setForm(empty); setOpen(false); void refresh(); }
  };

  const setStatus = async (id: string, status: string) => {
    await (supabase as any).from("business_rc_tracker")
      .update({ status, last_contacted: new Date().toISOString().slice(0, 10) }).eq("id", id);
    void refresh();
  };

  return (
    <BusinessLayout title="RC Tracker">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{rows.length} record(s)</p>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Record</Button>
      </div>

      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Organization Name</TableHead>
              <TableHead>Location Name</TableHead>
              <TableHead>Operator Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Last Contacted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No records yet</TableCell></TableRow>
            )}
            {rows.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs text-muted-foreground">RC-{String(rows.length - i).padStart(4, "0")}</TableCell>
                <TableCell className="font-medium">{r.organization_name}</TableCell>
                <TableCell>{r.location_name}</TableCell>
                <TableCell>{r.operator_name || "—"}</TableCell>
                <TableCell>{r.contact || "—"}</TableCell>
                <TableCell>{formatDate(r.last_contacted)}</TableCell>
                <TableCell>
                  <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RC_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add RC Record</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Organization Name</Label>
              <Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location Name</Label>
              <Input value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Operator Name</Label>
              <Input value={form.operator_name} onChange={(e) => setForm({ ...form, operator_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Last Contacted</Label>
              <Input type="date" value={form.last_contacted} onChange={(e) => setForm({ ...form, last_contacted: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RC_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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

export default BusinessRCTracker;