import { useState } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { useTenderPayments, TenderPayment, PAYMENT_TYPES, EMD_TYPES, COMPANY_NAMES } from "@/hooks/useTenderPayments";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Download, Search, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TenderPaymentManager = () => {
  const { payments, loading, addPayment, getProofUrl } = useTenderPayments();
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<TenderPayment | null>(null);

  // Add form state
  const [formType, setFormType] = useState("");
  const [formTender, setFormTender] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formEmdType, setFormEmdType] = useState("");
  const [formReturnDate, setFormReturnDate] = useState("");
  const [formRemark, setFormRemark] = useState("");
  const [formReason, setFormReason] = useState("");

  const resetAddForm = () => {
    setFormType(""); setFormTender(""); setFormOrg(""); setFormAmount("");
    setFormCompany(""); setFormEmdType(""); setFormReturnDate("");
    setFormRemark(""); setFormReason(""); setAddStep(1);
  };

  const handleAdd = async () => {
    if (!formTender || !formOrg || !formAmount) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }
    const record: any = {
      type: formType,
      tender_number: formTender.trim(),
      organization_name: formOrg.trim(),
      amount: parseFloat(formAmount),
    };
    if (formType === "EMD") {
      record.company_name = formCompany;
      record.emd_type = formEmdType;
    }
    if (formType === "Demand Draft" || formType === "Bank Guarantee") {
      record.return_date = formReturnDate || null;
    }
    if (formType === "Govt Portal") {
      record.remark = formRemark || null;
      record.reason_for_payment = formReason || null;
    }
    const ok = await addPayment(record);
    if (ok) { setAddOpen(false); resetAddForm(); }
  };

  const handleDownload = async (proofUrl: string) => {
    const url = await getProofUrl(proofUrl);
    if (url) window.open(url, "_blank");
  };

  const filtered = payments.filter(p =>
    p.tender_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TenderLayout title="Tender Payment Manager">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tender# or organization..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => { resetAddForm(); setAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Record
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Total Records</div>
            <div className="text-2xl font-bold text-foreground">{payments.length}</div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{payments.filter(p => !p.paid).length}</div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Paid</div>
            <div className="text-2xl font-bold text-green-600">{payments.filter(p => p.paid).length}</div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-bold text-foreground">₹{payments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString("en-IN")}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No records found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Tender Number</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                      <TableCell className="font-medium">{p.tender_number}</TableCell>
                      <TableCell>{p.organization_name}</TableCell>
                      <TableCell>₹{Number(p.amount).toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        {p.paid ? (
                          <Badge className="bg-green-100 text-green-700 border-0">✅ Paid</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 border-0">⏳ Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setPreviewRecord(p); setPreviewOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {p.paid && p.proof_url && (
                            <Button size="sm" variant="outline" onClick={() => handleDownload(p.proof_url!)}>
                              <Download className="h-4 w-4 mr-1" /> Proof
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Add Record Dialog */}
        <Dialog open={addOpen} onOpenChange={o => { if (!o) { setAddOpen(false); resetAddForm(); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{addStep === 1 ? "Select Payment Type" : `Add ${formType} Record`}</DialogTitle>
            </DialogHeader>
            {addStep === 1 ? (
              <div className="space-y-3">
                <Label>Payment Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button disabled={!formType} onClick={() => setAddStep(2)}>Next</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Tender Number *</Label>
                  <Input value={formTender} onChange={e => setFormTender(e.target.value)} placeholder="TEND/2026/001" />
                </div>
                <div>
                  <Label>Organization Name *</Label>
                  <Input value={formOrg} onChange={e => setFormOrg(e.target.value)} />
                </div>
                <div>
                  <Label>Amount (₹) *</Label>
                  <Input type="number" min={1} max={10000000} value={formAmount} onChange={e => setFormAmount(e.target.value)} />
                </div>
                {formType === "EMD" && (
                  <>
                    <div>
                      <Label>Company Name</Label>
                      <Select value={formCompany} onValueChange={setFormCompany}>
                        <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
                        <SelectContent>
                          {COMPANY_NAMES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>EMD Type</Label>
                      <Select value={formEmdType} onValueChange={setFormEmdType}>
                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                        <SelectContent>
                          {EMD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {(formType === "Demand Draft" || formType === "Bank Guarantee") && (
                  <div>
                    <Label>Return Date</Label>
                    <Input type="date" value={formReturnDate} onChange={e => setFormReturnDate(e.target.value)} />
                  </div>
                )}
                {formType === "Govt Portal" && (
                  <>
                    <div>
                      <Label>Remark</Label>
                      <Textarea value={formRemark} onChange={e => setFormRemark(e.target.value)} />
                    </div>
                    <div>
                      <Label>Reason for Payment</Label>
                      <Textarea value={formReason} onChange={e => setFormReason(e.target.value)} />
                    </div>
                  </>
                )}
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setAddStep(1)}>Back</Button>
                  <Button onClick={handleAdd}>Save</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
            </DialogHeader>
            {previewRecord && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Type:</span> {previewRecord.type}</div>
                  <div><span className="text-muted-foreground">Tender#:</span> {previewRecord.tender_number}</div>
                  <div><span className="text-muted-foreground">Organization:</span> {previewRecord.organization_name}</div>
                  <div><span className="text-muted-foreground">Amount:</span> ₹{Number(previewRecord.amount).toLocaleString("en-IN")}</div>
                  {previewRecord.company_name && <div><span className="text-muted-foreground">Company:</span> {previewRecord.company_name}</div>}
                  {previewRecord.emd_type && <div><span className="text-muted-foreground">EMD Type:</span> {previewRecord.emd_type}</div>}
                  {previewRecord.return_date && <div><span className="text-muted-foreground">Return Date:</span> {previewRecord.return_date}</div>}
                  {previewRecord.remark && <div className="col-span-2"><span className="text-muted-foreground">Remark:</span> {previewRecord.remark}</div>}
                  {previewRecord.reason_for_payment && <div className="col-span-2"><span className="text-muted-foreground">Reason:</span> {previewRecord.reason_for_payment}</div>}
                  <div><span className="text-muted-foreground">Status:</span> {previewRecord.paid ? "✅ Paid" : "⏳ Pending"}</div>
                  {previewRecord.bank_name && <div><span className="text-muted-foreground">Bank:</span> {previewRecord.bank_name}</div>}
                  {previewRecord.payment_date && <div><span className="text-muted-foreground">Payment Date:</span> {previewRecord.payment_date}</div>}
                </div>
                {previewRecord.paid && previewRecord.proof_url && (
                  <Button variant="outline" className="w-full" onClick={() => handleDownload(previewRecord.proof_url!)}>
                    <Download className="h-4 w-4 mr-2" /> Download Proof
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TenderLayout>
  );
};

export default TenderPaymentManager;
