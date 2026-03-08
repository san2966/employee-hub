import { useState, useRef } from "react";
import OperationsLayout from "@/components/operations/OperationsLayout";
import { useOperationsData } from "@/hooks/useOperationsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Download, Presentation } from "lucide-react";

const OperationsPresentations = () => {
  const { toast } = useToast();
  const { presentations, uploadFile, getSignedUrl } = useOperationsData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !file) {
      toast({ title: "Error", description: "Title and file are required", variant: "destructive" });
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be under 500MB", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["ppt", "pptx", "ppsx"].includes(ext || "")) {
      toast({ title: "Error", description: "Only PowerPoint files are allowed", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, "presentations");
      await presentations.add({ ...form, file_url: fileUrl });
      setDialogOpen(false);
      setForm({ title: "", description: "" });
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

  return (
    <OperationsLayout title="Presentation Management">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Upload Presentation</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Presentation</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
                <div><Label>Upload PPT *</Label><Input type="file" ref={fileRef} accept=".ppt,.pptx,.ppsx" onChange={(e) => setFile(e.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground mt-1">Max 500MB, PowerPoint only</p></div>
                <Button onClick={handleSubmit} disabled={uploading} className="w-full">{uploading ? "Uploading..." : "Upload"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {presentations.data.map((p: any) => (
            <div key={p.id} className="bg-card border rounded-xl p-4 space-y-2">
              <Presentation className="h-8 w-8 text-primary/50" />
              <p className="font-medium text-foreground">{p.title}</p>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownload(p)}>
                <Download className="h-3 w-3 mr-1" />Download
              </Button>
            </div>
          ))}
        </div>
        {presentations.data.length === 0 && !presentations.loading && <p className="text-center text-muted-foreground py-8">No presentations found</p>}
      </div>
    </OperationsLayout>
  );
};

export default OperationsPresentations;
