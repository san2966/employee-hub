import { useState, useRef } from "react";
import OperationsLayout from "@/components/operations/OperationsLayout";
import { useOperationsData } from "@/hooks/useOperationsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download, Eye, RotateCcw } from "lucide-react";

const typeOptions = ["Letter", "Proposal", "Other"];
const addlDocsOptions = ["Broucher", "Work Orders", "Product File"];

const OperationsOutwards = () => {
  const { toast } = useToast();
  const { outwards, uploadFile, getSignedUrl } = useOperationsData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    proposal_id: "",
    type: "Letter",
    employee_name: "",
    organization_name: "",
    subject: "",
    additional_documents: [] as string[],
    outward_date: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const toggleAddlDoc = (doc: string) => {
    setForm(f => ({
      ...f,
      additional_documents: f.additional_documents.includes(doc)
        ? f.additional_documents.filter(d => d !== doc)
        : [...f.additional_documents, doc],
    }));
  };

  const handleSubmit = async () => {
    if (!form.type || !form.employee_name || !form.organization_name || !form.subject) {
      toast({ title: "Error", description: "Type, Employee Name, Organization, and Subject are mandatory", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Error", description: "Document upload is mandatory", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be under 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, "outwards");
      await outwards.add({ ...form, file_url: fileUrl, status: "Submitted" });
      setDialogOpen(false);
      setForm({ proposal_id: "", type: "Letter", employee_name: "", organization_name: "", subject: "", additional_documents: [], outward_date: "" });
      setFile(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handlePreview = async (item: any) => {
    if (!item.file_url) {
      toast({ title: "No File", description: "No document attached" });
      return;
    }
    const url = await getSignedUrl(item.file_url);
    if (url) { setPreviewUrl(url); setPreviewOpen(true); }
  };

  const handleDownload = async (item: any) => {
    if (!item.file_url) return;
    const url = await getSignedUrl(item.file_url);
    if (url) window.open(url, "_blank");
  };

  const handleReturn = async (item: any) => {
    await outwards.update(item.id, { status: "Returned" });
  };

  const filtered = outwards.data.filter((i: any) => {
    const q = search.toLowerCase();
    return !q || i.subject.toLowerCase().includes(q) || i.organization_name.toLowerCase().includes(q) || i.employee_name.toLowerCase().includes(q) || (i.proposal_id || "").toLowerCase().includes(q);
  });

  return (
    <OperationsLayout title="Outward Management">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search outwards..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Create Outward</Button></DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Outward</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Proposal ID (optional)</Label><Input value={form.proposal_id} onChange={(e) => setForm({...form, proposal_id: e.target.value})} placeholder="Approved proposal ID" /></div>
                <div><Label>Type *</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                    {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><Label>Employee Name *</Label><Input value={form.employee_name} onChange={(e) => setForm({...form, employee_name: e.target.value})} /></div>
                <div><Label>Organization Name *</Label><Input value={form.organization_name} onChange={(e) => setForm({...form, organization_name: e.target.value})} /></div>
                <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} /></div>
                <div>
                  <Label>Additional Documents</Label>
                  <div className="space-y-2 mt-2">
                    {addlDocsOptions.map(doc => (
                      <label key={doc} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.additional_documents.includes(doc)}
                          onCheckedChange={() => toggleAddlDoc(doc)}
                        />
                        {doc}
                      </label>
                    ))}
                  </div>
                </div>
                <div><Label>Date</Label><Input type="date" value={form.outward_date} onChange={(e) => setForm({...form, outward_date: e.target.value})} /></div>
                <div><Label>Upload Document (PDF, max 10MB) *</Label><Input type="file" accept="application/pdf" ref={fileRef} onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Additional Docs</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i: any) => (
                  <tr key={i.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{i.proposal_id || "-"}</td>
                    <td className="px-4 py-3">{i.type}</td>
                    <td className="px-4 py-3">{i.employee_name}</td>
                    <td className="px-4 py-3">{i.organization_name}</td>
                    <td className="px-4 py-3">{i.subject}</td>
                    <td className="px-4 py-3 text-xs">{(i.additional_documents || []).join(", ") || "-"}</td>
                    <td className="px-4 py-3">{i.outward_date || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${i.status === "Returned" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {i.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" title="Return" onClick={() => handleReturn(i)} disabled={i.status === "Returned"}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Preview" onClick={() => handlePreview(i)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Download" onClick={() => handleDownload(i)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {filtered.length === 0 && !outwards.loading && <p className="text-center text-muted-foreground py-8">No outward records found</p>}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-2">
          <DialogHeader className="p-2 flex flex-row items-center justify-between">
            <DialogTitle>Outward Preview</DialogTitle>
            {previewUrl && (
              <Button size="sm" variant="outline" onClick={() => window.open(previewUrl, "_blank")}>
                <Download className="h-3 w-3 mr-1" />Download
              </Button>
            )}
          </DialogHeader>
          {previewUrl && (
            <object data={previewUrl} type="application/pdf" className="w-full h-full rounded border">
              <iframe src={previewUrl} className="w-full h-full rounded border" title="Outward Preview" />
              <p className="p-4 text-sm text-muted-foreground">
                Unable to preview inline. <a href={previewUrl} target="_blank" rel="noreferrer" className="text-primary underline">Open in a new tab</a>.
              </p>
            </object>
          )}
        </DialogContent>
      </Dialog>
    </OperationsLayout>
  );
};

export default OperationsOutwards;