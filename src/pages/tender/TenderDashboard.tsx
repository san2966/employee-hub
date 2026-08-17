import { useState, useEffect } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, CalendarClock, StickyNote, BarChart3, Plus, Trash2, CalendarIcon } from "lucide-react";
import { useTenderReminders, useTenderNotes, useTenderResearch } from "@/hooks/useTenderData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FileSearch, ListChecks } from "lucide-react";

const TenderDashboard = () => {
  const { data: reminders, add: addReminder, remove: removeReminder } = useTenderReminders();
  const { data: notes, add: addNote, remove: removeNote } = useTenderNotes();
  const { data: research } = useTenderResearch();
  const [notifications, setNotifications] = useState<{ text: string; date: string }[]>([]);
  const { toast } = useToast();

  // Reminder form
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderDesc, setReminderDesc] = useState("");
  const [reminderDate, setReminderDate] = useState<Date | undefined>();

  // Note form
  const [noteContent, setNoteContent] = useState("");

  // Fetch notifications from date-based data
  useEffect(() => {
    const fetchNotifications = async () => {
      const today = new Date().toISOString().split("T")[0];
      const notifs: { text: string; date: string }[] = [];

      // Reminders due today
      reminders.forEach((r: any) => {
        if (r.reminder_date === today) notifs.push({ text: `Reminder: ${r.description}`, date: r.reminder_date });
      });

      // Research closing dates
      research.forEach((r: any) => {
        if (r.close_date === today) notifs.push({ text: `Research closing: ${r.subject}`, date: r.close_date });
        if (r.open_date === today) notifs.push({ text: `Research opening: ${r.subject}`, date: r.open_date });
      });

      // Tender dates
      const { data: tenders } = await supabase.from("tenders").select("*") as any;
      (tenders || []).forEach((t: any) => {
        if (t.technical_opening_date === today) notifs.push({ text: `Technical Opening today`, date: today });
        if (t.financial_opening_date === today) notifs.push({ text: `Financial Opening today`, date: today });
      });

      setNotifications(notifs);
    };
    fetchNotifications();
  }, [reminders, research]);

  // Notify reminders
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    reminders.forEach((r: any) => {
      if (r.reminder_date === today) {
        toast({ title: "Reminder", description: r.description });
      }
    });
  }, [reminders, toast]);

  const handleAddReminder = async () => {
    if (!reminderDesc.trim() || !reminderDate) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const success = await addReminder({
      description: reminderDesc,
      reminder_date: format(reminderDate, "yyyy-MM-dd"),
      user_id: user.id,
    } as any);
    if (success) { setReminderDesc(""); setReminderDate(undefined); setReminderOpen(false); }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await addNote({ content: noteContent, user_id: user.id } as any);
    setNoteContent("");
  };

  // Research graph data
  const monthlyResearch = (() => {
    const months: Record<string, number> = {};
    research.forEach((r: any) => {
      const month = r.created_at?.slice(0, 7);
      if (month) months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month: format(new Date(month + "-01"), "MMM yy"), count }));
  })();

  return (
    <TenderLayout title="Dashboard">
      <div className="space-y-6">
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-1">Tender Control Center</h2>
          <p className="opacity-90">Track research, reminders and upcoming openings at a glance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Research Records" value={research.length} icon={FileSearch} tone="primary" />
          <KpiCard label="Active Reminders" value={reminders.length} icon={CalendarClock} tone="warning" />
          <KpiCard label="Today's Alerts" value={notifications.length} icon={Bell} tone="destructive" />
          <KpiCard label="Notes" value={notes.length} icon={ListChecks} tone="success" />
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-primary" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications for today</p>
            ) : notifications.map((n, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{n.text}</p>
                <p className="text-xs text-muted-foreground">{n.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Reminders</span>
              <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Reminder</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Reminder Description</Label>
                      <Input value={reminderDesc} onChange={e => setReminderDesc(e.target.value)} placeholder="Enter description" />
                    </div>
                    <div>
                      <Label>Select Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {reminderDate ? format(reminderDate, "dd-MM-yyyy") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={reminderDate} onSelect={setReminderDate} /></PopoverContent>
                      </Popover>
                    </div>
                    <Button onClick={handleAddReminder} className="w-full">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto space-y-2">
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reminders set</p>
            ) : reminders.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">{r.description}</p>
                  <p className="text-xs text-muted-foreground">{r.reminder_date}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeReminder(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <StickyNote className="h-5 w-5 text-primary" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Add a note..." onKeyDown={e => e.key === "Enter" && handleAddNote()} />
              <Button size="sm" onClick={handleAddNote}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {notes.map((n: any) => (
                <div key={n.id} className="flex items-start justify-between p-3 bg-accent/30 rounded-lg border border-border">
                  <p className="text-sm">{n.content}</p>
                  <Button size="icon" variant="ghost" className="shrink-0" onClick={() => removeNote(n.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Research Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" /> Research Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyResearch.length === 0 ? (
              <p className="text-sm text-muted-foreground">No research data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyResearch}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </TenderLayout>
  );
};

export default TenderDashboard;
