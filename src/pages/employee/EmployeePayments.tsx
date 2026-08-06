import { useMemo, useState } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Eye, FileSpreadsheet, FileText, Pencil, Plus, Trash2, Receipt } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { uploadPaymentReceipt } from "@/lib/paymentReceipt";
import {
  EXPENSE_TYPES,
  PAYMENT_EXPORT_COLUMNS,
  filterPayments,
  useExpensePayments,
  type ExpensePayment,
} from "@/hooks/useExpensePayments";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentDetailsDialog } from "@/components/payments/PaymentDetailsDialog";

const emptyForm = {
  expense_type: "",
  date: "",
  amount: "",
  purpose: "",
  from_location: "",
  to_location: "",
  payment_mode: "Cash",
  receipt_url: "",
};

const EmployeePayments = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  const employeeName = session.employeeName || "";

  const { payments, addPayment, updatePayment, deletePayment } = useExpensePayments(employeeId);
  const { toast } = useToast();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState<ExpensePayment | null>(null);

  const filtered = useMemo(() => filterPayments(payments, { from, to }), [payments, from, to]);

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthly = payments.filter((p) => p.date.startsWith(monthKey));
  const sum = (rows: ExpensePayment[]) => rows.reduce((t, r) => t + r.amount, 0);

  const summary = [
    { label: "This Month", value: `₹${sum(monthly).toLocaleString("en-IN")}`, sub: `${monthly.length} records` },
    { label: "Filtered Total", value: `₹${sum(filtered).toLocaleString("en-IN")}`, sub: `${filtered.length} records` },
    { label: "HR Approved", value: filtered.filter((p) => p.hr_status === "Approved").length, sub: "records" },
    { label: "Paid", value: filtered.filter((p) => p.accounts_status === "Paid").length, sub: "records" },
  ];

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: ExpensePayment) => {
    setEditingId(p.id);
    setForm({
      expense_type: p.expense_type || "Other",
      date: p.date,
      amount: String(p.amount),
      purpose: p.purpose || p.description || "",
      from_location: p.from_location || "",
      to_location: p.to_location || "",
      payment_mode: p.payment_mode || "Cash",
      receipt_url: p.receipt_url || "",
    });
    setDialogOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await uploadPaymentReceipt(file, employeeId);
      setForm((f) => ({ ...f, receipt_url: path }));
      toast({ title: "Receipt uploaded" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err?.message });
    }
  };

  const handleSubmit = async () => {
    if (!form.expense_type || !form.date || !form.amount || !form.purpose) {
      toast({ variant: "destructive", title: "Missing details", description: "Please fill all required fields" });
      return;
    }
    if (form.payment_mode === "Online" && !form.receipt_url) {
      toast({ variant: "destructive", title: "Receipt required", description: "Upload a receipt for online payments" });
      return;
    }
    try {
      const payload = {
        employee_id: employeeId,
        employee_name: employeeName,
        date: form.date,
        amount: parseFloat(form.amount),
        expense_type: form.expense_type,
        purpose: form.purpose,
        from_location: form.expense_type === "Travel" ? form.from_location : null,
        to_location: form.expense_type === "Travel" ? form.to_location : null,
        payment_mode: form.payment_mode,
        receipt_url: form.receipt_url || null,
      };
      if (editingId) await updatePayment(editingId, payload);
      else await addPayment(payload);
      toast({ title: editingId ? "Record updated" : "Record added" });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save failed", description: err?.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePayment(id);
      toast({ title: "Record deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete failed", description: err?.message });
    }
  };

  const exportData = filtered.map((p) => ({ ...p, employee_name: p.employee_name || employeeName }));

  return (
    <EmployeeLayout title="Payments">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.map((s) => (
            <Card key={s.label} className="card-corporate">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="card-corporate">
          <CardContent className="p-4 flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">From Date</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">To Date</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="icon" title="Export to PDF" disabled={!filtered.length}
                onClick={() => exportToPDF({ portal: "Employee", type: "Payments", columns: PAYMENT_EXPORT_COLUMNS, data: exportData, dateRange: { from, to } })}>
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Export to Excel" disabled={!filtered.length}
                onClick={() => exportToCSV({ portal: "Employee", type: "Payments", columns: PAYMENT_EXPORT_COLUMNS, data: exportData })}>
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="card-corporate">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No payment records</p>
                <p className="text-sm mt-1">Click Add to submit an expense</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Expense Type</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>HR Status</TableHead>
                    <TableHead>Accounts Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setPreview(p)}>
                      <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                      <TableCell>{p.expense_type || "Other"}</TableCell>
                      <TableCell className="font-semibold">₹{p.amount.toLocaleString("en-IN")}</TableCell>
                      <TableCell>{p.receipt_url ? "Attached" : "-"}</TableCell>
                      <TableCell><PaymentStatusBadge status={p.hr_status} /></TableCell>
                      <TableCell><PaymentStatusBadge status={p.accounts_status} /></TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Preview" onClick={() => setPreview(p)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Modify" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add / Modify dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modify Payment" : "Add Payment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Expense Type *</Label>
              <Select value={form.expense_type} onValueChange={(v) => setForm({ ...form, expense_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select expense type" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Amount (₹) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Purpose of Payment *</Label>
              <Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </div>
            {form.expense_type === "Travel" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From</Label>
                  <Input value={form.from_location} onChange={(e) => setForm({ ...form, from_location: e.target.value })} />
                </div>
                <div>
                  <Label>To</Label>
                  <Input value={form.to_location} onChange={(e) => setForm({ ...form, to_location: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <Label>Payment Mode *</Label>
              <RadioGroup
                value={form.payment_mode}
                onValueChange={(v) => setForm({ ...form, payment_mode: v })}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Cash" id="mode-cash" />
                  <Label htmlFor="mode-cash" className="font-normal">Cash</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Online" id="mode-online" />
                  <Label htmlFor="mode-online" className="font-normal">Online</Label>
                </div>
              </RadioGroup>
            </div>
            {form.payment_mode === "Online" && (
              <div>
                <Label>Upload a Receipt *</Label>
                <Input type="file" accept="image/*,.pdf" onChange={handleUpload} />
                {form.receipt_url && <p className="text-xs text-success mt-1">Receipt attached</p>}
              </div>
            )}
            <Button className="w-full" onClick={handleSubmit}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentDetailsDialog payment={preview} onOpenChange={(o) => !o && setPreview(null)} />
    </EmployeeLayout>
  );
};

export default EmployeePayments;