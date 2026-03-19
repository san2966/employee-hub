import { useState } from "react";
import PurchaseLayout from "@/components/purchase/PurchaseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { usePurchaseTasks } from "@/hooks/usePurchaseData";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import DirectorTasksTab from "@/components/DirectorTasksTab";

const PurchaseTaskManager = () => {
  const { data: tasks, add, update } = usePurchaseTasks();
  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [report, setReport] = useState("");

  const handleAdd = async () => {
    if (!form.name.trim() || !form.description.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await add({ ...form, created_by: user?.id });
    setForm({ name: "", description: "" });
    setAddOpen(false);
  };

  const handleComplete = async () => {
    if (!selectedTask) return;
    await update(selectedTask.id, { status: "Completed", report });
    setReport("");
    setUpdateOpen(false);
    setSelectedTask(null);
  };

  return (
    <PurchaseLayout title="Task Manager">
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="director-tasks">Director Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="director-tasks">
          <Card><CardContent className="pt-4"><DirectorTasksTab department="Purchase" /></CardContent></Card>
        </TabsContent>
        <TabsContent value="tasks">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tasks</span>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Task</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Task Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Task name" /></div>
                  <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" /></div>
                  <Button onClick={handleAdd} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No tasks yet</TableCell></TableRow>
                ) : tasks.map((task: any) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell className="max-w-48 truncate">{task.description}</TableCell>
                    <TableCell className="text-xs">{task.created_at ? format(new Date(task.created_at), "PPp") : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={task.status === "Completed" ? "default" : "secondary"}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-32 truncate">{task.report || "-"}</TableCell>
                    <TableCell>
                      {task.status !== "Completed" && (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedTask(task); setReport(""); setUpdateOpen(true); }}>
                          Update
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Task: {selectedTask?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Report</Label><Textarea value={report} onChange={e => setReport(e.target.value)} placeholder="Enter report details" /></div>
            <Button onClick={handleComplete} className="w-full">Complete Task</Button>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>
    </PurchaseLayout>
  );
};

export default PurchaseTaskManager;
