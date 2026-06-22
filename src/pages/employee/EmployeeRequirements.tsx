import { useState } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Link as LinkIcon, DollarSign } from "lucide-react";

const EmployeeRequirements = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  const employeeName = session.employeeName || "";
  
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

        {/* Requirements List */}
        {requirements.length === 0 ? (
          <Card className="card-corporate">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Requirements Yet</p>
              <p className="text-sm mt-2">Click "Add Requirement" to submit your first request</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requirements.map(req => (
              <Card key={req.id} className="card-corporate">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{req.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium capitalize ${
                      req.status === "approved" ? "bg-success/10 text-success" :
                      req.status === "rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-warning/10 text-warning"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-sm">{req.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Why Needed</p>
                      <p className="text-sm">{req.whyNeeded}</p>
                    </div>
                    
                    <div className="flex gap-4 pt-2">
                      {req.link && (
                        <a 
                          href={req.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Reference Link
                        </a>
                      )}
                      {req.expectedCost && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Expected Cost: ₹{req.expectedCost.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeRequirements;
