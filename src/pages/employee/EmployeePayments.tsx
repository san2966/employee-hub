import { useState } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plane, CreditCard, Plus, Download, Receipt } from "lucide-react";

const EmployeePayments = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  const employeeName = session.employeeName || "";
  
  const { travelExpenses, addTravelExpense, miscPayments, addMiscPayment } = useEmployeeData(employeeId);
  const { toast } = useToast();
  
  // Travel dialog
  const [travelDialog, setTravelDialog] = useState(false);
  const [travelForm, setTravelForm] = useState({
    from: "",
    to: "",
    purpose: "",
    date: "",
    amount: "",
    receiptUrl: "",
  });
  
  // Misc dialog
  const [miscDialog, setMiscDialog] = useState(false);
  const [miscForm, setMiscForm] = useState({
    date: "",
    purpose: "",
    amount: "",
    receiptUrl: "",
  });
  
  const handleTravelSave = () => {
    if (!travelForm.from || !travelForm.to || !travelForm.purpose || !travelForm.date || !travelForm.amount) {
      toast({ variant: "destructive", title: "Error", description: "Please fill required fields" });
      return;
    }
    
    addTravelExpense({
      ...travelForm,
      amount: parseFloat(travelForm.amount),
      employeeName,
    });
    
    toast({ title: "Travel expense added", description: "Your expense has been synced to Accounts" });
    setTravelDialog(false);
    setTravelForm({ from: "", to: "", purpose: "", date: "", amount: "", receiptUrl: "" });
  };
  
  const handleMiscSave = () => {
    if (!miscForm.date || !miscForm.purpose || !miscForm.amount) {
      toast({ variant: "destructive", title: "Error", description: "Please fill required fields" });
      return;
    }
    
    addMiscPayment({
      ...miscForm,
      amount: parseFloat(miscForm.amount),
      employeeName,
    });
    
    toast({ title: "Payment added", description: "Your payment has been synced to Accounts" });
    setMiscDialog(false);
    setMiscForm({ date: "", purpose: "", amount: "", receiptUrl: "" });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "travel" | "misc") => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload to storage and get URL
      const url = URL.createObjectURL(file);
      if (type === "travel") {
        setTravelForm({ ...travelForm, receiptUrl: url });
      } else {
        setMiscForm({ ...miscForm, receiptUrl: url });
      }
      toast({ title: "Document uploaded" });
    }
  };

  return (
    <EmployeeLayout title="Payments">
      <div className="space-y-6">
        <Tabs defaultValue="travel" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="travel" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Travelling Expense ({travelExpenses.length})
            </TabsTrigger>
            <TabsTrigger value="misc" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Miscellaneous ({miscPayments.length})
            </TabsTrigger>
          </TabsList>

          {/* Travel Expenses */}
          <TabsContent value="travel">
            <Card className="card-corporate">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Travel Expenses</CardTitle>
                <Dialog open={travelDialog} onOpenChange={setTravelDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Travel Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>From *</Label>
                          <Input 
                            value={travelForm.from} 
                            onChange={e => setTravelForm({ ...travelForm, from: e.target.value })} 
                            placeholder="Source location"
                          />
                        </div>
                        <div>
                          <Label>To *</Label>
                          <Input 
                            value={travelForm.to} 
                            onChange={e => setTravelForm({ ...travelForm, to: e.target.value })} 
                            placeholder="Destination"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Purpose of Travelling *</Label>
                        <Textarea 
                          value={travelForm.purpose} 
                          onChange={e => setTravelForm({ ...travelForm, purpose: e.target.value })} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Date *</Label>
                          <Input 
                            type="date"
                            value={travelForm.date} 
                            onChange={e => setTravelForm({ ...travelForm, date: e.target.value })} 
                          />
                        </div>
                        <div>
                          <Label>Amount (₹) *</Label>
                          <Input 
                            type="number"
                            value={travelForm.amount} 
                            onChange={e => setTravelForm({ ...travelForm, amount: e.target.value })} 
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Upload Document (Receipt)</Label>
                        <Input 
                          type="file"
                          accept="image/*,.pdf"
                          onChange={e => handleFileUpload(e, "travel")}
                        />
                      </div>
                      <Button className="w-full" onClick={handleTravelSave}>Save Expense</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {travelExpenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Travel Expenses</p>
                    <p className="text-sm mt-2">Add your travel expenses for reimbursement</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {travelExpenses.map(expense => (
                      <div key={expense.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{expense.from}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium">{expense.to}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{expense.purpose}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-success">₹{expense.amount.toLocaleString()}</p>
                            {expense.receiptUrl && (
                              <a 
                                href={expense.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1 justify-end mt-1"
                              >
                                <Download className="h-3 w-3" /> Receipt
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Miscellaneous */}
          <TabsContent value="misc">
            <Card className="card-corporate">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Miscellaneous Payments</CardTitle>
                <Dialog open={miscDialog} onOpenChange={setMiscDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Miscellaneous Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Date *</Label>
                        <Input 
                          type="date"
                          value={miscForm.date} 
                          onChange={e => setMiscForm({ ...miscForm, date: e.target.value })} 
                        />
                      </div>
                      <div>
                        <Label>Purpose of Payment *</Label>
                        <Textarea 
                          value={miscForm.purpose} 
                          onChange={e => setMiscForm({ ...miscForm, purpose: e.target.value })} 
                        />
                      </div>
                      <div>
                        <Label>Amount (₹) *</Label>
                        <Input 
                          type="number"
                          value={miscForm.amount} 
                          onChange={e => setMiscForm({ ...miscForm, amount: e.target.value })} 
                        />
                      </div>
                      <div>
                        <Label>Upload Document</Label>
                        <Input 
                          type="file"
                          accept="image/*,.pdf"
                          onChange={e => handleFileUpload(e, "misc")}
                        />
                      </div>
                      <Button className="w-full" onClick={handleMiscSave}>Save Payment</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {miscPayments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Miscellaneous Payments</p>
                    <p className="text-sm mt-2">Add your payments for reimbursement</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {miscPayments.map(payment => (
                      <div key={payment.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{payment.purpose}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(payment.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-success">₹{payment.amount.toLocaleString()}</p>
                            {payment.receiptUrl && (
                              <a 
                                href={payment.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1 justify-end mt-1"
                              >
                                <Download className="h-3 w-3" /> Receipt
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeePayments;
