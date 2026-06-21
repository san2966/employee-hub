import { useState, useEffect } from "react";
import PurchaseLayout from "@/components/purchase/PurchaseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Download } from "lucide-react";
import { usePurchaseQuotes, useUploadFile } from "@/hooks/usePurchaseData";
import { supabase } from "@/integrations/supabase/client";

const quoteTypes = ["L1", "L2", "L3", "L4", "L5", "L6", "Proposal Commercials", "Other"];

const PurchaseQuotationManager = () => {
  const { data: quotes, add, loading, fetch: refetch } = usePurchaseQuotes();
  const { upload } = useUploadFile();
  const [addOpen, setAddOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({ quote_id: "", subject: "", type: "" });
  const [file, setFile] = useState<File | null>(null);

  // Realtime subscription for quote updates
  useEffect(() => {
    const channel = supabase.channel("purchase_quotes_realtime").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "purchase_quotes" },
      () => { refetch(); }
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const handleAdd = async () => {
    if (!form.quote_id.trim() || !form.subject.trim() || !form.type) return;
    let file_url = null;
    if (file) {
      file_url = await upload(file, "quotes", 10);
      if (!file_url) return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    await add({ ...form, file_url, created_by: user?.id });
    setForm({ quote_id: "", subject: "", type: "" });
    setFile(null);
    setAddOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (String(status || "pending").toLowerCase()) {
      case "accepted":
      case "approved": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <PurchaseLayout title="Quotation Manager">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quotations</span>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Quote</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Submit Quotation</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Quote ID</Label><Input value={form.quote_id} onChange={e => setForm(p => ({ ...p, quote_id: e.target.value }))} placeholder="e.g. QT-001" /></div>
                  <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Subject" /></div>
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>{quoteTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Upload Quote (Image/PPT)</Label>
                    <Input type="file" accept="image/*,.ppt,.pptx" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </div>
                  <Button onClick={handleAdd} className="w-full">Submit</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No quotations yet</TableCell></TableRow>
                ) : quotes.map((q: any) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.quote_id}</TableCell>
                    <TableCell>{q.subject}</TableCell>
                    <TableCell>{q.type}</TableCell>
                    <TableCell className="max-w-48 truncate">{q.description || "-"}</TableCell>
                    <TableCell><Badge variant={getStatusColor(q.status) as any}>{q.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {q.file_url && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => setPreviewUrl(q.file_url)}><Eye className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" asChild><a href={q.file_url} download><Download className="h-4 w-4" /></a></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Quote Preview</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} alt="Quote" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </PurchaseLayout>
  );
};

export default PurchaseQuotationManager;
