import { useState, useEffect } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData, CalendarEvent, Note, Organization } from "@/hooks/useDirectorData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Edit, Trash2, Building, Users, Package, StickyNote, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

const DirectorDashboard = () => {
  const { toast } = useToast();
  const {
    events, addEvent, updateEvent, deleteEvent,
    notes, addNote, updateNote, deleteNote,
    organizations, addOrganization, updateOrganization, deleteOrganization,
    employees,
    getTasksPerDay,
    getProductSalesPerYear,
  } = useDirectorData();

  // Calendar state
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState({ title: "", date: "", time: "", description: "" });

  // Notes state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // Organization state
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: "", type: "", ministry: "" });
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  // Event reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      events.forEach(event => {
        const eventTime = new Date(`${event.date}T${event.time}`);
        const diff = eventTime.getTime() - now.getTime();
        const tenMinutes = 10 * 60 * 1000;
        
        if (diff > 0 && diff <= tenMinutes) {
          toast({
            title: "Upcoming Event",
            description: `${event.title} starts in ${Math.ceil(diff / 60000)} minutes`,
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [events, toast]);

  // Event handlers
  const handleSaveEvent = () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (editingEvent) {
      updateEvent(editingEvent.id, eventForm);
      toast({ title: "Success", description: "Event updated" });
    } else {
      addEvent(eventForm);
      toast({ title: "Success", description: "Event created" });
    }
    setEventDialogOpen(false);
    setEventForm({ title: "", date: "", time: "", description: "" });
    setEditingEvent(null);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({ title: event.title, date: event.date, time: event.time, description: event.description || "" });
    setEventDialogOpen(true);
  };

  // Note handlers
  const handleSaveNote = () => {
    if (!noteForm.title || !noteForm.content) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (editingNote) {
      updateNote(editingNote.id, noteForm);
      toast({ title: "Success", description: "Note updated" });
    } else {
      addNote(noteForm);
      toast({ title: "Success", description: "Note created" });
    }
    setNoteDialogOpen(false);
    setNoteForm({ title: "", content: "" });
    setEditingNote(null);
  };

  // Organization handlers
  const handleSaveOrg = () => {
    if (!orgForm.name || !orgForm.type || !orgForm.ministry) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    addOrganization(orgForm);
    toast({ title: "Success", description: "Organization added" });
    setOrgDialogOpen(false);
    setOrgForm({ name: "", type: "", ministry: "" });
  };

  const handleStatusChange = (orgId: string, field: keyof Organization["status"]) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      updateOrganization(orgId, {
        status: { ...org.status, [field]: !org.status[field] }
      });
    }
  };

  const getOrgProgress = (status: Organization["status"]) => {
    const total = Object.keys(status).length;
    const completed = Object.values(status).filter(Boolean).length;
    return (completed / total) * 100;
  };

  const statusLabels: Record<keyof Organization["status"], string> = {
    proposalSubmitted: "Proposal Submitted",
    presentationDone: "Presentation Done",
    followup: "Followup",
    tender: "Tender",
    bidRaised: "Bid Raised",
    bidAwarded: "Bid Awarded",
    workOrder: "Work Order",
    deliveryInitiated: "Delivery Initiated",
    deliveryDone: "Delivery Done",
    paymentDone: "Payment Done",
  };

  const tasksData = getTasksPerDay();
  const salesData = getProductSalesPerYear();
  const recentNote = notes[0];
  const otherNotes = notes.slice(1);

  return (
    <DirectorLayout title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="card-corporate p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Calendar</h3>
            </div>
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
                  </div>
                  <Button onClick={handleSaveEvent} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No events scheduled</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date} at {event.time}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditEvent(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteEvent(event.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className="card-corporate p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Notes</h3>
            </div>
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNote ? "Edit Note" : "Add Note"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea rows={5} value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} />
                  </div>
                  <Button onClick={handleSaveNote} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {recentNote ? (
            <div className="p-3 bg-muted/50 rounded-lg mb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{recentNote.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{recentNote.content}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingNote(recentNote); setNoteForm({ title: recentNote.title, content: recentNote.content }); setNoteDialogOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteNote(recentNote.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
          )}
          {otherNotes.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {otherNotes.map(note => (
                <div key={note.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer" onClick={() => setViewingNote(note)}>
                  <p className="text-sm truncate">{note.title}</p>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Graph */}
        <div className="card-corporate p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Tasks Assigned per Day</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Organization List */}
        <div className="card-corporate p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Organizations</h3>
            </div>
            <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary">
                  <Plus className="h-4 w-4 mr-1" /> Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Organization Name</Label>
                    <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Input value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })} />
                  </div>
                  <div>
                    <Label>Ministry</Label>
                    <Input value={orgForm.ministry} onChange={(e) => setOrgForm({ ...orgForm, ministry: e.target.value })} />
                  </div>
                  <Button onClick={handleSaveOrg} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No organizations added yet</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {organizations.map(org => (
                <div key={org.id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-muted/30">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">{org.type} • {org.ministry}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <Progress value={getOrgProgress(org.status)} className="h-2" />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}>
                        {expandedOrg === org.id ? "Close" : "Modify"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteOrganization(org.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {expandedOrg === org.id && (
                    <div className="p-3 bg-background grid grid-cols-2 md:grid-cols-5 gap-3">
                      {(Object.keys(statusLabels) as (keyof Organization["status"])[]).map(key => (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={`${org.id}-${key}`}
                            checked={org.status[key]}
                            onCheckedChange={() => handleStatusChange(org.id, key)}
                          />
                          <Label htmlFor={`${org.id}-${key}`} className="text-xs cursor-pointer">{statusLabels[key]}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employee List */}
        <div className="card-corporate p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Employees</h3>
          </div>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No employees registered via HR Login</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">{emp.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.department}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Sales Graph */}
        <div className="card-corporate p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Product Sales by Year</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="sales" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* View Note Dialog */}
      <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingNote?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingNote?.content}</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => { if (viewingNote) { setEditingNote(viewingNote); setNoteForm({ title: viewingNote.title, content: viewingNote.content }); setViewingNote(null); setNoteDialogOpen(true); } }}>
              Edit
            </Button>
            <Button variant="destructive" onClick={() => { if (viewingNote) { deleteNote(viewingNote.id); setViewingNote(null); } }}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
};

export default DirectorDashboard;
