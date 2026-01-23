import { useState, useMemo } from "react";
import AccountsLayout from "@/components/accounts/AccountsLayout";
import { useAccountsData } from "@/hooks/useAccountsData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Download, Search, Filter, Receipt, Plane, X } from "lucide-react";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const Vouchers = () => {
  const { 
    getFilteredVouchers, 
    getFilteredTravelExpenses,
    getTotalVoucherAmount,
    getTotalTravelAmount,
    getUniqueEmployees,
    getAvailableYears,
    vouchers,
    travelExpenses
  } = useAccountsData();

  // Voucher Filters
  const [voucherEmployee, setVoucherEmployee] = useState("");
  const [voucherYear, setVoucherYear] = useState<string>("");
  const [voucherMonth, setVoucherMonth] = useState<string>("");
  const [voucherSearch, setVoucherSearch] = useState("");

  // Travel Filters
  const [travelEmployee, setTravelEmployee] = useState("");
  const [travelYear, setTravelYear] = useState<string>("");
  const [travelMonth, setTravelMonth] = useState<string>("");
  const [travelSearch, setTravelSearch] = useState("");

  const employees = getUniqueEmployees();
  const years = getAvailableYears();

  // Filtered data
  const filteredVouchers = useMemo(() => {
    let filtered = getFilteredVouchers(
      voucherEmployee || undefined,
      voucherYear ? parseInt(voucherYear) : undefined,
      voucherMonth ? parseInt(voucherMonth) : undefined
    );
    
    if (voucherSearch) {
      filtered = filtered.filter(v => 
        v.employeeName.toLowerCase().includes(voucherSearch.toLowerCase())
      );
    }
    
    return filtered;
  }, [vouchers, voucherEmployee, voucherYear, voucherMonth, voucherSearch]);

  const filteredTravelExpenses = useMemo(() => {
    let filtered = getFilteredTravelExpenses(
      travelEmployee || undefined,
      travelYear ? parseInt(travelYear) : undefined,
      travelMonth ? parseInt(travelMonth) : undefined
    );
    
    if (travelSearch) {
      filtered = filtered.filter(t => 
        t.employeeName.toLowerCase().includes(travelSearch.toLowerCase()) ||
        t.from.toLowerCase().includes(travelSearch.toLowerCase()) ||
        t.to.toLowerCase().includes(travelSearch.toLowerCase())
      );
    }
    
    return filtered;
  }, [travelExpenses, travelEmployee, travelYear, travelMonth, travelSearch]);

  const clearVoucherFilters = () => {
    setVoucherEmployee("");
    setVoucherYear("");
    setVoucherMonth("");
    setVoucherSearch("");
  };

  const clearTravelFilters = () => {
    setTravelEmployee("");
    setTravelYear("");
    setTravelMonth("");
    setTravelSearch("");
  };

  return (
    <AccountsLayout title="Vouchers">
      <div className="space-y-6">
        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Vouchers & Travel Expenses</h2>
          <p className="opacity-90">Manage vouchers and travel expense records</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vouchers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="vouchers" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Vouchers
            </TabsTrigger>
            <TabsTrigger value="travel" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Travelling Expense
            </TabsTrigger>
          </TabsList>

          {/* Vouchers Tab */}
          <TabsContent value="vouchers">
            <div className="card-corporate p-6 space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-sm text-muted-foreground mb-2 block">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by employee name..."
                      value={voucherSearch}
                      onChange={(e) => setVoucherSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-48">
                  <Label className="text-sm text-muted-foreground mb-2 block">Employee</Label>
                <Select value={voucherEmployee || "all"} onValueChange={(val) => setVoucherEmployee(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-32">
                  <Label className="text-sm text-muted-foreground mb-2 block">Year</Label>
                <Select value={voucherYear || "all"} onValueChange={(val) => setVoucherYear(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-40">
                  <Label className="text-sm text-muted-foreground mb-2 block">Month</Label>
                <Select value={voucherMonth || "all"} onValueChange={(val) => setVoucherMonth(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" size="icon" onClick={clearVoucherFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Table */}
              {filteredVouchers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No voucher records found</p>
                  <p className="text-sm mt-1">Records will appear when employees submit vouchers</p>
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
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVouchers.map((voucher) => (
                          <TableRow key={voucher.id}>
                            <TableCell className="font-medium">{voucher.employeeName}</TableCell>
                            <TableCell className="text-success font-semibold">
                              ₹{voucher.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>{new Date(voucher.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(voucher.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {voucher.receiptUrl ? (
                                <a 
                                  href={voucher.receiptUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
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

                  {/* Total */}
                  <div className="flex justify-end">
                    <div className="bg-primary/10 rounded-lg px-6 py-4">
                      <p className="text-sm text-muted-foreground">Total Voucher Amount</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{getTotalVoucherAmount(filteredVouchers).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Travel Expense Tab */}
          <TabsContent value="travel">
            <div className="card-corporate p-6 space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-sm text-muted-foreground mb-2 block">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or location..."
                      value={travelSearch}
                      onChange={(e) => setTravelSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-48">
                  <Label className="text-sm text-muted-foreground mb-2 block">Employee</Label>
                <Select value={travelEmployee || "all"} onValueChange={(val) => setTravelEmployee(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-32">
                  <Label className="text-sm text-muted-foreground mb-2 block">Year</Label>
                <Select value={travelYear || "all"} onValueChange={(val) => setTravelYear(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-40">
                  <Label className="text-sm text-muted-foreground mb-2 block">Month</Label>
                <Select value={travelMonth || "all"} onValueChange={(val) => setTravelMonth(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" size="icon" onClick={clearTravelFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Table */}
              {filteredTravelExpenses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No travel expense records found</p>
                  <p className="text-sm mt-1">Records will appear when employees submit travel expenses</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Employee Name</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTravelExpenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.employeeName}</TableCell>
                            <TableCell>{expense.from}</TableCell>
                            <TableCell>{expense.to}</TableCell>
                            <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-success font-semibold">
                              ₹{expense.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {expense.receiptUrl ? (
                                <a 
                                  href={expense.receiptUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
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

                  {/* Total */}
                  <div className="flex justify-end">
                    <div className="bg-primary/10 rounded-lg px-6 py-4">
                      <p className="text-sm text-muted-foreground">Total Travel Expense</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{getTotalTravelAmount(filteredTravelExpenses).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AccountsLayout>
  );
};

export default Vouchers;
