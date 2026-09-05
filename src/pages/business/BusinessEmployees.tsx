import { useState } from "react";
import { Plus, Pencil, Ban } from "lucide-react";
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
import { useBusinessCollection, formatDateTime } from "@/hooks/useBusinessData";
import { designationLabels, BusinessDesignation } from "@/hooks/useBusinessAuth";

const designations: BusinessDesignation[] = [
  "director", "area_sales_manager", "business_development_manager", "rc_technical",
];

const empty = { name: "", email: "", password: "", phone: "", designation: "area_sales_manager", area_ids: [] as string[] };

const BusinessEmployees = () => {
  const { toast } = useToast();
  const { rows, refresh } = useBusinessCollection<any>("business_profiles", { orderBy: "created_at", ascending: false });
  const { rows: areas } = useBusinessCollection<any>("business_areas", { orderBy: "district", ascending: true });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);

  const rowAreaIds = (row: any): string[] =>
    (Array.isArray(row.area_ids) && row.area_ids.length ? row.area_ids : row.area_id ? [row.area_id] : []) as string[];

  const areasLabel = (row: any) => {
    const names = rowAreaIds(row)
      .map((id) => areas.find((x) => x.id === id))
      .filter(Boolean)
      .map((a: any) => `${a.district}, ${a.state}`);
    return names.length ? names.join(" | ") : "—";
  };

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name, email: row.email, password: "", phone: row.phone || "",
      designation: row.designation, area_ids: rowAreaIds(row),
    });
    setOpen(true);
  };

  const toggleArea = (id: string) => {
    setForm((f: any) => ({
      ...f,
      area_ids: f.area_ids.includes(id)
        ? f.area_ids.filter((x: string) => x !== id)
        : [...f.area_ids, id],
    }));
  };

  const saveAreas = async (profileId?: string, email?: string) => {
    let id = profileId;
    if (!id && email) {
      const { data } = await supabase.from("business_profiles").select("id").eq("email", email).maybeSingle();
      id = data?.id;
    }
    if (!id) return;
    await supabase.from("business_profiles").update({
      area_ids: form.area_ids,
      area_id: form.area_ids[0] || null,
    }).eq("id", id);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = editing
        ? {
            action: "update_employee", profile_id: editing.id, name: form.name, phone: form.phone,
            designation: form.designation, area_id: form.area_id || null,
            ...(form.password ? { password: form.password } : {}),
          }
        : {
            action: "create_employee", name: form.name, email: form.email, password: form.password,
            phone: form.phone, designation: form.designation, area_id: form.area_id || null,
          };
      const { data, error } = await supabase.functions.invoke("business-admin", { body: payload });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast({ title: editing ? "Employee updated" : "Account created" });
      setOpen(false);
      void refresh();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (row: any) => {
    const { data, error } = await supabase.functions.invoke("business-admin", {
      body: { action: "deactivate_employee", profile_id: row.id },
    });
    if (error || data?.error) {
      toast({ title: "Failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Employee deactivated" });
      void refresh();
    }
  };

  return (
    <BusinessLayout title="Employees">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{rows.filter((r) => r.is_active).length} active staff</p>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New Employee</Button>
      </div>

      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No employees yet</TableCell></TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm">{r.email}</TableCell>
                <TableCell className="text-sm">{designationLabels[r.designation as BusinessDesignation]}</TableCell>
                <TableCell className="text-sm">{areaLabel(r.area_id)}</TableCell>
                <TableCell>
                  <Badge variant={r.is_active ? "default" : "secondary"}>
                    {r.is_active ? "Active" : "Not Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{r.last_login ? formatDateTime(r.last_login) : "Never"}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  {r.is_active && r.designation !== "business_head" && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivate(r)}>
                      <Ban className="h-4 w-4 mr-1" /> Deactivate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Employee" : "New Employee"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} disabled={!!editing}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{editing ? "Reset Temporary Password (optional)" : "Temporary Password"}</Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Used for the first login only" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Select value={form.designation} onValueChange={(v) => setForm({ ...form, designation: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {designations.map((d) => <SelectItem key={d} value={d}>{designationLabels[d]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Area</Label>
              <Select value={form.area_id} onValueChange={(v) => setForm({ ...form, area_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.district}, {a.state}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessEmployees;