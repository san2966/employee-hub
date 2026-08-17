import { useState } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData, Task } from "@/hooks/useDirectorData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ExportButtons } from "@/components/ExportButtons";
import { EXPORT_COLUMNS } from "@/lib/exportUtils";
import { formatDate } from "@/lib/dateFormat";

const TaskManager = () => {
  const { toast } = useToast();
  const { employees, tasks, addTask, updateTask, deleteTask } = useDirectorData();
  
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({ subject: "", description: "" });

  const getEmployeeTasks = (employeeId: string) => {
    return tasks.filter(t => t.employeeId === employeeId && !t.hiddenInManager);
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed": return "bg-success";
      case "in-progress": return "bg-warning";
      case "failed": return "bg-destructive";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-success" />;
      case "in-progress": return <Clock className="h-4 w-4 text-warning" />;
      case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const calculateProgress = (employeeId: string) => {
    const empTasks = getEmployeeTasks(employeeId);
    if (empTasks.length === 0) return 0;
    const completed = empTasks.filter(t => t.status === "completed").length;
    return (completed / empTasks.length) * 100;
  };

  const handleOpenAddTask = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setEditingTask(null);
    setTaskForm({ subject: "", description: "" });
    setTaskDialogOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setSelectedEmployee(task.employeeId);
    setEditingTask(task);
    setTaskForm({ subject: task.subject, description: task.description });
    setTaskDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskForm.subject || !taskForm.description) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (editingTask) {
      updateTask(editingTask.id, taskForm);
      toast({ title: "Success", description: "Task updated" });
    } else if (selectedEmployee) {
      addTask({ ...taskForm, employeeId: selectedEmployee });
      toast({ title: "Success", description: "Task assigned" });
    }

    setTaskDialogOpen(false);
    setTaskForm({ subject: "", description: "" });
    setSelectedEmployee(null);
    setEditingTask(null);
  };

  // Prepare export data
  const allTasksWithEmployeeInfo = tasks.map(task => {
    const emp = employees.find(e => e.id === task.employeeId);
    return {
      ...task,
      employeeName: emp?.name || "Unknown",
    };
  });

  return (
    <DirectorLayout title="Task Manager">
      <div className="space-y-4">
        {/* Export buttons */}
        <div className="flex justify-end">
          <ExportButtons
            portal="Director"
            type="Tasks"
            columns={EXPORT_COLUMNS.tasks}
            data={allTasksWithEmployeeInfo}
          />
        </div>

        {employees.length === 0 ? (
          <div className="card-corporate p-12 text-center">
            <p className="text-muted-foreground">No employees registered via HR Login</p>
            <p className="text-sm text-muted-foreground mt-2">
              Employees will appear here once they are added through the HR portal
            </p>
          </div>
        ) : (
          employees.map(employee => {
            const empTasks = getEmployeeTasks(employee.id);
            const progress = calculateProgress(employee.id);

            return (
              <div key={employee.id} className="card-corporate overflow-hidden">
                {/* Employee Header */}
                <div className="p-4 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">{employee.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.designation} • {employee.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 md:w-48">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                        {empTasks.length > 0 && (
                          <>
                            <div 
                              className="bg-success h-full transition-all"
                              style={{ width: `${(empTasks.filter(t => t.status === "completed").length / empTasks.length) * 100}%` }}
                            />
                            <div 
                              className="bg-warning h-full transition-all"
                              style={{ width: `${(empTasks.filter(t => t.status === "in-progress").length / empTasks.length) * 100}%` }}
                            />
                            <div 
                              className="bg-destructive h-full transition-all"
                              style={{ width: `${(empTasks.filter(t => t.status === "failed").length / empTasks.length) * 100}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                    <Button size="sm" className="gradient-primary" onClick={() => handleOpenAddTask(employee.id)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Task
                    </Button>
                  </div>
                </div>

                {/* Tasks List */}
                {empTasks.length > 0 && (
                  <div className="divide-y">
                    {empTasks.map(task => (
                      <div key={task.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(task.status)}
                          <div>
                            <p className="font-medium text-sm">{task.subject}</p>
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created: {formatDate(task.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            task.status === "completed" ? "bg-success/10 text-success" :
                            task.status === "in-progress" ? "bg-warning/10 text-warning" :
                            "bg-destructive/10 text-destructive"
                          }`}>
                            {task.status.replace("-", " ")}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditTask(task)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input 
                value={taskForm.subject} 
                onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })} 
                placeholder="Task subject"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={taskForm.description} 
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} 
                placeholder="Task description"
                rows={4}
              />
            </div>
            <Button onClick={handleSaveTask} className="w-full">
              {editingTask ? "Update Task" : "Assign Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
};

export default TaskManager;
