import { useEffect } from "react";
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
import { FileText, DollarSign, Receipt, TrendingUp } from "lucide-react";
import { useState } from "react";

const AccountsDashboard = () => {
  const { payments, syncEmployeeSubmissions } = useAccountsData();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Sync on mount and periodically
    syncEmployeeSubmissions();
    const interval = setInterval(syncEmployeeSubmissions, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const paginatedPayments = payments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    { 
      title: "Total Payments", 
      value: payments.length.toString(), 
      icon: Receipt,
      color: "text-primary"
    },
    { 
      title: "Total Amount", 
      value: `₹${totalAmount.toLocaleString()}`, 
      icon: DollarSign,
      color: "text-success"
    },
    { 
      title: "Pending Review", 
      value: payments.filter(p => p.type === "reimbursement").length.toString(), 
      icon: FileText,
      color: "text-warning"
    },
    { 
      title: "This Month", 
      value: payments.filter(p => {
        const date = new Date(p.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length.toString(), 
      icon: TrendingUp,
      color: "text-info"
    },
  ];

  return (
    <AccountsLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Payment Records</h2>
          <p className="opacity-90">View and manage all employee payment submissions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="card-corporate p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payments Table */}
        <div className="card-corporate p-6">
          <h3 className="text-lg font-semibold mb-4">All Payment Records</h3>
          
          {payments.length === 0 ? (
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
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.employeeName}</TableCell>
                        <TableCell className="text-success font-semibold">
                          ₹{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.type === "payment" 
                              ? "bg-primary/10 text-primary" 
                              : "bg-warning/10 text-warning"
                          }`}>
                            {payment.type === "payment" ? "Payment" : "Reimbursement"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {payment.receiptUrl ? (
                            <a 
                              href={payment.receiptUrl} 
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
