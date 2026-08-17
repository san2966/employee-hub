import { useState, useEffect } from "react";
import AccountsLayout from "@/components/accounts/AccountsLayout";
import { useAccountsData } from "@/hooks/useAccountsData";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { FileText, DollarSign, Receipt, TrendingUp, RefreshCcw, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dateFormat";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const AccountsDashboard = () => {
  const { vouchers, travelExpenses, refresh, getTotalVoucherAmount, getTotalTravelAmount } = useAccountsData();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const allRecords = [...vouchers, ...travelExpenses.map(t => ({
    ...t,
    type: "travel" as const,
    receiptUrl: t.receiptUrl,
    purpose: `${t.from} → ${t.to}`,
  }))].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalPages = Math.ceil(allRecords.length / itemsPerPage);
  const paginatedRecords = allRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalVoucherAmount = getTotalVoucherAmount(vouchers);
  const totalTravelAmount = getTotalTravelAmount(travelExpenses);
  const totalAmount = totalVoucherAmount + totalTravelAmount;

  const monthlyTrend = (() => {
    const map: Record<string, number> = {};
    allRecords.forEach((r: any) => {
      const key = (r.date || "").slice(0, 7);
      if (key) map[key] = (map[key] || 0) + (r.amount || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));
  })();

  const splitData = [
    { name: "Vouchers", value: totalVoucherAmount },
    { name: "Travel", value: totalTravelAmount },
  ].filter(d => d.value > 0);
  const pieColors = ["hsl(var(--primary))", "hsl(var(--warning))"];

  return (
    <AccountsLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Payment Records</h2>
            <p className="opacity-90">View all employee payment submissions in real-time</p>
          </div>
          <Button variant="secondary" onClick={refresh} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Records" value={allRecords.length} icon={Receipt} tone="primary" />
          <KpiCard label="Total Amount" value={`₹${totalAmount.toLocaleString()}`} icon={DollarSign} tone="success" />
          <KpiCard label="Vouchers" value={`₹${totalVoucherAmount.toLocaleString()}`} icon={FileText} tone="warning" sub={`${vouchers.length} entries`} />
          <KpiCard label="Travel Expenses" value={`₹${totalTravelAmount.toLocaleString()}`} icon={Plane} tone="muted" sub={`${travelExpenses.length} entries`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="card-corporate lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Monthly Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card className="card-corporate">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Expense Split</CardTitle>
            </CardHeader>
            <CardContent>
              {splitData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={splitData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {splitData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Records Table */}
        <div className="card-corporate p-6">
          <h3 className="text-lg font-semibold mb-4">All Payment Records</h3>
          
          {allRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment records yet</p>
              <p className="text-sm mt-1">Records will appear when employees submit payments</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.employeeName}</TableCell>
                        <TableCell className="text-success font-semibold">
                          ₹{(record.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.type === "travel" 
                              ? "bg-info/10 text-info" 
                              : record.source === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-warning/10 text-warning"
                          }`}>
                            {record.type === "travel" ? "Travel" : record.source === "admin" ? "Admin" : "Voucher"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.purpose || "-"}
                        </TableCell>
                        <TableCell>
                          {record.receiptUrl ? (
                            <a 
                              href={record.receiptUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              View
                            </a>
                          ) : (
                            <span className="text-muted-foreground">No receipt</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AccountsLayout>
  );
};

export default AccountsDashboard;
