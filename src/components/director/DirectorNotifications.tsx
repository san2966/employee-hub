import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, ClipboardList, FileWarning, CalendarClock, Receipt, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/dateFormat";

interface Item {
  id: string;
  title: string;
  description: string;
  icon: typeof Bell;
  tone: "info" | "warning" | "danger";
  at?: string;
}

const toneClass = {
  info: "bg-primary/10 border-primary/20",
  warning: "bg-warning/10 border-warning/20",
  danger: "bg-destructive/10 border-destructive/20",
} as const;

/** Portal-wide alert feed for the Director dashboard. */
const DirectorNotifications = () => {
  const [items, setItems] = useState<Item[]>([]);

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [leaves, reqs, quotes, tasks, payments, staff] = await Promise.all([
      (supabase as any).from("leave_requests").select("id, employee_id, leave_type, date, status").eq("status", "pending").limit(10),
      (supabase as any).from("requirements").select("id, title, employee_name, status, created_at").eq("status", "pending").limit(10),
      (supabase as any).from("purchase_quotes").select("id, quote_id, subject, status, created_at").eq("status", "Pending").limit(10),
      (supabase as any).from("tasks").select("id, title, status, due_date").neq("status", "completed").lt("due_date", today).limit(10),
      (supabase as any).from("employee_payments").select("id, employee_name, month, year, hr_status").eq("hr_status", "Pending").limit(10),
      (supabase as any).from("employees").select("id, name"),
    ]);

    const next: Item[] = [];
    const nameOf = (id?: string | null) =>
      (staff.data || []).find((e: any) => e.id === id)?.name || "Employee";
    (leaves.data || []).forEach((l: any) =>
      next.push({
        id: `leave-${l.id}`,
        title: "Leave approval pending",
        description: `${nameOf(l.employee_id)} • ${l.leave_type || "leave"}${l.date ? ` (${formatDate(l.date)})` : ""}`,
        icon: CalendarClock,
        tone: "warning",
      }),
    );
    (reqs.data || []).forEach((r: any) =>
      next.push({
        id: `req-${r.id}`,
        title: "Requirement awaiting approval",
        description: `${r.title || "Requirement"} • ${r.employee_name || "Employee"}`,
        icon: Package,
        tone: "warning",
      }),
    );
    (quotes.data || []).forEach((q: any) =>
      next.push({
        id: `quote-${q.id}`,
        title: "Quote awaiting approval",
        description: `${q.quote_id || ""} ${q.subject || ""}`.trim(),
        icon: FileWarning,
        tone: "warning",
      }),
    );
    (tasks.data || []).forEach((t: any) =>
      next.push({
        id: `task-${t.id}`,
        title: "Overdue task",
        description: `${t.title} • due ${formatDate(t.due_date)}`,
        icon: ClipboardList,
        tone: "danger",
      }),
    );
    (payments.data || []).forEach((p: any) =>
      next.push({
        id: `pay-${p.id}`,
        title: "Expense sheet pending HR review",
        description: `${p.employee_name || "Employee"} • ${p.month || "-"}/${p.year || "-"}`,
        icon: Receipt,
        tone: "info",
      }),
    );
    setItems(next);
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 60_000);
    const channel = supabase
      .channel("director-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "requirements" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => void load())
      .subscribe();
    return () => {
      clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <Card className="card-corporate">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" /> Notifications
        </CardTitle>
        {items.length > 0 && <Badge variant="destructive">{items.length}</Badge>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nothing needs your attention</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-2">
              {items.map((i) => {
                const Icon = i.icon;
                return (
                  <div key={i.id} className={`flex gap-3 p-3 rounded-lg border ${toneClass[i.tone]}`}>
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-foreground/70" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{i.title}</p>
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

export default DirectorNotifications;