import { useState } from "react";
import PurchaseLayout from "@/components/purchase/PurchaseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Phone, Mail, Building2, Trash2 } from "lucide-react";
import { usePurchaseContacts } from "@/hooks/usePurchaseData";
import { supabase } from "@/integrations/supabase/client";

const PurchaseContacts = () => {
  const { data: contacts, add, remove } = usePurchaseContacts();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOrg, setFilterOrg] = useState("all");
  const [filterDesig, setFilterDesig] = useState("all");
  const [form, setForm] = useState({ name: "", phone: "", designation: "", department: "", organization: "", email: "" });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await add({ ...form, created_by: user?.id });
    setForm({ name: "", phone: "", designation: "", department: "", organization: "", email: "" });
    setAddOpen(false);
  };

  const orgs = [...new Set(contacts.map((c: any) => c.organization).filter(Boolean))];
  const desigs = [...new Set(contacts.map((c: any) => c.designation).filter(Boolean))];

  const filtered = contacts.filter((c: any) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchOrg = filterOrg === "all" || c.organization === filterOrg;
    const matchDesig = filterDesig === "all" || c.designation === filterDesig;
    return matchSearch && matchOrg && matchDesig;
  });

  return (
    <PurchaseLayout title="Contacts">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contacts</span>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Contact</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} /></div>
                  <div><Label>Department</Label><Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
                  <div><Label>Organization</Label><Input value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <Button onClick={handleAdd} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterOrg} onValueChange={setFilterOrg}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Organization" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {orgs.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterDesig} onValueChange={setFilterDesig}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Designation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {desigs.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{c.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {c.phone}</div>
                      {c.organization && <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Building2 className="h-3 w-3" /> {c.organization}</div>}
                      {c.email && <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> {c.email}</div>}
                      {c.designation && <p className="text-xs text-muted-foreground mt-1">{c.designation}{c.department ? ` • ${c.department}` : ""}</p>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </PurchaseLayout>
  );
};

export default PurchaseContacts;
