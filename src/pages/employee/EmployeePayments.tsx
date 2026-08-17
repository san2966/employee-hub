import { useMemo, useState } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Eye, FileSpreadsheet, FileText, Pencil, Plus, Receipt, Trash2, Wallet } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { uploadPaymentReceipt } from "@/lib/paymentReceipt";
import { MONTHS, YEAR_OPTIONS, monthLabel } from "@/lib/dateFormat";
import {
  PAYMENT_EXPORT_COLUMNS,
  filterPayments,
  paymentExportRows,
  useExpensePayments,
  type ExpensePayment,
} from "@/hooks/useExpensePayments";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentDetailsDialog } from "@/components/payments/PaymentDetailsDialog";
import { KpiCard } from "@/components/dashboard/KpiCard";

const emptyForm = { month: "", year: String(new Date().getFullYear()), sheet_url: "" };

const EmployeePayments = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  const employeeName = session.employeeName || "";

  const { payments, addSheet, updateSheet, deletePayment } = useExpensePayments(employeeId);
  const { toast } = useToast();

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ExpensePayment | null>(null);

  const filtered = useMemo(() => filterPayments(payments, { month, year }), [payments, month, year]);

  const count = (fn: (p: ExpensePayment) => boolean) => payments.filter(fn).length;

  const kpis = [
    { label: "Total Sheets", value: payments.length, sub: "submitted so far", icon: Wallet, tone: "primary" as const },
    { label: "Pending with HR", value: count((p) => (p.hr_status || "Pending") === "Pending"), sub: "awaiting review", icon: Clock, tone: "warning" as const },
    { label: "HR Approved", value: count((p) => p.hr_status === "Approved"), sub: "approved sheets", icon: CheckCircle2, tone: "success" as const },
    { label: "Paid", value: count((p) => p.accounts_status === "Paid"), sub: "settled by accounts", icon: Receipt, tone: "success" as const },
  ];

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: ExpensePayment) => {
    setEditingId(p.id);
    setForm({
      month: p.month ? String(p.month) : "",
      year: p.year ? String(p.year) : String(new Date().getFullYear()),
      sheet_url: p.sheet_url || "",
    });
    setDialogOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = /\.(pdf|xls|xlsx|csv)$/i.test(file.name);
    if (!ok) {
      toast({ variant: "destructive", title: "Invalid file", description: "Upload a PDF or Excel file only" });
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const path = await uploadPaymentReceipt(file, employeeId);
      setForm((f) => ({ ...f, sheet_url: path }));
      toast({ title: "Expense sheet uploaded" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err?.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.month || !form.year || !form.sheet_url) {
      toast({ variant: "destructive", title: "Missing details", description: "Select month, year and upload the expense sheet" });
      return;
    }
    try {
      const payload = {
        employee_id: employeeId,
        employee_name: employeeName,
        month: Number(form.month),
        year: Number(form.year),
        sheet_url: form.sheet_url,
      };
      if (editingId) await updateSheet(editingId, payload);
      else await addSheet(payload);
      toast({ title: editingId ? "Expense sheet updated" : "Expense sheet submitted" });
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

  const exportData = paymentExportRows(filtered);

  return (
    <EmployeeLayout title="Payments">
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        {/* Filters */}
        <Card className="card-corporate">
          <CardContent className="p-4 flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Month</Label>
              <Select value={month || "all"} onValueChange={(v) => setMonth(v === "all" ? "" : v)}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All Months" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Year</Label>
              <Select value={year || "all"} onValueChange={(v) => setYear(v === "all" ? "" : v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {YEAR_OPTIONS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" className="gap-2" disabled={!filtered.length}
                onClick={() => exportToCSV({ portal: "Employee", type: "Payments", columns: PAYMENT_EXPORT_COLUMNS, data: exportData })}>
                <FileSpreadsheet className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" disabled={!filtered.length}
                onClick={() => exportToPDF({ portal: "Employee", type: "Payments", columns: PAYMENT_EXPORT_COLUMNS, data: exportData })}>
                <FileText className="h-4 w-4" /> Export PDF
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
                <p className="font-medium">No expense sheets</p>
                <p className="text-sm mt-1">Click Add to upload your monthly expense sheet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Month</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>HR Status</TableHead>
                    <TableHead>Accounts Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setPreview(p)}>
                      <TableCell className="font-medium">{monthLabel(p.month)}</TableCell>
                      <TableCell>{p.year ?? "-"}</TableCell>
                      <TableCell>{p.sheet_url || p.receipt_url ? "Attached" : "-"}</TableCell>
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
            <DialogTitle>{editingId ? "Modify Expense Sheet" : "Add Expense Sheet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Month *</Label>
                <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}>
                  <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year *</Label>
                <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Upload Expense Sheet * (PDF or Excel)</Label>
              <Input type="file" accept=".pdf,.xls,.xlsx,.csv" onChange={handleUpload} />
              {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
              {form.sheet_url && !uploading && <p className="text-xs text-success mt-1">File attached</p>}
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={uploading}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentDetailsDialog payment={preview} onOpenChange={(o) => !o && setPreview(null)} />
    </EmployeeLayout>
  );
};

export default EmployeePayments;
