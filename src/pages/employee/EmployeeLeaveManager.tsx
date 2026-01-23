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
import { Calendar, Download, Briefcase, HeartPulse, RefreshCcw } from "lucide-react";

const EmployeeLeaveManager = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  const employeeName = session.employeeName || "";
  
  const { 
    requestLeave, 
    getUpdatedLeaveRequests, 
    leaveBalance, 
    updateLeaveBalanceFromApproved 
  } = useEmployeeData(employeeId);
  
  const { toast } = useToast();
  
  const [paidDialog, setPaidDialog] = useState(false);
  const [medicalDialog, setMedicalDialog] = useState(false);
  const [exchangeDialog, setExchangeDialog] = useState(false);
  
  const [paidForm, setPaidForm] = useState({ date: "", reason: "" });
  const [medicalForm, setMedicalForm] = useState({ date: "", reason: "", certificate: "" });
  const [exchangeForm, setExchangeForm] = useState({ workingDate: "", workingReason: "", leaveDate: "" });
  
  const leaveRequests = getUpdatedLeaveRequests();
  const [balance, setBalance] = useState(leaveBalance);
  
  useEffect(() => {
    const updatedBalance = updateLeaveBalanceFromApproved();
    setBalance(updatedBalance);
  }, [leaveRequests.length]);
  
  const paidLeaves = leaveRequests.filter(l => l.type === "paid");
  const medicalLeaves = leaveRequests.filter(l => l.type === "medical");
  const exchangeLeaves = leaveRequests.filter(l => l.type === "exchange");
  
  const handlePaidLeave = () => {
    if (!paidForm.date || !paidForm.reason) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }
    
    requestLeave({ 
      date: paidForm.date, 
      reason: paidForm.reason, 
      type: "paid", 
      employeeName 
    });
    
    toast({ title: "Leave request submitted" });
    setPaidDialog(false);
    setPaidForm({ date: "", reason: "" });
  };
  
  const handleMedicalLeave = () => {
    if (!medicalForm.date || !medicalForm.reason) {
      toast({ variant: "destructive", title: "Error", description: "Please fill required fields" });
      return;
    }
    
    requestLeave({ 
      date: medicalForm.date, 
      reason: medicalForm.reason, 
      type: "medical", 
      employeeName,
      medicalCertificate: medicalForm.certificate,
    });
    
    toast({ title: "Medical leave request submitted" });
    setMedicalDialog(false);
    setMedicalForm({ date: "", reason: "", certificate: "" });
  };
  
  const handleExchangeLeave = () => {
    if (!exchangeForm.workingDate || !exchangeForm.workingReason || !exchangeForm.leaveDate) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }
    
    requestLeave({ 
      date: exchangeForm.leaveDate, 
      reason: `Working on ${exchangeForm.workingDate}: ${exchangeForm.workingReason}`, 
      type: "exchange", 
      employeeName,
      workingDate: exchangeForm.workingDate,
      workingReason: exchangeForm.workingReason,
    });
    
    toast({ title: "Exchange leave request submitted" });
    setExchangeDialog(false);
    setExchangeForm({ workingDate: "", workingReason: "", leaveDate: "" });
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
          <p className="font-medium">Leave on {new Date(leave.date).toLocaleDateString()}</p>
          <p className="text-sm text-muted-foreground mt-1">{leave.reason}</p>
          {leave.workingDate && (
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
              <p className="text-3xl font-bold text-warning">{balance.exchange}</p>
              <p className="text-sm text-muted-foreground">Exchange Leaves</p>
              <p className="text-xs text-muted-foreground mt-1">(Work extra, take off later)</p>
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
            <Dialog open={exchangeDialog} onOpenChange={setExchangeDialog}>
              <DialogTrigger asChild>
                <Button>Take Leave</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Exchange Leave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Date of Working (Extra day you worked)</Label>
                    <Input 
                      type="date"
                      value={exchangeForm.workingDate} 
                      onChange={e => setExchangeForm({ ...exchangeForm, workingDate: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Reason for Working</Label>
                    <Textarea 
                      value={exchangeForm.workingReason} 
                      onChange={e => setExchangeForm({ ...exchangeForm, workingReason: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Date of Leave Taken</Label>
                    <Input 
                      type="date"
                      value={exchangeForm.leaveDate} 
                      onChange={e => setExchangeForm({ ...exchangeForm, leaveDate: e.target.value })} 
                    />
                  </div>
                  <Button className="w-full" onClick={handleExchangeLeave}>Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {exchangeLeaves.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No exchange leave requests</p>
            ) : (
              <div className="space-y-3">
                {exchangeLeaves.map(leave => <LeaveCard key={leave.id} leave={leave} />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeLeaveManager;
