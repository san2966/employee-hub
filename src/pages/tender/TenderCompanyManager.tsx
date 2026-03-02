import { useState } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTenderCompanies, uploadTenderFile } from "@/hooks/useTenderData";
import { Building2, Plus } from "lucide-react";

const TenderCompanyManager = () => {
  const { data: companies, add } = useTenderCompanies();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", director_name: "", address: "", gst_number: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.director_name.trim() || !form.address.trim() || !form.gst_number.trim()) return;
    setSubmitting(true);
    let logo_url = null;
    if (logoFile) logo_url = await uploadTenderFile(logoFile, "logos");
    await add({ ...form, logo_url } as any);
    setForm({ name: "", director_name: "", address: "", gst_number: "" });
    setLogoFile(null);
    setOpen(false);
    setSubmitting(false);
  };

  return (
    <TenderLayout title="Company Manager">
      <div className="flex justify-end mb-6">
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Company</Button>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No companies added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">Director: {c.director_name}</p>
                    <p className="text-xs text-muted-foreground truncate">GST: {c.gst_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Company</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Director Name *</Label><Input value={form.director_name} onChange={e => setForm({ ...form, director_name: e.target.value })} /></div>
            <div><Label>Address *</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>GST *</Label><Input value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value })} /></div>
            <div><Label>Upload Company Logo</Label><Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} /></div>
            <Button onClick={handleSubmit} className="w-full" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TenderLayout>
  );
};

export default TenderCompanyManager;
