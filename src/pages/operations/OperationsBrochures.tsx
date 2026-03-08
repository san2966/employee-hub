import { useState, useRef } from "react";
import OperationsLayout from "@/components/operations/OperationsLayout";
import { useOperationsData } from "@/hooks/useOperationsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download, BookOpen } from "lucide-react";

const OperationsBrochures = () => {
  const { toast } = useToast();
  const { brochures, uploadFile, getSignedUrl } = useOperationsData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_name: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const handleSubmit = async () => {
    if (!form.product_name || !file) {
      toast({ title: "Error", description: "Product name and file are required", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be under 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, "brochures");
      await brochures.add({ ...form, file_url: fileUrl });
      setDialogOpen(false);
      setForm({ product_name: "", description: "" });
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

  const filtered = brochures.data.filter((b: any) => !search || b.product_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <OperationsLayout title="Brochure Management">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search brochures..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Upload Brochure</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Brochure</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Product Name *</Label><Input value={form.product_name} onChange={(e) => setForm({...form, product_name: e.target.value})} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
                <div><Label>Upload File *</Label><Input type="file" ref={fileRef} onChange={(e) => setFile(e.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground mt-1">Max 10MB</p></div>
                <Button onClick={handleSubmit} disabled={uploading} className="w-full">{uploading ? "Uploading..." : "Submit"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b: any) => (
            <div key={b.id} className="bg-card border rounded-xl p-4 space-y-2">
              <BookOpen className="h-8 w-8 text-primary/50" />
              <p className="font-medium text-foreground">{b.product_name}</p>
              {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownload(b)}>
                <Download className="h-3 w-3 mr-1" />Download
              </Button>
            </div>
          ))}
        </div>
        {filtered.length === 0 && !brochures.loading && <p className="text-center text-muted-foreground py-8">No brochures found</p>}
      </div>
    </OperationsLayout>
  );
};

export default OperationsBrochures;
