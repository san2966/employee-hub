import { useState, useEffect } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Briefcase, HeartPulse, RefreshCcw, Plus, Minus } from "lucide-react";

const EmployeeLeaveManager = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}");
  const employeeId = session.employeeId || authUser.employee_id || "";
  const employeeName = authUser.employee_name || session.employeeName || authUser.username || "";
  
  const { 
    getUpdatedLeaveRequests, 
    leaveBalance, 
    updateLeaveBalanceFromApproved,
    requestLeave,
    addExchangeLeave,
    takeExchangeLeave,
    calculateExchangeBalance,
    getPendingExchangeAdds,
  } = useEmployeeData(employeeId);
  
  const { toast } = useToast();
  
  const [paidDialog, setPaidDialog] = useState(false);
  const [medicalDialog, setMedicalDialog] = useState(false);
  const [addExchangeDialog, setAddExchangeDialog] = useState(false);
  const [takeExchangeDialog, setTakeExchangeDialog] = useState(false);
  
  const [paidForm, setPaidForm] = useState({ date: "", reason: "" });
  const [medicalForm, setMedicalForm] = useState({ date: "", reason: "", certificate: "" });
  const [addExchangeForm, setAddExchangeForm] = useState({ workingDate: "", workingReason: "" });
  const [takeExchangeForm, setTakeExchangeForm] = useState({ leaveDate: "", leaveReason: "" });
  
  const leaveRequests = getUpdatedLeaveRequests();
  const [balance, setBalance] = useState(leaveBalance);
  const exchangeBalance = calculateExchangeBalance();
  const pendingAdds = getPendingExchangeAdds();
  
  useEffect(() => {
    const updatedBalance = updateLeaveBalanceFromApproved();
    setBalance(updatedBalance);
  }, [leaveRequests.length, leaveBalance, updateLeaveBalanceFromApproved]);
  
  const paidLeaves = leaveRequests.filter(l => l.type === "paid");
  const medicalLeaves = leaveRequests.filter(l => l.type === "medical");
  const exchangeLeaves = leaveRequests.filter(l => l.type === "exchange");
  const exchangeAdds = exchangeLeaves.filter(l => l.isAddLeave);
  const exchangeTakes = exchangeLeaves.filter(l => !l.isAddLeave);
  
  const handlePaidLeave = async () => {
    if (!paidForm.date || !paidForm.reason) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }
    
    try {
      await requestLeave({ 
        date: paidForm.date, 
        reason: paidForm.reason, 
        type: "paid", 
        employeeName 
      });
      toast({ title: "Leave request submitted", description: "Waiting for Director approval" });
      setPaidDialog(false);
      setPaidForm({ date: "", reason: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Request failed" });
    }
  };
  
  const handleMedicalLeave = async () => {
    if (!medicalForm.date || !medicalForm.reason) {
      toast({ variant: "destructive", title: "Error", description: "Please fill required fields" });
      return;
    }
    
    try {
      await requestLeave({ 
        date: medicalForm.date, 
        reason: medicalForm.reason, 
        type: "medical", 
        employeeName,
        medicalCertificate: medicalForm.certificate,
      });
      toast({ title: "Medical leave request submitted", description: "Waiting for Director approval" });
      setMedicalDialog(false);
      setMedicalForm({ date: "", reason: "", certificate: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Request failed" });
    }
  };
  
  const handleAddExchangeLeave = async () => {
    if (!addExchangeForm.workingDate || !addExchangeForm.workingReason) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }

    try {
      await addExchangeLeave({ 
        workingDate: addExchangeForm.workingDate,
        workingReason: addExchangeForm.workingReason,
        employeeName,
      });

      toast({ title: "Exchange leave added", description: "Waiting for Director approval to earn the leave" });
      setAddExchangeDialog(false);
      setAddExchangeForm({ workingDate: "", workingReason: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Request failed" });
    }
  };

  const handleTakeExchangeLeave = async () => {
    if (!takeExchangeForm.leaveDate || !takeExchangeForm.leaveReason) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }

    if (exchangeBalance <= 0) {
      toast({ variant: "destructive", title: "Error", description: "No exchange leaves available. Add working days first." });
      return;
    }
    
    try {
      await takeExchangeLeave({ 
        leaveDate: takeExchangeForm.leaveDate,
        leaveReason: takeExchangeForm.leaveReason,
        employeeName,
      });

      toast({ title: "Exchange leave request submitted", description: "Waiting for Director approval" });
      setTakeExchangeDialog(false);
      setTakeExchangeForm({ leaveDate: "", leaveReason: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Request failed" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMedicalForm({ ...medicalForm, certificate: url });
      toast({ title: "Certificate uploaded" });
    }
  };

  const LeaveCard = ({ leave }: { leave: typeof leaveRequests[0] }) => (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">
            {leave.isAddLeave ? "Worked on" : "Leave on"} {new Date(leave.date).toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{leave.reason}</p>
          {leave.workingDate && !leave.isAddLeave && (
            <p className="text-xs text-muted-foreground mt-1">
              Working Date: {new Date(leave.workingDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
            leave.status === "approved" ? "bg-success/10 text-success" :
            leave.status === "rejected" ? "bg-destructive/10 text-destructive" :
            "bg-warning/10 text-warning"
          }`}>
            {leave.status}
          </span>
          {leave.isAddLeave && (
            <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
              +1 Leave
            </span>
          )}
          {leave.status === "rejected" && leave.rejectionReason && (
            <p className="text-xs text-destructive mt-1">
              Reason: {leave.rejectionReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <EmployeeLayout title="Leave Manager">
      <div className="space-y-6">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-corporate bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-primary">{balance.paid}</p>
              <p className="text-sm text-muted-foreground">Paid Leaves Left</p>
              <p className="text-xs text-muted-foreground mt-1">(Resets to 12 yearly)</p>
            </CardContent>
          </Card>
          
          <Card className="card-corporate bg-success/5 border-success/20">
            <CardContent className="pt-6 text-center">
              <HeartPulse className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-3xl font-bold text-success">{balance.medical}</p>
              <p className="text-sm text-muted-foreground">Medical Leaves Left</p>
              <p className="text-xs text-muted-foreground mt-1">(Resets to 6 yearly)</p>
            </CardContent>
          </Card>
          
          <Card className="card-corporate bg-warning/5 border-warning/20">
            <CardContent className="pt-6 text-center">
              <RefreshCcw className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-3xl font-bold text-warning">{exchangeBalance}</p>
              <p className="text-sm text-muted-foreground">Exchange Leaves Available</p>
              <p className="text-xs text-muted-foreground mt-1">
                (Starts at 0 • Earn by working extra)
                {pendingAdds > 0 && <span className="text-primary"> • {pendingAdds} pending</span>}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Paid Leave */}
        <Card className="card-corporate">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Paid Leave
            </CardTitle>
            <Dialog open={paidDialog} onOpenChange={setPaidDialog}>
              <DialogTrigger asChild>
                <Button disabled={balance.paid <= 0}>Take Leave</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Paid Leave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date"
                      value={paidForm.date} 
                      onChange={e => setPaidForm({ ...paidForm, date: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Textarea 
                      value={paidForm.reason} 
                      onChange={e => setPaidForm({ ...paidForm, reason: e.target.value })} 
                    />
                  </div>
                  <Button className="w-full" onClick={handlePaidLeave}>Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {paidLeaves.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No paid leave requests</p>
            ) : (
              <div className="space-y-3">
                {paidLeaves.map(leave => <LeaveCard key={leave.id} leave={leave} />)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Leave */}
        <Card className="card-corporate">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-success" />
              Medical Leave
            </CardTitle>
            <Dialog open={medicalDialog} onOpenChange={setMedicalDialog}>
              <DialogTrigger asChild>
                <Button disabled={balance.medical <= 0}>Take Leave</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Medical Leave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date"
                      value={medicalForm.date} 
                      onChange={e => setMedicalForm({ ...medicalForm, date: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Textarea 
                      value={medicalForm.reason} 
                      onChange={e => setMedicalForm({ ...medicalForm, reason: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Medical Certificate (Optional)</Label>
                    <Input 
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                    />
                  </div>
                  <Button className="w-full" onClick={handleMedicalLeave}>Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {medicalLeaves.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No medical leave requests</p>
            ) : (
              <div className="space-y-3">
                {medicalLeaves.map(leave => <LeaveCard key={leave.id} leave={leave} />)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exchange Leave */}
        <Card className="card-corporate">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-warning" />
              Exchange Leave
            </CardTitle>
            <div className="flex gap-2">
              {/* Add Leave Button */}
              <Dialog open={addExchangeDialog} onOpenChange={setAddExchangeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Leave
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Exchange Leave (Work Extra Day)</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground mb-4">
                    Record an extra day you worked to earn an exchange leave. 
                    Once approved by Director, you'll earn +1 exchange leave.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label>Date of Working</Label>
                      <Input 
                        type="date"
                        value={addExchangeForm.workingDate} 
                        onChange={e => setAddExchangeForm({ ...addExchangeForm, workingDate: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label>Reason for Working</Label>
                      <Textarea 
                        placeholder="Describe why you worked on this day..."
                        value={addExchangeForm.workingReason} 
                        onChange={e => setAddExchangeForm({ ...addExchangeForm, workingReason: e.target.value })} 
                      />
                    </div>
                    <Button className="w-full" onClick={handleAddExchangeLeave}>Submit for Approval</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Take Leave Button */}
              <Dialog open={takeExchangeDialog} onOpenChange={setTakeExchangeDialog}>
                <DialogTrigger asChild>
                  <Button disabled={exchangeBalance <= 0} className="gap-1">
                    <Minus className="h-4 w-4" />
                    Take Leave
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Take Exchange Leave</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use one of your earned exchange leaves. You have {exchangeBalance} available.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label>Date of Leave</Label>
                      <Input 
                        type="date"
                        value={takeExchangeForm.leaveDate} 
                        onChange={e => setTakeExchangeForm({ ...takeExchangeForm, leaveDate: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label>Reason for Leave</Label>
                      <Textarea 
                        placeholder="Describe why you need this leave..."
                        value={takeExchangeForm.leaveReason} 
                        onChange={e => setTakeExchangeForm({ ...takeExchangeForm, leaveReason: e.target.value })} 
                      />
                    </div>
                    <Button className="w-full" onClick={handleTakeExchangeLeave}>Submit Request</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Earned Leaves Section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Earned Leaves (Worked Extra)
                </h4>
                {exchangeAdds.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">No earned exchange leaves yet</p>
                ) : (
                  <div className="space-y-2">
                    {exchangeAdds.map(leave => <LeaveCard key={leave.id} leave={leave} />)}
                  </div>
                )}
              </div>

              {/* Taken Leaves Section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Minus className="h-4 w-4" /> Used Leaves
                </h4>
                {exchangeTakes.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">No exchange leaves used yet</p>
                ) : (
                  <div className="space-y-2">
                    {exchangeTakes.map(leave => <LeaveCard key={leave.id} leave={leave} />)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeLeaveManager;
