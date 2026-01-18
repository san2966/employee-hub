import { useState } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData } from "@/hooks/useDirectorData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Check, X } from "lucide-react";

const LeaveManager = () => {
  const { toast } = useToast();
  const { leaves, updateLeave } = useDirectorData();
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const pendingLeaves = leaves.filter(l => l.status === "pending");
  const processedLeaves = leaves.filter(l => l.status !== "pending");

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

  return (
    <DirectorLayout title="Leave Manager">
      <div className="space-y-6">
        {/* Pending Requests */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Pending Requests</h2>
          {pendingLeaves.length === 0 ? (
            <div className="card-corporate p-8 text-center">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No pending leave requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingLeaves.map(leave => (
                <div key={leave.id} className="card-corporate p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{leave.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{leave.date}</p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-warning/10 text-warning">
                      Pending
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{getLeaveTypeLabel(leave.type)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Reason:</span>
                      <p className="text-sm mt-1">{leave.reason}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => handleApprove(leave.id)}
                    >
                      <Check className="h-4 w-4 mr-1" /> Accept
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Processed Requests</h2>
          {processedLeaves.length === 0 ? (
            <div className="card-corporate p-8 text-center">
              <p className="text-muted-foreground">No processed requests</p>
            </div>
          ) : (
            <div className="card-corporate overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Employee</th>
                      <th className="text-left p-4 text-sm font-medium">Date</th>
                      <th className="text-left p-4 text-sm font-medium">Type</th>
                      <th className="text-left p-4 text-sm font-medium">Reason</th>
                      <th className="text-left p-4 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {processedLeaves.map(leave => (
                      <tr key={leave.id}>
                        <td className="p-4 text-sm">{leave.employeeName}</td>
                        <td className="p-4 text-sm text-muted-foreground">{leave.date}</td>
                        <td className="p-4 text-sm">{getLeaveTypeLabel(leave.type)}</td>
                        <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            leave.status === "approved" 
                              ? "bg-success/10 text-success" 
                              : "bg-destructive/10 text-destructive"
                          }`}>
                            {leave.status}
                          </span>
                          {leave.rejectionReason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Reason: {leave.rejectionReason}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
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
