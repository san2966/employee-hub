import { useState, useEffect } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTenderTasks } from "@/hooks/useTenderData";
import { format } from "date-fns";
import DirectorTasksTab from "@/components/DirectorTasksTab";

const TenderTaskManager = () => {
  const { data: tasks, add, update } = useTenderTasks();
  const [role, setRole] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [form, setForm] = useState({ assigned_to: "", task_title: "", description: "" });
  const [report, setReport] = useState("");

  useEffect(() => {
    const session = sessionStorage.getItem("tenderSession");
    if (session) setRole(JSON.parse(session).role);
  }, []);

  const isHead = role === "tender_head";
  const username = (() => { const s = sessionStorage.getItem("authUser"); return s ? JSON.parse(s).username : ""; })();

  // Head: assigned by head; Exec: assigned to exec
  const assignedTasks = tasks.filter((t: any) => isHead ? t.assigned_by === username : t.assigned_to === username);
  // Head: current tasks from exec; Exec: own created tasks
  const currentTasks = tasks.filter((t: any) => isHead ? t.assigned_by !== username : t.assigned_by === username);

  const handleAssign = async () => {
    if (!form.assigned_to.trim() || !form.task_title.trim() || !form.description.trim()) return;
    await add({ ...form, assigned_by: username, status: "pending" } as any);
    setForm({ assigned_to: "", task_title: "", description: "" });
    setAssignOpen(false);
  };

  const handleReport = async () => {
    if (!selectedTask || !report.trim()) return;
    await update(selectedTask, { report, status: "completed" } as any);
    setReport("");
    setSelectedTask(null);
    setReportOpen(false);
  };

  return (
    <TenderLayout title="Task Manager">
      <Tabs defaultValue={isHead ? "assign" : "assigned"}>
        <TabsList>
          <TabsTrigger value={isHead ? "assign" : "assigned"}>
            {isHead ? "Assign Task" : "Assigned Tasks"}
          </TabsTrigger>
          <TabsTrigger value={isHead ? "current" : "your"}>
            {isHead ? "Current Tasks" : "Your Tasks"}
          </TabsTrigger>
        </TabsList>

        {/* Assign/Assigned Tab */}
        <TabsContent value={isHead ? "assign" : "assigned"}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{isHead ? "Assigned Tasks" : "Tasks Assigned to You"}</CardTitle>
              {isHead && <Button onClick={() => setAssignOpen(true)}>Assign Task</Button>}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedTasks.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No tasks found</TableCell></TableRow>
                  ) : assignedTasks.map((task: any, idx: number) => (
                    <TableRow key={task.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{format(new Date(task.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{isHead ? task.assigned_to : task.assigned_by}</TableCell>
                      <TableCell>{task.task_title}</TableCell>
                      <TableCell>
                        <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                          {task.status === "completed" ? "Completed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!isHead && task.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => { setSelectedTask(task.id); setReportOpen(true); }}>
                            Update
                          </Button>
                        )}
                        {task.report && <span className="text-xs text-muted-foreground ml-2">Report: {task.report}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current/Your Tab */}
        <TabsContent value={isHead ? "current" : "your"}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{isHead ? "Current Tasks (from Executive)" : "Your Tasks"}</CardTitle>
              {!isHead && <Button onClick={() => setAssignOpen(true)}>Add Task</Button>}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTasks.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No tasks found</TableCell></TableRow>
                  ) : currentTasks.map((task: any, idx: number) => (
                    <TableRow key={task.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{format(new Date(task.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{task.assigned_to}</TableCell>
                      <TableCell>{task.task_title}</TableCell>
                      <TableCell>
                        <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                          {task.status === "completed" ? "Completed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!isHead && task.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => { setSelectedTask(task.id); setReportOpen(true); }}>
                            Update
                          </Button>
                        )}
                        {task.report && <span className="text-xs text-muted-foreground ml-2">Report: {task.report}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Task Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isHead ? "Assign Task" : "Add Task"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Employee Name *</Label><Input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} /></div>
            <div><Label>Task *</Label><Input value={form.task_title} onChange={e => setForm({ ...form, task_title: e.target.value })} /></div>
            <div><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <Button onClick={handleAssign} className="w-full">{isHead ? "Assign" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Report</Label><Textarea value={report} onChange={e => setReport(e.target.value)} placeholder="Enter your report..." /></div>
            <Button onClick={handleReport} className="w-full">Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TenderLayout>
  );
};

export default TenderTaskManager;
