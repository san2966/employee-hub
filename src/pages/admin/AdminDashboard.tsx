import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar as CalendarIcon, FileText, ListTodo, Users, Bell } from "lucide-react";
import { format } from "date-fns";

const AdminDashboard = () => {
  const { 
    calendarEvents, 
    notes, 
    tasks, 
    visitors,
    addCalendarEvent, 
    deleteCalendarEvent,
    addNote,
    deleteNote 
  } = useAdminData();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", time: "" });
  const [noteContent, setNoteContent] = useState("");

  // Event reminder system
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      calendarEvents.forEach(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const diff = eventDateTime.getTime() - now.getTime();
        const tenMinutes = 10 * 60 * 1000;
        
        if (diff > 0 && diff <= tenMinutes) {
          toast({
            title: "Event Reminder",
            description: `"${event.title}" starts in ${Math.ceil(diff / 60000)} minutes!`,
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [calendarEvents, toast]);

  const handleAddEvent = () => {
    if (!eventForm.title || !eventForm.time || !selectedDate) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    addCalendarEvent({
      title: eventForm.title,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: eventForm.time,
    });
    setEventForm({ title: "", time: "" });
    setEventDialogOpen(false);
    toast({ title: "Event Added", description: "Calendar event created successfully" });
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) {
      toast({ title: "Error", description: "Note cannot be empty", variant: "destructive" });
      return;
    }
    addNote(noteContent);
    setNoteContent("");
    setNoteDialogOpen(false);
    toast({ title: "Note Added", description: "Note created successfully" });
  };

  const todayEvents = calendarEvents.filter(
    e => e.date === format(new Date(), "yyyy-MM-dd")
  );

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const recentTasks = [...tasks].slice(-5).reverse();
  const recentVisitors = [...visitors].slice(-5).reverse();

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendar
            </CardTitle>
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Calendar Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Event Title</Label>
                    <Input
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      placeholder="Enter event title"
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Date: {selectedDate ? format(selectedDate, "dd-MM-yyyy") : "Select a date"}</Label>
                  </div>
                  <Button onClick={handleAddEvent} className="w-full">Save Event</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            {todayEvents.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Today's Events</h4>
                <div className="space-y-2">
                  {todayEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>{event.time} - {event.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCalendarEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes
            </CardTitle>
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter your note..."
                    rows={4}
                  />
                  <Button onClick={handleAddNote} className="w-full">Save Note</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {sortedNotes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No notes yet</p>
            ) : (
              <>
                {/* Most Recent Note */}
                <div className="p-4 bg-primary/5 rounded-lg border mb-4">
                  <div className="flex justify-between items-start">
                    <p className="text-sm">{sortedNotes[0].content}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNote(sortedNotes[0].id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(sortedNotes[0].createdAt), "dd-MM-yyyy hh:mm a")}
                  </p>
                </div>
                {/* Older Notes */}
                {sortedNotes.length > 1 && (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {sortedNotes.slice(1).map(note => (
                        <div key={note.id} className="p-3 bg-muted rounded flex justify-between items-start">
                          <div>
                            <p className="text-sm line-clamp-2">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(note.createdAt), "dd-MM-yyyy hh:mm a")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tasks assigned yet</p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map(task => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{task.subject}</h4>
                        <p className="text-sm text-muted-foreground">{task.employeeName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === "completed" 
                          ? "bg-success/10 text-success" 
                          : "bg-warning/10 text-warning"
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visitors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentVisitors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No visitors yet</p>
            ) : (
              <div className="space-y-3">
                {recentVisitors.map(visitor => (
                  <div key={visitor.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{visitor.name}</h4>
                        <p className="text-sm text-muted-foreground">{visitor.organization}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(visitor.checkInTime), "dd-MM-yyyy hh:mm a")}
                      </span>
                    </div>
                    <p className="text-sm mt-1">Meeting: {visitor.whomToMeet}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
