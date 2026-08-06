import { useMemo, useState } from "react";
import AccountsLayout from "@/components/accounts/AccountsLayout";
import { useAccountsData } from "@/hooks/useAccountsData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, Receipt, Search, X } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { EXPORT_COLUMNS } from "@/lib/exportUtils";
import { openPaymentReceipt } from "@/lib/paymentReceipt";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, i) => ({ value: String(i + 1), label }));

const Vouchers = () => {
  const { vouchers, getAvailableYears } = useAccountsData();

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");

  const years = getAvailableYears();

  // Only vouchers created from the Admin portal
  const adminVouchers = useMemo(() => vouchers.filter((v) => v.source === "admin"), [vouchers]);

  const filtered = useMemo(() => {
    return adminVouchers.filter((v) => {
      const d = new Date(v.date);
      if (year && d.getFullYear() !== parseInt(year)) return false;
      if (month && d.getMonth() + 1 !== parseInt(month)) return false;
      if (search && !`${v.employeeName} ${v.purpose || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [adminVouchers, search, year, month]);

  const total = filtered.reduce((sum, v) => sum + (v.amount || 0), 0);

  const clearFilters = () => {
    setSearch("");
    setYear("");
    setMonth("");
  };

  return (
    <AccountsLayout title="Vouchers">
      <div className="space-y-6">
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Vouchers</h2>
          <p className="opacity-90">Voucher records submitted from the Admin portal</p>
        </div>

        <div className="card-corporate p-6 space-y-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm text-muted-foreground mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or purpose..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-32">
              <Label className="text-sm text-muted-foreground mb-2 block">Year</Label>
              <Select value={year || "all"} onValueChange={(v) => setYear(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Label className="text-sm text-muted-foreground mb-2 block">Month</Label>
              <Select value={month || "all"} onValueChange={(v) => setMonth(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All Months" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>

            <ExportButtons
              portal="Accounts"
              type="Vouchers"
              columns={EXPORT_COLUMNS.vouchers}
              data={filtered}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No voucher records found</p>
              <p className="text-sm mt-1">Records appear when the Admin portal adds payments</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Paid To</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((voucher) => (
                      <TableRow key={voucher.id}>
                        <TableCell className="font-medium">{voucher.employeeName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{voucher.purpose || "-"}</TableCell>
                        <TableCell className="text-success font-semibold">
                          ₹{voucher.amount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>{new Date(voucher.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {voucher.receiptUrl ? (
                            <button
                              type="button"
                              onClick={() => openPaymentReceipt(voucher.receiptUrl!)}
                              className="text-primary hover:underline flex items-center gap-1 text-sm"
                            >
                              <Download className="h-3.5 w-3.5" /> View
                            </button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end text-sm">
                <span className="font-semibold">
                  Total: ₹{total.toLocaleString("en-IN")} ({filtered.length} records)
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </AccountsLayout>
  );
};

export default Vouchers;
