import { useState, useEffect } from "react";
import OperationsLayout from "@/components/operations/OperationsLayout";
import { useOperationsData } from "@/hooks/useOperationsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Bell, StickyNote, BarChart3, Trash2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const OperationsDashboard = () => {
  const { toast } = useToast();
  const { proposals, inwards, reminders, notes, events } = useOperationsData();

  // Calendar
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", event_date: "", event_time: "", description: "" });

  // Reminders
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: "", date_time: "" });

  // Notes
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [viewingNote, setViewingNote] = useState<any>(null);

  // Reminder notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      reminders.data.forEach((r: any) => {
        if (!r.notified && new Date(r.date_time) <= now) {
          toast({ title: "Reminder", description: r.title });
          reminders.update(r.id, { notified: true });
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [reminders.data]);

  // Charts data
  const proposalChartData = (() => {
    const months: Record<string, number> = {};
    proposals.data.forEach((p: any) => {
      const m = new Date(p.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count })).slice(-12);
  })();

  const inwardChartData = (() => {
    const months: Record<string, number> = {};
    inwards.data.forEach((i: any) => {
      const m = new Date(i.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count })).slice(-12);
  })();

  const handleAddEvent = async () => {
    if (!eventForm.title || !eventForm.event_date) return;
    await events.add(eventForm);
    setEventDialogOpen(false);
    setEventForm({ title: "", event_date: "", event_time: "", description: "" });
  };

  const handleAddReminder = async () => {
    if (!reminderForm.title || !reminderForm.date_time) return;
    await reminders.add(reminderForm);
    setReminderDialogOpen(false);
    setReminderForm({ title: "", date_time: "" });
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    await notes.add({ content: noteContent });
    setNoteDialogOpen(false);
    setNoteContent("");
  };

  // Notifications from proposals
  const notifications = proposals.data
    .filter((p: any) => p.status !== "Pending")
    .map((p: any) => ({
      id: p.id,
      message: `Proposal ${p.unique_id}: ${p.status}${p.reason ? ` - ${p.reason}` : ""}`,
      date: p.updated_at,
    }));

  return (
    <OperationsLayout title="Dashboard">
      <div className="space-y-6">
        {/* Top Row: Calendar, Reminders, Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calendar Events */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Calendar
              </h2>
              <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Title</Label><Input value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})} /></div>
                    <div><Label>Date</Label><Input type="date" value={eventForm.event_date} onChange={(e) => setEventForm({...eventForm, event_date: e.target.value})} /></div>
                    <div><Label>Time</Label><Input type="time" value={eventForm.event_time} onChange={(e) => setEventForm({...eventForm, event_time: e.target.value})} /></div>
                    <div><Label>Description</Label><Textarea value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})} /></div>
                    <Button onClick={handleAddEvent} className="w-full">Add Event</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {events.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet</p>
              ) : events.data.map((ev: any) => (
                <div key={ev.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium text-foreground">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.event_date} {ev.event_time}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => events.remove(ev.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Reminders
              </h2>
              <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Reminder</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Title</Label><Input value={reminderForm.title} onChange={(e) => setReminderForm({...reminderForm, title: e.target.value})} /></div>
                    <div><Label>Date & Time</Label><Input type="datetime-local" value={reminderForm.date_time} onChange={(e) => setReminderForm({...reminderForm, date_time: e.target.value})} /></div>
                    <Button onClick={handleAddReminder} className="w-full">Add Reminder</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {reminders.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reminders</p>
              ) : reminders.data.map((r: any) => (
                <div key={r.id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${r.notified ? "bg-muted/30" : "bg-primary/10"}`}>
                  <div>
                    <p className="font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.date_time).toLocaleString()}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => reminders.remove(r.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card border rounded-xl p-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-primary" /> Notifications
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications</p>
              ) : notifications.map((n: any) => (
                <div key={n.id} className="p-2 bg-muted/50 rounded-lg text-sm">
                  <p className="text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.date).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Notes, Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" /> Notes
              </h2>
              <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write your note..." rows={5} />
                    <Button onClick={handleAddNote} className="w-full">Save Note</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notes.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet</p>
              ) : notes.data.map((n: any) => (
                <div key={n.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm cursor-pointer hover:bg-muted" onClick={() => setViewingNote(n)}>
                  <p className="text-foreground truncate flex-1">{n.content.slice(0, 60)}...</p>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); notes.remove(n.id); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Charts */}
          <div className="bg-card border rounded-xl p-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" /> Analysis
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Monthly Proposals</p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={proposalChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Monthly Inwards</p>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={inwardChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note Viewing Dialog */}
      <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Note</DialogTitle></DialogHeader>
          <p className="text-sm text-foreground whitespace-pre-wrap">{viewingNote?.content}</p>
          <p className="text-xs text-muted-foreground mt-2">{viewingNote && new Date(viewingNote.created_at).toLocaleString()}</p>
        </DialogContent>
      </Dialog>
    </OperationsLayout>
  );
};

export default OperationsDashboard;
