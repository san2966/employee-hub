import { useState, useMemo } from "react";
import HRLayout from "@/components/hr/HRLayout";
import { useHRData, LeaveRequest } from "@/hooks/useHRData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Briefcase, 
  HeartPulse, 
  RefreshCcw, 
  Search, 
  Trash2, 
  X,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

const HRLeaveManager = () => {
  const { 
    employees,
    getAllLeaveRequests, 
    clearLeaveRecord, 
    clearEmployeeLeaves,
    getLeaveStats,
    refreshLeaves,
  } = useHRData();
  
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  const allLeaves = getAllLeaveRequests();
  const stats = getLeaveStats();

  const filteredLeaves = useMemo(() => {
    return allLeaves.filter(leave => {
      const matchesSearch = !search || 
        leave.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        leave.reason.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || leave.status === statusFilter;
      const matchesEmployee = employeeFilter === "all" || leave.employeeId === employeeFilter;
      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [allLeaves, search, statusFilter, employeeFilter]);

  const paidLeaves = filteredLeaves.filter(l => l.type === "paid");
  const medicalLeaves = filteredLeaves.filter(l => l.type === "medical");
  const exchangeLeaves = filteredLeaves.filter(l => l.type === "exchange");

  const handleClearLeave = (leaveId: string) => {
    clearLeaveRecord(leaveId);
    toast({ title: "Leave record cleared", description: "The leave record has been deleted" });
  };

  const handleClearEmployeeLeaves = (employeeId: string, employeeName: string) => {
    clearEmployeeLeaves(employeeId);
    toast({ 
      title: "All leaves cleared", 
      description: `All leave records for ${employeeName} have been deleted` 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2 py-1 rounded text-xs bg-success/10 text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</span>;
      case "rejected":
        return <span className="px-2 py-1 rounded text-xs bg-destructive/10 text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs bg-warning/10 text-warning flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>;
    }
  };

  const LeaveTable = ({ leaves, type }: { leaves: LeaveRequest[]; type: string }) => (
    <div className="space-y-4">
      {leaves.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {type} leave records found</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.employeeName}</TableCell>
                  <TableCell>{new Date(leave.date).toLocaleDateString()}</TableCell>
                  <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                  <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(leave.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear Leave Record</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this leave record? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleClearLeave(leave.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  return (
    <HRLayout title="Leave Manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Employee Leave Manager</h2>
          <p className="opacity-90">View and manage all employee leave requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-primary">{stats.paidLeaves}</p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-success">{stats.medicalLeaves}</p>
            <p className="text-xs text-muted-foreground">Medical</p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-warning">{stats.exchangeLeaves}</p>
            <p className="text-xs text-muted-foreground">Exchange</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end bg-card p-4 rounded-lg border">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-sm text-muted-foreground mb-2 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-40">
            <Label className="text-sm text-muted-foreground mb-2 block">Employee</Label>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-36">
            <Label className="text-sm text-muted-foreground mb-2 block">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" onClick={() => { setSearch(""); setStatusFilter("all"); setEmployeeFilter("all"); }}>
            <X className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={refreshLeaves} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              All ({filteredLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Paid ({paidLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4" />
              Medical ({medicalLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="exchange" className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Exchange ({exchangeLeaves.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="card-corporate p-6">
              <LeaveTable leaves={filteredLeaves} type="leave" />
            </div>
          </TabsContent>

          <TabsContent value="paid">
            <div className="card-corporate p-6">
              <LeaveTable leaves={paidLeaves} type="paid leave" />
            </div>
          </TabsContent>

          <TabsContent value="medical">
            <div className="card-corporate p-6">
              <LeaveTable leaves={medicalLeaves} type="medical leave" />
            </div>
          </TabsContent>

          <TabsContent value="exchange">
            <div className="card-corporate p-6">
              <LeaveTable leaves={exchangeLeaves} type="exchange leave" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </HRLayout>
  );
};

export default HRLeaveManager;
