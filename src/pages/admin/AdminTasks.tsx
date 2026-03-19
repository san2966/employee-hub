import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import DirectorTasksTab from "@/components/DirectorTasksTab";

const AdminTasks = () => {
  const { tasks, employees, addTask, updateTaskStatus, deleteTask } = useAdminData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    subject: "",
    description: "",
  });

  // Also get HR employees
  const hrEmployees = JSON.parse(localStorage.getItem("hr_employees") || "[]");
  const allEmployees = [
    ...employees.map(e => ({ id: e.id, name: e.name })),
    ...hrEmployees.map((e: any) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })),
  ];

  const handleSubmit = () => {
    if (!form.employeeId || !form.subject || !form.description) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const employee = allEmployees.find(e => e.id === form.employeeId);
    
    addTask({
      employeeId: form.employeeId,
      employeeName: employee?.name || "Unknown",
      subject: form.subject,
      description: form.description,
    });

    setForm({ employeeId: "", subject: "", description: "" });
    setDialogOpen(false);
    toast({ title: "Success", description: "Task assigned successfully" });
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed");

  return (
    <AdminLayout title="Tasks">
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="director-tasks">Director Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="director-tasks">
          <Card><CardContent className="pt-4"><DirectorTasksTab department="Admin" /></CardContent></Card>
        </TabsContent>
        <TabsContent value="tasks">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Task Management</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Employee *</Label>
                  <Select
                    value={form.employeeId}
                    onValueChange={(value) => setForm({ ...form, employeeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {allEmployees.length === 0 ? (
                        <SelectItem value="none" disabled>No employees available</SelectItem>
                      ) : (
                        allEmployees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Enter task subject"
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter task description"
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">Assign Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Tasks */}
        <div>
          <h3 className="text-md font-medium mb-4">Pending Tasks ({pendingTasks.length})</h3>
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending tasks
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingTasks.map(task => (
                <Card key={task.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{task.subject}</h4>
                        <p className="text-sm text-muted-foreground">{task.employeeName}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-warning/10 text-warning">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm mb-3">{task.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.createdAt), "PPp")}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateTaskStatus(task.id, "completed");
                            toast({ title: "Task marked as completed" });
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        <div>
          <h3 className="text-md font-medium mb-4">Completed Tasks ({completedTasks.length})</h3>
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No completed tasks
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedTasks.map(task => (
                <Card key={task.id} className="opacity-75">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{task.subject}</h4>
                        <p className="text-sm text-muted-foreground">{task.employeeName}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-success/10 text-success">
                        Completed
                      </span>
                    </div>
                    <p className="text-sm mb-3">{task.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.createdAt), "PPp")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminTasks;
