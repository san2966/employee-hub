import { useState, useRef } from "react";
import OperationsLayout from "@/components/operations/OperationsLayout";
import { useOperationsData } from "@/hooks/useOperationsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download } from "lucide-react";
import { Eye } from "lucide-react";

const OperationsGR = () => {
  const { toast } = useToast();
  const { gr, uploadFile, getSignedUrl } = useOperationsData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ department_name: "", title: "", unique_code: "", gr_date: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSubmit = async () => {
    if (!form.department_name || !form.title || !form.unique_code || !form.gr_date) {
      toast({ title: "Error", description: "All fields are mandatory", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      let fileUrl = "";
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: "Error", description: "File must be under 10MB", variant: "destructive" });
          setUploading(false);
          return;
        }
        fileUrl = await uploadFile(file, "gr");
      }
      await gr.add({ ...form, file_url: fileUrl || null });
      setDialogOpen(false);
      setForm({ department_name: "", title: "", unique_code: "", gr_date: "" });
      setFile(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDownload = async (item: any) => {
    if (!item.file_url) return;
    const url = await getSignedUrl(item.file_url);
    if (url) window.open(url, "_blank");
  };

  const handlePreview = async (item: any) => {
    if (!item.file_url) {
      toast({ title: "No File", description: "No file attached to this record" });
      return;
    }
    const url = await getSignedUrl(item.file_url);
    if (url) {
      setPreviewUrl(url);
      setPreviewOpen(true);
    }
  };

  const depts = [...new Set(gr.data.map((g: any) => g.department_name))];

  const filtered = gr.data.filter((g: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || g.title.toLowerCase().includes(q) || g.unique_code.toLowerCase().includes(q) || g.department_name.toLowerCase().includes(q);
    const matchesDept = !deptFilter || g.department_name === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <OperationsLayout title="GR Manager">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search GR records..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Upload GR</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload GR</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Department Name *</Label><Input value={form.department_name} onChange={(e) => setForm({...form, department_name: e.target.value})} /></div>
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
                <div><Label>Unique Code *</Label><Input value={form.unique_code} onChange={(e) => setForm({...form, unique_code: e.target.value})} /></div>
                <div><Label>GR Date *</Label><Input type="date" value={form.gr_date} onChange={(e) => setForm({...form, gr_date: e.target.value})} /></div>
                <div><Label>Upload File</Label><Input type="file" ref={fileRef} onChange={(e) => setFile(e.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground mt-1">Max 10MB</p></div>
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unique Code</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">GR Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Preview</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g: any) => (
                  <tr key={g.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">{g.department_name}</td>
                    <td className="px-4 py-3">{g.title}</td>
                    <td className="px-4 py-3 font-mono text-xs">{g.unique_code}</td>
                    <td className="px-4 py-3">{g.gr_date}</td>
                    <td className="px-4 py-3">
                      {g.file_url ? (
                        <Button size="sm" variant="secondary" onClick={() => handlePreview(g)}>
                          <Eye className="h-3 w-3 mr-1" />Preview
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No file</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {g.file_url && (
                        <Button size="sm" variant="outline" onClick={() => handleDownload(g)}>
                          <Download className="h-3 w-3 mr-1" />Download
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {filtered.length === 0 && !gr.loading && <p className="text-center text-muted-foreground py-8">No GR records found</p>}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-2">
          <DialogHeader className="p-2">
            <DialogTitle>GR Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe src={previewUrl} className="w-full h-full rounded border" title="GR Preview" />
          )}
        </DialogContent>
      </Dialog>
    </OperationsLayout>
  );
};

export default OperationsGR;
