import { useState } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTenderProducts, uploadTenderFile } from "@/hooks/useTenderData";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";

const TenderProductManager = () => {
  const { data: products, add, update, remove } = useTenderProducts();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", model: "", manufacturer: "", specification: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [atcFile, setAtcFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => { setEditId(null); setForm({ name: "", model: "", manufacturer: "", specification: "" }); setImageFile(null); setAtcFile(null); setOpen(true); };
  const openEdit = (p: any) => { setEditId(p.id); setForm({ name: p.name, model: p.model, manufacturer: p.manufacturer, specification: p.specification || "" }); setOpen(true); };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.model.trim() || !form.manufacturer.trim()) return;
    setSubmitting(true);
    let image_url = undefined as string | undefined;
    let atc_url = undefined as string | undefined;
    if (imageFile) image_url = (await uploadTenderFile(imageFile, "product-images")) || undefined;
    if (atcFile) atc_url = (await uploadTenderFile(atcFile, "atc")) || undefined;
    const data: any = { ...form };
    if (image_url) data.image_url = image_url;
    if (atc_url) data.atc_url = atc_url;
    if (editId) await update(editId, data);
    else await add(data);
    setOpen(false); setSubmitting(false);
  };

  return (
    <TenderLayout title="Product Manager">
      <div className="flex justify-end mb-6">
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No products added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-2">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover rounded-lg" />}
                <h3 className="font-semibold text-sm">{p.name}</h3>
                <p className="text-xs text-muted-foreground">Model: {p.model}</p>
                <p className="text-xs text-muted-foreground">Mfr: {p.manufacturer}</p>
                {p.specification && <p className="text-xs text-muted-foreground line-clamp-2">{p.specification}</p>}
                {p.atc_url && <a href={p.atc_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View ATC</a>}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div><Label>Product Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Model *</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
            <div><Label>Manufacturer *</Label><Input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} /></div>
            <div><Label>Upload Image (Optional)</Label><Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} /></div>
            <div><Label>Specification (Optional)</Label><Textarea value={form.specification} onChange={e => setForm({ ...form, specification: e.target.value })} /></div>
            <div><Label>Upload ATC</Label><Input type="file" onChange={e => setAtcFile(e.target.files?.[0] || null)} /></div>
            <Button onClick={handleSubmit} className="w-full" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TenderLayout>
  );
};

export default TenderProductManager;
