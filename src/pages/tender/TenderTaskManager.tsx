import { useState, useEffect } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTenderTasks } from "@/hooks/useTenderData";
import { supabase } from "@/integrations/supabase/client";
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
  const [tenderUsers, setTenderUsers] = useState<{ username: string; role: string }[]>([]);

  useEffect(() => {
    const session = sessionStorage.getItem("tenderSession");
    if (session) setRole(JSON.parse(session).role);
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any).rpc("get_tender_users");
      if (error) console.error("get_tender_users failed:", error);
      setTenderUsers(((data as any[]) || []).filter(u => u?.username));
    })();
  }, []);

  const isHead = role === "tender_head";
  const username = (() => {
    const auth = sessionStorage.getItem("authUser");
    if (auth) return JSON.parse(auth).username || "";
    const tender = sessionStorage.getItem("tenderSession");
    return tender ? JSON.parse(tender).username || "" : "";
  })();
  const normalize = (value: string | null | undefined) => (value || "").trim().toLowerCase();
  const headUsernames = tenderUsers.filter(u => u.role === "tender_head").map(u => normalize(u.username));
  const assignableUsers = tenderUsers.filter(u => u.username !== username && (isHead ? u.role === "tender_executive" : u.role === "tender_head"));

  // Head: assigned by head; Exec: assigned to exec
  const assignedTasks = tasks.filter((t: any) => isHead
    ? normalize(t.assigned_by) === normalize(username)
    : normalize(t.assigned_to) === normalize(username) || headUsernames.includes(normalize(t.assigned_by))
  );
  // Head: current tasks from exec; Exec: own created tasks
  const currentTasks = tasks.filter((t: any) => isHead ? normalize(t.assigned_by) !== normalize(username) : normalize(t.assigned_by) === normalize(username));

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
          <TabsTrigger value="director-tasks">Director Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="director-tasks">
          <Card><CardContent className="pt-4"><DirectorTasksTab department="Tender" /></CardContent></Card>
        </TabsContent>

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
                      <TableCell>{format(new Date(task.created_at), "dd-MM-yyyy")}</TableCell>
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
                      <TableCell>{format(new Date(task.created_at), "dd-MM-yyyy")}</TableCell>
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
            <div>
              <Label>Employee Name *</Label>
              <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {assignableUsers.map(u => (
                    <SelectItem key={u.username} value={u.username}>{u.username} ({u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
