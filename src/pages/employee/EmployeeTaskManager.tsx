import { useState } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ListTodo } from "lucide-react";

const EmployeeTaskManager = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  const employeeName = session.employeeName || "";
  const { getAssignedTasks, completeAssignedTask } = useEmployeeData(employeeId);
  const { toast } = useToast();
  const assignedTasks = getAssignedTasks();

  const [dialog, setDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState("");

  const openUpdate = (id: string) => { setSelectedId(id); setReport(""); setDialog(true); };

  const submitReport = async () => {
    if (!selectedId || !report.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please fill the report" });
      return;
    }
    await completeAssignedTask(selectedId, report);
    toast({ title: "Report submitted, task completed" });
    setDialog(false); setSelectedId(null); setReport("");
  };

  return (
    <EmployeeLayout title="Director Tasks">
      <Card className="card-corporate">
        <CardHeader><CardTitle>Tasks from Director</CardTitle></CardHeader>
        <CardContent>
          {assignedTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Director Tasks</p>
              <p className="text-sm mt-2">Tasks assigned by Director will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Employee</th>
                    <th className="text-left p-4 text-sm font-medium">Date</th>
                    <th className="text-left p-4 text-sm font-medium">Title</th>
                    <th className="text-left p-4 text-sm font-medium">Description</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                    <th className="text-left p-4 text-sm font-medium">Report</th>
                    <th className="text-left p-4 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignedTasks.map(t => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="p-4 text-sm">{employeeName}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium">{t.subject}</td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs">{t.description}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          t.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}>{t.status === "completed" ? "Completed" : "In Progress"}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs">{(t as any).report || "-"}</td>
                      <td className="p-4">
                        {t.status !== "completed" && (
                          <Button variant="outline" size="sm" onClick={() => openUpdate(t.id)}>Update</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report *</Label>
              <Textarea rows={5} placeholder="Write your completion report..." value={report} onChange={e => setReport(e.target.value)} />
            </div>
            <Button className="w-full" onClick={submitReport}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  );
};

export default EmployeeTaskManager;
