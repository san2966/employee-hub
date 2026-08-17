import { useState, useEffect } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData } from "@/hooks/useDirectorData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Check, 
  X, 
  Briefcase, 
  HeartPulse, 
  RefreshCcw, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Minus
} from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { EXPORT_COLUMNS } from "@/lib/exportUtils";
import { formatDate } from "@/lib/dateFormat";

const LeaveManager = () => {
  const { toast } = useToast();
  const { leaves, updateLeave, getLeaveStats, refreshLeaves } = useDirectorData();
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const stats = getLeaveStats();

  // Refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(refreshLeaves, 2000);
    return () => clearInterval(interval);
  }, [refreshLeaves]);

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = !search || 
      leave.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      leave.reason.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || leave.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingLeaves = filteredLeaves.filter(l => l.status === "pending");
  const processedLeaves = filteredLeaves.filter(l => l.status !== "pending");

  const paidLeaves = filteredLeaves.filter(l => l.type === "paid");
  const medicalLeaves = filteredLeaves.filter(l => l.type === "medical");
  const exchangeLeaves = filteredLeaves.filter(l => l.type === "exchange");

  const handleApprove = (id: string) => {
    updateLeave(id, "approved");
    toast({ title: "Success", description: "Leave request approved" });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({ title: "Error", description: "Please provide a reason", variant: "destructive" });
      return;
    }

    if (selectedLeave) {
      updateLeave(selectedLeave, "rejected", rejectionReason);
      toast({ title: "Success", description: "Leave request rejected" });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedLeave(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setSelectedLeave(id);
    setRejectDialogOpen(true);
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "paid": return "Paid Leave";
      case "medical": return "Medical Leave";
      case "exchange": return "Exchange Leave";
      default: return type;
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case "paid": return <Briefcase className="h-4 w-4" />;
      case "medical": return <HeartPulse className="h-4 w-4" />;
      case "exchange": return <RefreshCcw className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const LeaveCard = ({ leave }: { leave: typeof leaves[0] }) => (
    <div className="card-corporate p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold">{leave.employeeName}</p>
          <p className="text-xs text-muted-foreground">{formatDate(leave.date)}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${
          leave.status === "approved" ? "bg-success/10 text-success" :
          leave.status === "rejected" ? "bg-destructive/10 text-destructive" :
          "bg-warning/10 text-warning"
        }`}>
          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
        </span>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Type:</span>
          <span className="font-medium flex items-center gap-1">
            {getLeaveTypeIcon(leave.type)}
            {getLeaveTypeLabel(leave.type)}
            {leave.type === "exchange" && leave.isAddLeave && (
              <span className="ml-1 text-primary">(+1 Earn)</span>
            )}
            {leave.type === "exchange" && !leave.isAddLeave && (
              <span className="ml-1 text-warning">(-1 Use)</span>
            )}
          </span>
        </div>
        {leave.workingDate && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Working Date:</span>
            <span>{formatDate(leave.workingDate)}</span>
          </div>
        )}
        <div>
          <span className="text-sm text-muted-foreground">Reason:</span>
          <p className="text-sm mt-1">{leave.reason}</p>
        </div>
        {leave.rejectionReason && (
          <div className="bg-destructive/10 rounded p-2 mt-2">
            <span className="text-xs text-destructive">Rejection: {leave.rejectionReason}</span>
          </div>
        )}
      </div>
      {leave.status === "pending" && (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 bg-success hover:bg-success/90"
            onClick={() => handleApprove(leave.id)}
          >
            <Check className="h-4 w-4 mr-1" /> Approve
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            className="flex-1"
            onClick={() => openRejectDialog(leave.id)}
          >
            <X className="h-4 w-4 mr-1" /> Reject
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <DirectorLayout title="Leave Manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Leave Manager</h2>
          <p className="opacity-90">Approve or reject all employee leave requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> Pending
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" /> Approved
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 border text-center">
            <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <XCircle className="h-3 w-3" /> Rejected
            </p>
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

          <Button variant="outline" size="icon" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            <X className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={refreshLeaves} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>

          <ExportButtons
            portal="Director"
            type="Leaves"
            columns={EXPORT_COLUMNS.leaves}
            data={filteredLeaves}
          />
        </div>

        {/* Tabs by Type */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Pending ({pendingLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              All ({filteredLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              Paid ({paidLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex items-center gap-1">
              <HeartPulse className="h-4 w-4" />
              Medical ({medicalLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="exchange" className="flex items-center gap-1">
              <RefreshCcw className="h-4 w-4" />
              Exchange ({exchangeLeaves.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingLeaves.length === 0 ? (
              <div className="card-corporate p-8 text-center">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pending leave requests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingLeaves.map(leave => <LeaveCard key={leave.id} leave={leave} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {filteredLeaves.length === 0 ? (
              <div className="card-corporate p-8 text-center">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No leave requests found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeaves.map(leave => <LeaveCard key={leave.id} leave={leave} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paid">
            {paidLeaves.length === 0 ? (
              <div className="card-corporate p-8 text-center">
                <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No paid leave requests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paidLeaves.map(leave => <LeaveCard key={leave.id} leave={leave} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="medical">
            {medicalLeaves.length === 0 ? (
              <div className="card-corporate p-8 text-center">
                <HeartPulse className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No medical leave requests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicalLeaves.map(leave => <LeaveCard key={leave.id} leave={leave} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exchange">
            {exchangeLeaves.length === 0 ? (
              <div className="card-corporate p-8 text-center">
                <RefreshCcw className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No exchange leave requests</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Exchange Add Requests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Earned Leave Requests (Work Extra Day)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exchangeLeaves.filter(l => l.isAddLeave).map(leave => (
                      <LeaveCard key={leave.id} leave={leave} />
                    ))}
                  </div>
                  {exchangeLeaves.filter(l => l.isAddLeave).length === 0 && (
                    <p className="text-center py-4 text-muted-foreground">No earn requests</p>
                  )}
                </div>

                {/* Exchange Take Requests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Minus className="h-5 w-5 text-warning" />
                    Use Leave Requests
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exchangeLeaves.filter(l => !l.isAddLeave).map(leave => (
                      <LeaveCard key={leave.id} leave={leave} />
                    ))}
                  </div>
                  {exchangeLeaves.filter(l => !l.isAddLeave).length === 0 && (
                    <p className="text-center py-4 text-muted-foreground">No use requests</p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Please provide a reason for rejection</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} className="flex-1">
                Reject Leave
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
};

export default LeaveManager;
