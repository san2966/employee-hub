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
import { CheckCircle2, Plus, ListTodo, Clock } from "lucide-react";

const EmployeeTaskManager = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  const employeeName = session.employeeName || "";
  
  const { 
    personalTasks, addPersonalTask, updatePersonalTask, deletePersonalTask,
    getAssignedTasks, completeAssignedTask,
  } = useEmployeeData(employeeId);
  
  const { toast } = useToast();
  
  const [taskDialog, setTaskDialog] = useState(false);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ subject: "", description: "" });
  const [updateForm, setUpdateForm] = useState({ subject: "", description: "" });
  
  const assignedTasks = getAssignedTasks();
  
  const handleAddTask = () => {
    if (!taskForm.subject || !taskForm.description) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }
    
    addPersonalTask(taskForm);
    toast({ title: "Personal task created" });
    setTaskDialog(false);
    setTaskForm({ subject: "", description: "" });
  };
  
  const handleUpdateAssignedTask = () => {
    if (!selectedTask || !updateForm.subject || !updateForm.description) return;
    
    completeAssignedTask(selectedTask);
    toast({ title: "Task updated and marked as completed" });
    setUpdateDialog(false);
    setSelectedTask(null);
    setUpdateForm({ subject: "", description: "" });
  };
  
  const openUpdateDialog = (task: typeof assignedTasks[0]) => {
    setSelectedTask(task.id);
    setUpdateForm({ subject: task.subject, description: task.description });
    setUpdateDialog(true);
  };

  return (
    <EmployeeLayout title="Task Manager">
      <div className="space-y-6">
        <Tabs defaultValue="assigned" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Assigned Tasks ({assignedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Personal Tasks ({personalTasks.length})
            </TabsTrigger>
          </TabsList>

          {/* Assigned Tasks */}
          <TabsContent value="assigned">
            <Card className="card-corporate">
              <CardHeader>
                <CardTitle>Tasks from Director</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Assigned Tasks</p>
                    <p className="text-sm mt-2">Tasks assigned by Director will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignedTasks.map(task => (
                      <div key={task.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{task.subject}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                task.status === "completed" ? "bg-success/10 text-success" :
                                task.status === "in-progress" ? "bg-warning/10 text-warning" :
                                "bg-destructive/10 text-destructive"
                              }`}>
                                {task.status.replace("-", " ")}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm">{task.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Assigned: {new Date(task.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {task.status !== "completed" && (
                            <div className="flex gap-2">
                              <Dialog open={updateDialog && selectedTask === task.id} onOpenChange={open => { if (!open) setUpdateDialog(false); }}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => openUpdateDialog(task)}>
                                    Update
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Update Task</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Subject</Label>
                                      <Input 
                                        value={updateForm.subject} 
                                        onChange={e => setUpdateForm({ ...updateForm, subject: e.target.value })} 
                                      />
                                    </div>
                                    <div>
                                      <Label>Description</Label>
                                      <Textarea 
                                        rows={4}
                                        value={updateForm.description} 
                                        onChange={e => setUpdateForm({ ...updateForm, description: e.target.value })} 
                                      />
                                    </div>
                                    <Button className="w-full" onClick={handleUpdateAssignedTask}>
                                      Save & Mark Completed
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal Tasks */}
          <TabsContent value="personal">
            <Card className="card-corporate">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Personal Tasks</CardTitle>
                <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Personal Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Task Name</Label>
                        <Input 
                          value={taskForm.subject} 
                          onChange={e => setTaskForm({ ...taskForm, subject: e.target.value })} 
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          rows={4}
                          value={taskForm.description} 
                          onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} 
                        />
                      </div>
                      <Button className="w-full" onClick={handleAddTask}>Create Task</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {personalTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Personal Tasks</p>
                    <p className="text-sm mt-2">Create your own tasks to track personal work</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {personalTasks.map(task => (
                      <div key={task.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{task.subject}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                task.status === "completed" ? "bg-success/10 text-success" :
                                "bg-warning/10 text-warning"
                              }`}>
                                {task.status.replace("-", " ")}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm">{task.description}</p>
                          </div>
                          <div className="flex gap-2">
                            {task.status !== "completed" && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => { 
                                  updatePersonalTask(task.id, { status: "completed" }); 
                                  toast({ title: "Task completed" }); 
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => { 
                                deletePersonalTask(task.id); 
                                toast({ title: "Task deleted" }); 
                              }}
                              className="text-destructive"
                            >
                              Delete
                            </Button>
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

export default EmployeeTaskManager;
