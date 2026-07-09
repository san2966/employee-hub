import { useState } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Plus, Clock } from "lucide-react";

const EmployeeDailyTasks = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  const { personalTasks, addPersonalTask, updatePersonalTask, deletePersonalTask } = useEmployeeData(employeeId);
  const { toast } = useToast();

  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "" });

  const handleAdd = async () => {
    if (!form.subject || !form.description) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }
    try {
      await addPersonalTask(form);
      toast({ title: "Daily task created" });
      setDialog(false);
      setForm({ subject: "", description: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleComplete = async (id: string) => {
    await updatePersonalTask(id, { status: "completed" });
    toast({ title: "Task marked complete" });
  };

  return (
    <EmployeeLayout title="Daily Task">
      <Card className="card-corporate">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Daily Tasks</CardTitle>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Daily Task</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Task *</Label>
                  <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <Button className="w-full" onClick={handleAdd}>Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {personalTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Daily Tasks</p>
              <p className="text-sm mt-2">Create your own tasks to track daily work</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Date</th>
                    <th className="text-left p-4 text-sm font-medium">Task</th>
                    <th className="text-left p-4 text-sm font-medium">Description</th>
                    <th className="text-left p-4 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {personalTasks.map(t => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="p-4 text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium">{t.subject}</td>
                      <td className="p-4 text-sm text-muted-foreground max-w-md">{t.description}</td>
                      <td className="p-4">
                        {t.status !== "completed" ? (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleComplete(t.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-1" />Complete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={async () => { await deletePersonalTask(t.id); toast({ title: "Task deleted" }); }}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-success/10 text-success">Completed</span>
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
    </EmployeeLayout>
  );
};

export default EmployeeDailyTasks;