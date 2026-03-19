import { useState } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorTasks, DirectorTask } from "@/hooks/useDirectorTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";

const DEPARTMENTS = ["Admin", "HR", "Tender", "Operations", "Purchase", "IT", "Accounts"];

const DirectorDepartmentTasks = () => {
  const { toast } = useToast();
  const { tasks, addTask, deleteTask } = useDirectorTasks();
  const [addOpen, setAddOpen] = useState(false);
  const [previewTask, setPreviewTask] = useState<DirectorTask | null>(null);
  const [form, setForm] = useState({ department: "", task: "", expected_days: 7 });

  const handleAdd = async () => {
    if (!form.department || !form.task.trim()) {
      toast({ title: "Error", description: "Department and task are required", variant: "destructive" });
      return;
    }
    if (form.expected_days < 1 || form.expected_days > 365) {
      toast({ title: "Error", description: "Expected days must be 1-365", variant: "destructive" });
      return;
    }
    try {
      await addTask(form);
      setForm({ department: "", task: "", expected_days: 7 });
      setAddOpen(false);
      toast({ title: "Success", description: "Task assigned to department" });
    } catch {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast({ title: "Task deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">🟢 Completed</Badge>;
      case "Overdue":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">🔴 Overdue</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">🟡 Pending</Badge>;
    }
  };

  // Sort: overdue first, then pending, then completed
  const sorted = [...tasks].sort((a, b) => {
    const order: Record<string, number> = { Overdue: 0, Pending: 1, Completed: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  return (
    <DirectorLayout title="Department Tasks">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Department Tasks</h2>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
        </div>

        <div className="card-corporate overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Expected Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No department tasks yet
                    </TableCell>
                  </TableRow>
                ) : sorted.map((task) => (
                  <TableRow key={task.id} className={task.status === "Overdue" ? "bg-red-50 dark:bg-red-950/20" : ""}>
                    <TableCell className="text-sm">
                      {format(new Date(task.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.department}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{task.task}</TableCell>
                    <TableCell>{task.expected_days}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPreviewTask(task)} title="Preview">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(task.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Department Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Task *</Label>
              <Textarea
                value={form.task}
                onChange={(e) => setForm({ ...form, task: e.target.value })}
                placeholder="Describe the task..."
                rows={4}
              />
            </div>
            <div>
              <Label>Expected Days (1-365)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.expected_days}
                onChange={(e) => setForm({ ...form, expected_days: parseInt(e.target.value) || 7 })}
              />
            </div>
            <Button onClick={handleAdd} className="w-full">Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTask} onOpenChange={() => setPreviewTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Task Preview</DialogTitle></DialogHeader>
          {previewTask && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Department</span>
                <Badge variant="outline">{previewTask.department}</Badge>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Task</span>
                <p className="mt-1">{previewTask.task}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expected Days</span>
                <span>{previewTask.expected_days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(previewTask.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{format(new Date(previewTask.created_at), "PPp")}</span>
              </div>
              {previewTask.completed_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm">{format(new Date(previewTask.completed_at), "PPp")}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Report</span>
                <p className="mt-1 p-3 bg-muted rounded-md text-sm">
                  {previewTask.report || "No report submitted yet"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
};

export default DirectorDepartmentTasks;
