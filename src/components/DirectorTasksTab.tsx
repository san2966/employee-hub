import { useState } from "react";
import { useDirectorTasks, DirectorTask } from "@/hooks/useDirectorTasks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";
import { format } from "date-fns";

interface DirectorTasksTabProps {
  department: string;
}

const DirectorTasksTab = ({ department }: DirectorTasksTabProps) => {
  const { toast } = useToast();
  const { tasks, submitReport } = useDirectorTasks(department);
  const [updateTask, setUpdateTask] = useState<DirectorTask | null>(null);
  const [report, setReport] = useState("");

  const handleSubmit = async () => {
    if (!updateTask) return;
    if (report.trim().length < 20) {
      toast({ title: "Error", description: "Report must be at least 20 characters", variant: "destructive" });
      return;
    }
    try {
      await submitReport(updateTask.id, report);
      setReport("");
      setUpdateTask(null);
      toast({ title: "Success", description: "Report submitted, task completed" });
    } catch {
      toast({ title: "Error", description: "Failed to submit report", variant: "destructive" });
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

  const sorted = [...tasks].sort((a, b) => {
    const order: Record<string, number> = { Overdue: 0, Pending: 1, Completed: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Expected Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No tasks from Director
                </TableCell>
              </TableRow>
            ) : sorted.map((task) => (
              <TableRow key={task.id} className={task.status === "Overdue" ? "bg-red-50 dark:bg-red-950/20" : ""}>
                <TableCell className="text-sm">{format(new Date(task.created_at), "dd-MM-yyyy")}</TableCell>
                <TableCell className="max-w-xs">{task.task}</TableCell>
                <TableCell>{task.expected_days}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>
                  {task.status !== "Completed" ? (
                    <Button size="sm" variant="outline" onClick={() => { setUpdateTask(task); setReport(""); }}>
                      <Pencil className="h-4 w-4 mr-1" /> Update
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Done</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!updateTask} onOpenChange={() => setUpdateTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Report</DialogTitle></DialogHeader>
          {updateTask && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">{updateTask.task}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: {updateTask.expected_days} days from {format(new Date(updateTask.created_at), "dd-MM-yyyy")}
                </p>
              </div>
              <div>
                <Label>Report * (min 20 characters)</Label>
                <Textarea
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Enter your report..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">{report.length}/20 characters minimum</p>
              </div>
              <Button onClick={handleSubmit} className="w-full">Submit Report</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DirectorTasksTab;
