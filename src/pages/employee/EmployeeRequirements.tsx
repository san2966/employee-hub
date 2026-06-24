import { useState } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Link as LinkIcon } from "lucide-react";

const statusLabel = (s: string) => {
  const v = String(s || "pending").toLowerCase();
  if (v === "approved" || v === "accepted" || v === "completed" || v === "in_progress") return "Accepted";
  if (v === "rejected") return "Rejected";
  return "Pending";
};
const statusClass = (s: string) => {
  const l = statusLabel(s);
  if (l === "Accepted") return "bg-success/10 text-success";
  if (l === "Rejected") return "bg-destructive/10 text-destructive";
  return "bg-warning/10 text-warning";
};

const EmployeeRequirements = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}");
  const employeeId = session.employeeId || authUser.employee_id || "";
  const employeeName = authUser.employee_name || session.employeeName || authUser.username || "";
  
  const { requirements, addRequirement } = useEmployeeData(employeeId);
  const { toast } = useToast();
  
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    whyNeeded: "",
    link: "",
    expectedCost: "",
  });
  
  const handleSave = async () => {
    if (!form.title || !form.description || !form.whyNeeded) {
      toast({ variant: "destructive", title: "Error", description: "Please fill required fields" });
      return;
    }

    try {
      await addRequirement({
        title: form.title.trim(),
        description: form.description.trim(),
        whyNeeded: form.whyNeeded.trim(),
        link: form.link.trim(),
        expectedCost: form.expectedCost ? parseFloat(form.expectedCost) : undefined,
        employeeName,
      });

      toast({ title: "Requirement submitted", description: "Your requirement has been sent to Director for review" });
      setDialog(false);
      setForm({ title: "", description: "", whyNeeded: "", link: "", expectedCost: "" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Requirement not submitted",
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <EmployeeLayout title="Requirements">
      <div className="space-y-6">
        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">My Requirements</h2>
            <p className="opacity-90">Submit and track your requirements</p>
          </div>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Plus className="h-4 w-4 mr-2" /> Add Requirement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Requirement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input 
                    value={form.title} 
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                    placeholder="Brief title for your requirement"
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea 
                    rows={3}
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    placeholder="Detailed description of what you need"
                  />
                </div>
                <div>
                  <Label>Why You Need This *</Label>
                  <Textarea 
                    rows={3}
                    value={form.whyNeeded} 
                    onChange={e => setForm({ ...form, whyNeeded: e.target.value })} 
                    placeholder="Explain why this requirement is necessary for your work"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Link (Optional)</Label>
                    <Input 
                      type="url"
                      value={form.link} 
                      onChange={e => setForm({ ...form, link: e.target.value })} 
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Expected Cost (Optional)</Label>
                    <Input 
                      type="number"
                      value={form.expectedCost} 
                      onChange={e => setForm({ ...form, expectedCost: e.target.value })} 
                      placeholder="₹0"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleSave}>Submit Requirement</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Requirements Table */}
        {requirements.length === 0 ? (
          <Card className="card-corporate">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Requirements Yet</p>
              <p className="text-sm mt-2">Click "Add Requirement" to submit your first request</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-corporate">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Why Needed</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.title}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{req.description}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{req.whyNeeded || "—"}</TableCell>
                      <TableCell>
                        {req.link ? (
                          <a href={req.link} target="_blank" rel="noopener noreferrer"
                             className="text-primary hover:underline inline-flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" /> Open
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{req.expectedCost ? `₹${req.expectedCost.toLocaleString()}` : "—"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass(req.status)}`}>
                          {statusLabel(req.status)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeRequirements;
