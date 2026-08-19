import { useState, useEffect } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  Bell,
  Clock,
  Edit
} from "lucide-react";
import { formatDate } from "@/lib/dateFormat";
import EmployeeNotifications from "@/components/employee/EmployeeNotifications";
import { KpiCard } from "@/components/dashboard/KpiCard";

const EmployeeDashboard = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  
  const { 
    events, addEvent, updateEvent, deleteEvent,
    notes, addNote, deleteNote,
    getAssignedTasks, completeAssignedTask,
    getNotices,
    personalTasks, reports, leaveRequests,
  } = useEmployeeData(employeeId);
  
  const { toast } = useToast();
  
  // Event states
  const [eventDialog, setEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({ title: "", date: "", time: "", description: "" });
  
  // Note states
  const [noteDialog, setNoteDialog] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  
  // Data
  const assignedTasks = getAssignedTasks();
  const notices = getNotices();
  
  // Check for new notices
  const [newNoticeCount, setNewNoticeCount] = useState(0);
  
  useEffect(() => {
    const lastSeenNotices = localStorage.getItem(`employee_${employeeId}_last_seen_notices`) || "0";
    const unseenNotices = notices.filter(n => new Date(n.createdAt) > new Date(lastSeenNotices));
    setNewNoticeCount(unseenNotices.length);
    
    if (unseenNotices.length > 0) {
      toast({
        title: "New Notices",
        description: `You have ${unseenNotices.length} new notice(s) or announcement(s)`,
      });
      localStorage.setItem(`employee_${employeeId}_last_seen_notices`, new Date().toISOString());
    }
  }, [notices.length]);
  
  // Event notification system
  useEffect(() => {
    const checkUpcomingEvents = () => {
      const now = new Date();
      events.forEach(event => {
        const eventTime = new Date(`${event.date}T${event.time}`);
        const diff = eventTime.getTime() - now.getTime();
        const tenMinutes = 10 * 60 * 1000;
        
        if (diff > 0 && diff <= tenMinutes) {
          toast({
            title: "Upcoming Event",
            description: `${event.title} starts in 10 minutes!`,
          });
        }
      });
    };
    
    const interval = setInterval(checkUpcomingEvents, 60000);
    return () => clearInterval(interval);
  }, [events, toast]);
  
  // Event handlers
  const handleSaveEvent = () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      toast({ variant: "destructive", title: "Error", description: "Please fill required fields" });
      return;
    }
    
    if (editingEvent) {
      updateEvent(editingEvent, eventForm);
      toast({ title: "Event updated" });
    } else {
      addEvent(eventForm);
      toast({ title: "Event created" });
    }
    
    setEventDialog(false);
    setEditingEvent(null);
    setEventForm({ title: "", date: "", time: "", description: "" });
  };
  
  const handleEditEvent = (event: typeof events[0]) => {
    setEventForm({ title: event.title, date: event.date, time: event.time, description: event.description || "" });
    setEditingEvent(event.id);
    setEventDialog(true);
  };
  
  // Note handlers
  const handleSaveNote = () => {
    if (!noteForm.title || !noteForm.content) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }
    
    addNote(noteForm);
    toast({ title: "Note created" });
    setNoteDialog(false);
    setNoteForm({ title: "", content: "" });
  };
  
  // Task handlers
  const handleCompleteTask = (taskId: string) => {
    completeAssignedTask(taskId);
    toast({ title: "Task marked as completed" });
  };

  return (
    <EmployeeLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Daily Tasks Today"
          value={personalTasks.filter((t: any) => (t.createdAt || "").slice(0, 10) === new Date().toISOString().slice(0, 10)).length}
          sub="created today"
          icon={CheckCircle2}
          tone="primary"
        />
        <KpiCard
          label="Pending Assigned Tasks"
          value={assignedTasks.filter((t: any) => t.status !== "completed").length}
          sub="awaiting completion"
          icon={Clock}
          tone="warning"
        />
        <KpiCard
          label="EOD Reports"
          value={reports.length}
          sub="submitted overall"
          icon={FileText}
          tone="success"
        />
        <KpiCard
          label="Notices"
          value={notices.length}
          sub={newNoticeCount > 0 ? `${newNoticeCount} new` : "all read"}
          icon={Bell}
          tone="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmployeeNotifications
          employeeId={employeeId}
          dailyTasks={personalTasks as any}
          reports={reports as any}
          assignedTasks={assignedTasks as any}
          notices={notices as any}
          leaveRequests={leaveRequests as any}
          events={events as any}
        />

        {/* Calendar Section */}
        <Card className="card-corporate">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Calendar
            </CardTitle>
            <Dialog open={eventDialog} onOpenChange={setEventDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setEditingEvent(null); setEventForm({ title: "", date: "", time: "", description: "" }); }}>
                  <Plus className="h-4 w-4 mr-1" /> Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEvent ? "Edit Event" : "New Event"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title *</Label>
                    <Input 
                      value={eventForm.title} 
                      onChange={e => setEventForm({ ...eventForm, title: e.target.value })} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Input 
                        type="date" 
                        value={eventForm.date} 
                        onChange={e => setEventForm({ ...eventForm, date: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label>Time *</Label>
                      <Input 
                        type="time" 
                        value={eventForm.time} 
                        onChange={e => setEventForm({ ...eventForm, time: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      value={eventForm.description} 
                      onChange={e => setEventForm({ ...eventForm, description: e.target.value })} 
                    />
                  </div>
                  <Button className="w-full" onClick={handleSaveEvent}>
                    {editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No events scheduled</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {events.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(event.date)} at {event.time}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditEvent(event)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { deleteEvent(event.id); toast({ title: "Event deleted" }); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="card-corporate">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes
            </CardTitle>
            <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input 
                      value={noteForm.title} 
                      onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea 
                      rows={4}
                      value={noteForm.content} 
                      onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} 
                    />
                  </div>
                  <Button className="w-full" onClick={handleSaveNote}>Create Note</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Most recent note - larger */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{notes[0].title}</h4>
                    <Button variant="ghost" size="icon" onClick={() => { deleteNote(notes[0].id); toast({ title: "Note deleted" }); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{notes[0].content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notes[0].createdAt).toLocaleString()}
                  </p>
                </div>
                
                {/* Other notes */}
                {notes.length > 1 && (
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-2">
                      {notes.slice(1).map(note => (
                        <div key={note.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium text-sm">{note.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{note.content}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => { deleteNote(note.id); toast({ title: "Note deleted" }); }}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card className="card-corporate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Assigned Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No tasks assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Latest task - larger */}
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{assignedTasks[assignedTasks.length - 1].subject}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        assignedTasks[assignedTasks.length - 1].status === "completed" ? "bg-success/10 text-success" :
                        assignedTasks[assignedTasks.length - 1].status === "in-progress" ? "bg-warning/10 text-warning" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {assignedTasks[assignedTasks.length - 1].status}
                      </span>
                    </div>
                    {assignedTasks[assignedTasks.length - 1].status !== "completed" && (
                      <Button size="sm" onClick={() => handleCompleteTask(assignedTasks[assignedTasks.length - 1].id)}>
                        Complete
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{assignedTasks[assignedTasks.length - 1].description}</p>
                </div>
                
                {/* Other tasks */}
                {assignedTasks.length > 1 && (
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-2">
                      {assignedTasks.slice(0, -1).reverse().map(task => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium text-sm">{task.subject}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              task.status === "completed" ? "bg-success/10 text-success" :
                              task.status === "in-progress" ? "bg-warning/10 text-warning" :
                              "bg-destructive/10 text-destructive"
                            }`}>
                              {task.status}
                            </span>
                          </div>
                          {task.status !== "completed" && (
                            <Button size="sm" variant="outline" onClick={() => handleCompleteTask(task.id)}>
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notices Section */}
        <Card className="card-corporate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notices & Announcements
              {newNoticeCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {newNoticeCount} new
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No notices yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {notices.map(notice => (
                    <div key={notice.id} className={`p-3 rounded-lg border ${
                      notice.type === "announcement" ? "bg-primary/10 border-primary/20" : "bg-muted/50"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                          notice.type === "announcement" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {notice.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notice.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-semibold">{notice.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{notice.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
