import { useState, useMemo } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenderContacts } from "@/hooks/useTenderData";
import { Plus, Search, Users, Phone, Mail, Building2 } from "lucide-react";

const TenderContacts = () => {
  const { data: contacts, add } = useTenderContacts();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", designation: "", department: "", organization: "", email: "" });
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [desigFilter, setDesigFilter] = useState("");

  const uniqueOrgs = [...new Set(contacts.map((c: any) => c.organization).filter(Boolean))];
  const uniqueDesigs = [...new Set(contacts.map((c: any) => c.designation).filter(Boolean))];

  const filtered = useMemo(() => contacts.filter((c: any) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
    if (orgFilter && c.organization !== orgFilter) return false;
    if (desigFilter && c.designation !== desigFilter) return false;
    return true;
  }), [contacts, search, orgFilter, desigFilter]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    await add(form as any);
    setForm({ name: "", phone: "", designation: "", department: "", organization: "", email: "" });
    setOpen(false);
  };

  return (
    <TenderLayout title="Contacts">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="pl-9 w-56" />
          </div>
          <Select value={orgFilter} onValueChange={v => setOrgFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Organization" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {uniqueOrgs.map(o => <SelectItem key={o} value={o!}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={desigFilter} onValueChange={v => setDesigFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Designation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {uniqueDesigs.map(d => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Contact</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No contacts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-sm">{c.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</div>
                {c.organization && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-3 w-3" />{c.organization}</div>}
                {c.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Phone Number *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Designation (Optional)</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} /></div>
            <div><Label>Department (Optional)</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
            <div><Label>Organization</Label><Input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} /></div>
            <div><Label>E-Mail (Optional)</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <Button onClick={handleSubmit} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TenderLayout>
  );
};

export default TenderContacts;
