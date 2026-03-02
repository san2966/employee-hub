import { useState } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTenderDocuments, uploadTenderFile } from "@/hooks/useTenderData";
import { FileText, Plus, CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import Papa from "papaparse";

const TenderDocuments = () => {
  const { data: documents, add } = useTenderDocuments();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bid_number: "", organization: "", product: "", description: "" });
  const [bidDate, setBidDate] = useState<Date | undefined>();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orgFilter, setOrgFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const uniqueOrgs = [...new Set(documents.map((d: any) => d.organization))];
  const uniqueProducts = [...new Set(documents.map((d: any) => d.product))];

  const filtered = documents.filter((d: any) => {
    if (orgFilter && d.organization !== orgFilter) return false;
    if (productFilter && d.product !== productFilter) return false;
    return true;
  });

  const handleSubmit = async () => {
    if (!form.bid_number.trim() || !bidDate || !form.organization.trim() || !form.product.trim() || !form.description.trim()) return;
    if (pdfFile && pdfFile.size > 20 * 1024 * 1024) { alert("PDF must be less than 20MB"); return; }
    setSubmitting(true);
    let pdf_url = null;
    if (pdfFile) pdf_url = await uploadTenderFile(pdfFile, "documents");
    await add({ ...form, bid_date: format(bidDate, "yyyy-MM-dd"), pdf_url } as any);
    setForm({ bid_number: "", organization: "", product: "", description: "" });
    setBidDate(undefined); setPdfFile(null); setOpen(false); setSubmitting(false);
  };

  const exportCSV = () => {
    const csv = Papa.unparse(filtered.map((d: any) => ({
      "Bid No.": d.bid_number, Date: d.bid_date, Organization: d.organization,
      Product: d.product, Description: d.description,
    })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Emp_Tender_Documents_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <TenderLayout title="Documents Manager">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <div className="flex gap-2 flex-wrap">
          <Select value={orgFilter} onValueChange={v => setOrgFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter by Organization" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {uniqueOrgs.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={v => setProductFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter by Product" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {uniqueProducts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Register Bid</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No bids registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d: any) => (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm truncate">Bid #{d.bid_number}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{d.bid_date}</p>
                <p className="text-sm"><span className="font-medium">Org:</span> {d.organization}</p>
                <p className="text-sm"><span className="font-medium">Product:</span> {d.product}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{d.description}</p>
                {d.pdf_url && <a href={d.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View PDF</a>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register Bid</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div><Label>Bid No. *</Label><Input value={form.bid_number} onChange={e => setForm({ ...form, bid_number: e.target.value })} /></div>
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{bidDate ? format(bidDate, "PPP") : "Pick a date"}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={bidDate} onSelect={setBidDate} /></PopoverContent>
              </Popover>
            </div>
            <div><Label>Organization Name *</Label><Input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} /></div>
            <div><Label>Product Name *</Label><Input value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} /></div>
            <div><Label>Bid Description *</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Upload Documents (PDF, max 20MB)</Label><Input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} /></div>
            <Button onClick={handleSubmit} className="w-full" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TenderLayout>
  );
};

export default TenderDocuments;
