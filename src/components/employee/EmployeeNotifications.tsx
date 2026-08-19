import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CalendarClock, ClipboardList, FileText, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/dateFormat";

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "danger" | "success";
  icon: typeof Bell;
  at?: string;
}

interface Props {
  employeeId: string;
  /** Daily tasks (personal tasks) */
  dailyTasks: { createdAt: string }[];
  /** EOD reports */
  reports: { date: string }[];
  assignedTasks: { id: string; subject: string; status: string }[];
  notices: { id: string; title: string; type: string; createdAt: string }[];
  leaveRequests: { id: string; type: string; status: string; date: string }[];
  events: { id: string; title: string; date: string; time: string }[];
}

const toneClass: Record<FeedItem["tone"], string> = {
  info: "bg-primary/10 border-primary/20 text-primary",
  warning: "bg-warning/10 border-warning/20 text-warning",
  danger: "bg-destructive/10 border-destructive/20 text-destructive",
  success: "bg-success/10 border-success/20 text-success",
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const minutesNow = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Notification centre for the employee portal (daily task + EOD reminders and portal alerts). */
const EmployeeNotifications = ({
  employeeId, dailyTasks, reports, assignedTasks, notices, leaveRequests, events,
}: Props) => {
  const { toast } = useToast();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const today = todayISO();
  const isWorkday = now.getDay() !== 0; // Monday - Saturday
  const mins = minutesNow(now);

  const hasDailyTask = dailyTasks.some((t) => (t.createdAt || "").slice(0, 10) === today);
  const hasEod = reports.some((r) => (r.date || "").slice(0, 10) === today);

  const items = useMemo<FeedItem[]>(() => {
    const list: FeedItem[] = [];

    if (isWorkday && !hasDailyTask && mins >= 600) {
      const overdue = mins >= 690; // 11:30 AM
      list.push({
        id: `daily-${today}-${overdue ? "reminder" : "first"}`,
        title: overdue ? "Reminder: Daily Task still not added" : "Add your Daily Task",
        description: overdue
          ? "Your daily task for today is overdue. Please add it right away."
          : "Please create your daily task for today (due by 11:30 AM).",
        tone: overdue ? "danger" : "warning",
        icon: overdue ? AlertTriangle : ClipboardList,
      });
    }

    if (isWorkday && !hasEod && mins >= 1050) {
      const overdue = mins >= 1110; // 6:30 PM
      list.push({
        id: `eod-${today}-${overdue ? "reminder" : "first"}`,
        title: overdue ? "Reminder: EOD Report still not submitted" : "Add Your EOD Report",
        description: overdue
          ? "Your EOD report for today is overdue. Please submit it now."
          : "Please submit your EOD report for today (due by 6:30 PM).",
        tone: overdue ? "danger" : "warning",
        icon: overdue ? AlertTriangle : FileText,
      });
    }

    assignedTasks
      .filter((t) => t.status !== "completed")
      .slice(0, 5)
      .forEach((t) =>
        list.push({
          id: `task-${t.id}`,
          title: "Pending assigned task",
          description: t.subject,
          tone: "info",
          icon: ClipboardList,
        }),
      );

    notices.slice(0, 5).forEach((n) =>
      list.push({
        id: `notice-${n.id}`,
        title: n.type === "announcement" ? "Announcement" : "Notice",
        description: n.title,
        tone: "info",
        icon: Megaphone,
        at: n.createdAt,
      }),
    );

    leaveRequests
      .filter((l) => l.status !== "pending")
      .slice(0, 3)
      .forEach((l) =>
        list.push({
          id: `leave-${l.id}`,
          title: `Leave ${l.status}`,
          description: `${l.type} leave for ${formatDate(l.date)}`,
          tone: l.status === "approved" ? "success" : "danger",
          icon: CalendarClock,
          at: l.date,
        }),
      );

    events
      .filter((e) => e.date >= today)
      .slice(0, 3)
      .forEach((e) =>
        list.push({
          id: `event-${e.id}`,
          title: "Upcoming event",
          description: `${e.title} • ${formatDate(e.date)} ${e.time}`,
          tone: "info",
          icon: CalendarClock,
          at: e.date,
        }),
      );

    return list;
  }, [assignedTasks, events, hasDailyTask, hasEod, isWorkday, leaveRequests, mins, notices, today]);

  // Toast (with chime) once per alert per day for the scheduled reminders.
  useEffect(() => {
    items
      .filter((i) => i.id.startsWith("daily-") || i.id.startsWith("eod-"))
      .forEach((i) => {
        const key = `emp_${employeeId}_alert_${i.id}`;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");
        toast({ title: i.title, description: i.description, variant: i.tone === "danger" ? "destructive" : undefined });
      });
  }, [items, employeeId, toast]);

  const urgent = items.filter((i) => i.tone === "danger" || i.tone === "warning").length;

  return (
    <Card className="card-corporate">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications
        </CardTitle>
        {urgent > 0 && <Badge variant="destructive">{urgent} action needed</Badge>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>You are all caught up</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-2">
              {items.map((i) => {
                const Icon = i.icon;
                return (
                  <div key={i.id} className={`flex gap-3 p-3 rounded-lg border ${toneClass[i.tone]}`}>
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{i.title}</p>
                      <p className="text-xs text-muted-foreground break-words">{i.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeNotifications;