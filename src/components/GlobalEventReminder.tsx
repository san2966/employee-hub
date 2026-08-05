import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import { playNotificationSound } from "@/lib/notificationSound";
import { supabase } from "@/integrations/supabase/client";

interface Reminder {
  key: string;
  title: string;
  when: Date;
  description?: string;
  source: string;
}

const REMIND_WINDOW = 10 * 60 * 1000; // 10 minutes ahead

const toDate = (date?: string, time?: string) => {
  if (!date) return null;
  const d = new Date(`${date}T${time && /^\d{2}:\d{2}/.test(time) ? time : "09:00"}`);
  return isNaN(d.getTime()) ? null : d;
};

const collectLocalEvents = (): Reminder[] => {
  const out: Reminder[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !/events$/i.test(key)) continue;
      let parsed: any;
      try {
        parsed = JSON.parse(localStorage.getItem(key) || "");
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;
      parsed.forEach((e: any, idx: number) => {
        const when = toDate(e?.date || e?.event_date, e?.time || e?.event_time);
        if (!when || !e?.title) return;
        out.push({
          key: `${key}:${e.id ?? idx}:${when.getTime()}`,
          title: e.title,
          description: e.description,
          when,
          source: key.replace(/_events$/i, "").replace(/_/g, " "),
        });
      });
    }
  } catch {
    /* storage unavailable */
  }
  return out;
};

const collectDbEvents = async (): Promise<Reminder[]> => {
  const out: Reminder[] = [];
  const tables: { name: "operations_events" | "purchase_events"; label: string }[] = [
    { name: "operations_events", label: "operations" },
    { name: "purchase_events", label: "purchase" },
  ];
  for (const t of tables) {
    try {
      const { data } = await supabase.from(t.name).select("*");
      (data || []).forEach((e: any) => {
        const when = toDate(e.event_date, e.event_time);
        if (!when || !e.title) return;
        out.push({
          key: `${t.name}:${e.id}:${when.getTime()}`,
          title: e.title,
          description: e.description,
          when,
          source: t.label,
        });
      });
    } catch {
      /* table may be unavailable for this role */
    }
  }
  return out;
};

const GlobalEventReminder = () => {
  const [queue, setQueue] = useState<Reminder[]>([]);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const all = [...collectLocalEvents(), ...(await collectDbEvents())];
      if (cancelled) return;
      const now = Date.now();
      const due = all.filter((r) => {
        const diff = r.when.getTime() - now;
        return diff <= REMIND_WINDOW && diff > -60 * 1000 && !firedRef.current.has(r.key);
      });
      if (due.length === 0) return;
      due.forEach((r) => firedRef.current.add(r.key));
      playNotificationSound();
      setQueue((q) => [...q, ...due]);
    };

    check();
    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const current = queue[0];
  if (!current) return null;

  const minutes = Math.max(0, Math.round((current.when.getTime() - Date.now()) / 60000));

  return (
    <Dialog open onOpenChange={() => setQueue((q) => q.slice(1))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary animate-pulse" />
            Reminder
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-lg font-semibold">{current.title}</p>
          <p className="text-sm text-muted-foreground">
            {minutes === 0 ? "Starting now" : `Starts in ${minutes} minute${minutes > 1 ? "s" : ""}`} ·{" "}
            {current.when.toLocaleString()}
          </p>
          {current.description && <p className="text-sm">{current.description}</p>}
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Source: {current.source}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => setQueue((q) => q.slice(1))}>Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalEventReminder;