import { useState, useRef } from "react";
import OperationsLayout from "@/components/operations/OperationsLayout";
import { useOperationsData } from "@/hooks/useOperationsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download, Image, Eye } from "lucide-react";

const mediaTypes = ["Video", "Images", "Newspaper Article", "Other"];

const OperationsMedia = () => {
  const { toast } = useToast();
  const { media, uploadFile, getSignedUrl } = useOperationsData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ media_type: "Video", product_name: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const handleSubmit = async () => {
    if (!form.media_type || !file) {
      toast({ title: "Error", description: "Media type and file are required", variant: "destructive" });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be under 100MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, "media");
      await media.add({ ...form, file_url: fileUrl });
      setDialogOpen(false);
      setForm({ media_type: "Video", product_name: "", description: "" });
      setFile(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handlePreview = async (item: any) => {
    const url = await getSignedUrl(item.file_url);
    if (url) window.open(url, "_blank");
  };

  const handleDownload = async (item: any) => {
    const url = await getSignedUrl(item.file_url);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = item.product_name || item.media_type || "media";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const products = [...new Set(media.data.filter((m: any) => m.product_name).map((m: any) => m.product_name))];

  const filtered = media.data.filter((m: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (m.product_name || "").toLowerCase().includes(q) || (m.description || "").toLowerCase().includes(q);
    const matchesType = !typeFilter || m.media_type === typeFilter;
    const matchesProduct = !productFilter || m.product_name === productFilter;
    return matchesSearch && matchesType && matchesProduct;
  });

  return (
    <OperationsLayout title="Media Manager">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search media..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {mediaTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="">All Products</option>
            {products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Upload Media</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Media</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Media Type *</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.media_type} onChange={(e) => setForm({...form, media_type: e.target.value})}>
                    {mediaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><Label>Product Name</Label><Input value={form.product_name} onChange={(e) => setForm({...form, product_name: e.target.value})} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
                <div><Label>Upload File *</Label><Input type="file" ref={fileRef} onChange={(e) => setFile(e.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground mt-1">Max 100MB, any file type</p></div>
                <Button onClick={handleSubmit} disabled={uploading} className="w-full">{uploading ? "Uploading..." : "Submit"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m: any) => (
            <div key={m.id} className="bg-card border rounded-xl p-4 space-y-2">
              <Image className="h-8 w-8 text-primary/50" />
              <p className="text-xs text-muted-foreground">{m.media_type}</p>
              {m.product_name && <p className="font-medium text-foreground">{m.product_name}</p>}
              {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownload(m)}>
                <Download className="h-3 w-3 mr-1" />Download
              </Button>
            </div>
          ))}
        </div>
        {filtered.length === 0 && !media.loading && <p className="text-center text-muted-foreground py-8">No media found</p>}
      </div>
    </OperationsLayout>
  );
};

export default OperationsMedia;
