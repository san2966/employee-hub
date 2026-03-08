import { useState, useRef } from "react";
import OperationsLayout from "@/components/operations/OperationsLayout";
import { useOperationsData } from "@/hooks/useOperationsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download } from "lucide-react";

const docTypes = ["Letter", "Proposal", "Bill Tax Invoice", "Other"];

const OperationsInwards = () => {
  const { toast } = useToast();
  const { inwards, uploadFile, getSignedUrl } = useOperationsData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ document_type: "Letter", product_name: "", organization_name: "", subject: "", e_office_number: "", date: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");

  const handleSubmit = async () => {
    if (!form.product_name || !form.organization_name || !form.subject) {
      toast({ title: "Error", description: "Product, Organization, and Subject are mandatory", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Error", description: "File upload is mandatory", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be under 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, "inwards");
      await inwards.add({ ...form, file_url: fileUrl });
      setDialogOpen(false);
      setForm({ document_type: "Letter", product_name: "", organization_name: "", subject: "", e_office_number: "", date: "" });
      setFile(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDownload = async (item: any) => {
    const url = await getSignedUrl(item.file_url);
    if (url) window.open(url, "_blank");
  };

  const orgs = [...new Set(inwards.data.map((i: any) => i.organization_name))];

  const filtered = inwards.data.filter((i: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || i.product_name.toLowerCase().includes(q) || i.organization_name.toLowerCase().includes(q) || i.subject.toLowerCase().includes(q);
    const matchesOrg = !orgFilter || i.organization_name === orgFilter;
    const matchesType = !docTypeFilter || i.document_type === docTypeFilter;
    return matchesSearch && matchesOrg && matchesType;
  });

  return (
    <OperationsLayout title="Inward Management">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search inwards..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
            <option value="">All Organizations</option>
            {orgs.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={docTypeFilter} onChange={(e) => setDocTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Create Inward</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Inward</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Document Type *</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.document_type} onChange={(e) => setForm({...form, document_type: e.target.value})}>
                    {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><Label>Product Name *</Label><Input value={form.product_name} onChange={(e) => setForm({...form, product_name: e.target.value})} /></div>
                <div><Label>Organization Name *</Label><Input value={form.organization_name} onChange={(e) => setForm({...form, organization_name: e.target.value})} /></div>
                <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} /></div>
                <div><Label>E-Office Number</Label><Input value={form.e_office_number} onChange={(e) => setForm({...form, e_office_number: e.target.value})} /></div>
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} /></div>
                <div><Label>Upload Document *</Label><Input type="file" ref={fileRef} onChange={(e) => setFile(e.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground mt-1">Max 10MB</p></div>
                <Button onClick={handleSubmit} disabled={uploading} className="w-full">{uploading ? "Submitting..." : "Submit"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-Office</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i: any) => (
                  <tr key={i.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">{i.document_type}</td>
                    <td className="px-4 py-3">{i.product_name}</td>
                    <td className="px-4 py-3">{i.organization_name}</td>
                    <td className="px-4 py-3">{i.subject}</td>
                    <td className="px-4 py-3">{i.e_office_number || "-"}</td>
                    <td className="px-4 py-3">{i.date || "-"}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(i)}>
                        <Download className="h-3 w-3 mr-1" />Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {filtered.length === 0 && !inwards.loading && <p className="text-center text-muted-foreground py-8">No inward records found</p>}
      </div>
    </OperationsLayout>
  );
};

export default OperationsInwards;
