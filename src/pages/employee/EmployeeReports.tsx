import { useState } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Pencil } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { EXPORT_COLUMNS } from "@/lib/exportUtils";

const EmployeeReports = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  const employeeName = session.employeeName || "";
  
  const { reports, addReport, updateReport } = useEmployeeData(employeeId);
  const { toast } = useToast();
  
  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: "",
    department: "",
    task: "",
    status: "pending" as "completed" | "pending",
    description: "",
    additionalInfo: "",
  });
  
  const emptyForm = {
    date: "", department: "", task: "",
    status: "pending" as "completed" | "pending",
    description: "", additionalInfo: "",
  };

  const openEdit = (report: any) => {
    setEditId(report.id);
    setForm({
      date: report.date || "",
      department: report.department || "",
      task: report.task || "",
      status: report.status === "completed" ? "completed" : "pending",
      description: report.description || "",
      additionalInfo: report.additionalInfo || "",
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.date || !form.department || !form.task || !form.description) {
      toast({ variant: "destructive", title: "Error", description: "Please fill required fields" });
      return;
    }

    try {
      if (editId) {
        await updateReport(editId, form);
        toast({ title: "Report updated", description: "Changes synced to Director" });
      } else {
        await addReport({ ...form, employeeName });
        toast({ title: "Report submitted", description: "Your report has been synced to Director" });
      }
      setDialog(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e?.message || "Please try again" });
    }
  };

  return (
    <EmployeeLayout title="EOD">
      <div className="space-y-6">
        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">My Reports</h2>
            <p className="opacity-90">Submit and track your daily reports</p>
          </div>
          <div className="flex gap-2">
            <ExportButtons
              portal="Employee"
              type="Reports"
              columns={EXPORT_COLUMNS.reports}
              data={reports.map(r => ({ ...r, employeeName }))}
            />
            <Dialog open={dialog} onOpenChange={(o) => { setDialog(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={() => { setEditId(null); setForm(emptyForm); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editId ? "Modify Report" : "New Report"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Input 
                        type="date"
                        value={form.date} 
                        onChange={e => setForm({ ...form, date: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label>Office/Department *</Label>
                      <Input 
                        value={form.department} 
                        onChange={e => setForm({ ...form, department: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Task *</Label>
                    <Textarea
                      rows={3}
                      value={form.task}
                      onChange={e => setForm({ ...form, task: e.target.value })}
                      placeholder="Describe the task in detail"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="completed"
                      checked={form.status === "completed"}
                      onCheckedChange={(checked) => setForm({ ...form, status: checked ? "completed" : "pending" })}
                    />
                    <Label htmlFor="completed">Mark as Completed</Label>
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Textarea 
                      rows={3}
                      value={form.description} 
                      onChange={e => setForm({ ...form, description: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Additional Info (Optional)</Label>
                    <Textarea 
                      rows={2}
                      value={form.additionalInfo} 
                      onChange={e => setForm({ ...form, additionalInfo: e.target.value })} 
                    />
                  </div>
                  <Button className="w-full" onClick={handleSave}>{editId ? "Save Changes" : "Submit Report"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card className="card-corporate">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Reports Yet</p>
              <p className="text-sm mt-2">Click "Add Report" to submit your first report</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-corporate">
            <CardHeader>
              <CardTitle>Report History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Date</th>
                      <th className="text-left p-4 text-sm font-medium">Department</th>
                      <th className="text-left p-4 text-sm font-medium">Task</th>
                      <th className="text-left p-4 text-sm font-medium">Status</th>
                      <th className="text-left p-4 text-sm font-medium">Description</th>
                      <th className="text-left p-4 text-sm font-medium">Additional Info</th>
                      <th className="text-left p-4 text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.map(report => (
                      <tr key={report.id} className="hover:bg-muted/30">
                        <td className="p-4 text-sm">
                          {new Date(report.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm">{report.department}</td>
                        <td className="p-4 text-sm font-medium">{report.task}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            report.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                          {report.description}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                          {report.additionalInfo || "-"}
                        </td>
                        <td className="p-4">
                          <Button size="sm" variant="outline" onClick={() => openEdit(report)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Modify
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeReports;
