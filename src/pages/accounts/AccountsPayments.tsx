import { useMemo, useState } from "react";
import AccountsLayout from "@/components/accounts/AccountsLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { BadgeIndianRupee, Clock, Eye, FileSpreadsheet, FileText, PauseCircle, Receipt } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
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

const AccountsPayments = () => {
  const { payments, setAccountsStatus } = useExpensePayments();
  const { toast } = useToast();

  const [employee, setEmployee] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<ExpensePayment | null>(null);

  const employees = useMemo(
    () => [...new Set(payments.map((p) => p.display_name).filter(Boolean) as string[])].sort(),
    [payments]
  );

  const filtered = useMemo(
    () => filterPayments(payments, { employeeName: employee || undefined, month, year }),
    [payments, employee, month, year]
  );

  const count = (fn: (p: ExpensePayment) => boolean) => filtered.filter(fn).length;

  const kpis = [
    { label: "Total Sheets", value: filtered.length, sub: "in current filter", icon: Receipt, tone: "primary" as const },
    { label: "Ready to Pay", value: count((p) => p.hr_status === "Approved" && (p.accounts_status || "Pending") === "Pending"), sub: "HR approved", icon: Clock, tone: "warning" as const },
    { label: "Paid", value: count((p) => p.accounts_status === "Paid"), sub: "settled", icon: BadgeIndianRupee, tone: "success" as const },
    { label: "On Hold", value: count((p) => p.accounts_status === "On Hold"), sub: "kept on hold", icon: PauseCircle, tone: "destructive" as const },
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

  const exportData = paymentExportRows(filtered);

  return (
    <AccountsLayout title="Payments">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
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
                onClick={() => exportToCSV({ portal: "Accounts", type: "Payments", columns: PAYMENT_EXPORT_COLUMNS, data: exportData })}>
                <FileSpreadsheet className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" disabled={!filtered.length}
                onClick={() => exportToPDF({ portal: "Accounts", type: "Payments", columns: PAYMENT_EXPORT_COLUMNS, data: exportData })}>
                <FileText className="h-4 w-4" /> Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {selected.length > 0 && (
          <Card className="card-corporate">
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">{selected.length} selected</span>
              <Button size="sm" onClick={() => applyStatus(selected, "Paid")}>Paid</Button>
              <Button size="sm" variant="outline" onClick={() => applyStatus(selected, "On Hold")}>Hold</Button>
            </CardContent>
          </Card>
        )}

        <Card className="card-corporate">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No expense sheets found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox checked={allChecked} onCheckedChange={(c) => setSelected(c ? filtered.map((p) => p.id) : [])} />
                    </TableHead>
                    <TableHead>Employee Name</TableHead>
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{p.display_name || "-"}</TableCell>
                      <TableCell>{monthLabel(p.month)}</TableCell>
                      <TableCell>{p.year ?? "-"}</TableCell>
                      <TableCell>{p.sheet_url || p.receipt_url ? "Attached" : "-"}</TableCell>
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
                          <Button variant="ghost" size="icon" title="Hold" onClick={() => applyStatus([p.id], "On Hold")}>
                            <PauseCircle className="h-4 w-4 text-warning" />
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
