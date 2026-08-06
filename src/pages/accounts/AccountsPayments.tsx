import { useMemo, useState } from "react";
import AccountsLayout from "@/components/accounts/AccountsLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { BadgeIndianRupee, Eye, FileSpreadsheet, FileText, Receipt } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { PAYMENT_EXPORT_COLUMNS, filterPayments, useExpensePayments, type ExpensePayment } from "@/hooks/useExpensePayments";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentDetailsDialog } from "@/components/payments/PaymentDetailsDialog";

const AccountsPayments = () => {
  const { payments, setAccountsStatus } = useExpensePayments();
  const { toast } = useToast();

  const [employee, setEmployee] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<ExpensePayment | null>(null);

  const employees = useMemo(
    () => [...new Set(payments.map((p) => p.employee_name).filter(Boolean) as string[])].sort(),
    [payments]
  );

  const filtered = useMemo(
    () => filterPayments(payments, { employeeName: employee || undefined, from, to }),
    [payments, employee, from, to]
  );

  const total = filtered.reduce((t, r) => t + r.amount, 0);
  const paidTotal = filtered.filter((p) => p.accounts_status === "Paid").reduce((t, r) => t + r.amount, 0);
  const summary = [
    { label: "Total Amount", value: `₹${total.toLocaleString("en-IN")}`, sub: `${filtered.length} records` },
    { label: "Paid", value: `₹${paidTotal.toLocaleString("en-IN")}`, sub: `${filtered.filter((p) => p.accounts_status === "Paid").length} records` },
    { label: "Pending", value: filtered.filter((p) => (p.accounts_status || "Pending") === "Pending").length, sub: "records" },
    { label: "On Hold", value: filtered.filter((p) => p.accounts_status === "Hold").length, sub: "records" },
  ];

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allChecked = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));

  const applyStatus = async (ids: string[], status: string) => {
    try {
      await setAccountsStatus(ids, status);
      setSelected([]);
      toast({ title: `Marked as ${status}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err?.message });
    }
  };

  return (
    <AccountsLayout title="Payments">
      <div className="space-y-6">
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

        <Card className="card-corporate">
          <CardContent className="p-4 flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Employee Name</Label>
              <Select value={employee || "all"} onValueChange={(v) => setEmployee(v === "all" ? "" : v)}>
                <SelectTrigger className="w-56"><SelectValue placeholder="All Employees" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">From Date</Label>
              <Input type="date" className="w-44" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">To Date</Label>
              <Input type="date" className="w-44" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="icon" title="Export to PDF" disabled={!filtered.length}
                onClick={() => exportToPDF({ portal: "Accounts", type: "Payments", columns: PAYMENT_EXPORT_COLUMNS, data: filtered, dateRange: { from, to } })}>
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Export to Excel" disabled={!filtered.length}
                onClick={() => exportToCSV({ portal: "Accounts", type: "Payments", columns: PAYMENT_EXPORT_COLUMNS, data: filtered })}>
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {selected.length > 0 && (
          <Card className="card-corporate">
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">{selected.length} selected</span>
              <Button size="sm" onClick={() => applyStatus(selected, "Paid")}>Paid</Button>
              <Button size="sm" variant="outline" onClick={() => applyStatus(selected, "Hold")}>Hold</Button>
            </CardContent>
          </Card>
        )}

        <Card className="card-corporate">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No payment records found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox checked={allChecked} onCheckedChange={(c) => setSelected(c ? filtered.map((p) => p.id) : [])} />
                    </TableHead>
                    <TableHead>Employee Name</TableHead>
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{p.employee_name || "-"}</TableCell>
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
                          <Button variant="ghost" size="icon" title="Mark Paid" onClick={() => applyStatus([p.id], "Paid")}>
                            <BadgeIndianRupee className="h-4 w-4 text-success" />
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

      <PaymentDetailsDialog payment={preview} onOpenChange={(o) => !o && setPreview(null)} />
    </AccountsLayout>
  );
};

export default AccountsPayments;