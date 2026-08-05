import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface CalendarMarker {
  date: string; // yyyy-MM-dd
  title: string;
}

// Fixed-date Indian national / public holidays (month is 1-based).
const FIXED_HOLIDAYS: { month: number; day: number; title: string }[] = [
  { month: 1, day: 1, title: "New Year's Day" },
  { month: 1, day: 26, title: "Republic Day" },
  { month: 5, day: 1, title: "Labour Day" },
  { month: 8, day: 15, title: "Independence Day" },
  { month: 10, day: 2, title: "Gandhi Jayanti" },
  { month: 12, day: 25, title: "Christmas" },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface HolidayCalendarProps {
  events?: CalendarMarker[];
}

const HolidayCalendar = ({ events = [] }: HolidayCalendarProps) => {
  const [cursor, setCursor] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const grid = eachDayOfInterval({ start, end });
    const leading = Array.from({ length: start.getDay() }, () => null);
    return [...leading, ...grid];
  }, [cursor]);

  const holidayFor = (d: Date) =>
    FIXED_HOLIDAYS.find((h) => h.month === d.getMonth() + 1 && h.day === d.getDate())?.title;

  const eventsFor = (d: Date) =>
    events.filter((e) => e.date && isSameDay(new Date(`${e.date}T00:00:00`), d));

  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold">{format(cursor, "MMMM yyyy")}</p>
        <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[11px] font-medium text-muted-foreground py-1">{w}</div>
        ))}
        <TooltipProvider>
          {days.map((d, i) => {
            if (!d) return <div key={`e-${i}`} />;
            const holiday = holidayFor(d);
            const dayEvents = eventsFor(d);
            const isSunday = d.getDay() === 0;
            const isToday = isSameDay(d, today);
            const label = [holiday, ...dayEvents.map((e) => e.title)].filter(Boolean).join(" • ");
            const cell = (
              <div
                className={[
                  "relative aspect-square flex flex-col items-center justify-center rounded-md text-xs",
                  isToday ? "bg-primary text-primary-foreground font-semibold" : "",
                  !isToday && (holiday || isSunday) ? "bg-destructive/10 text-destructive font-medium" : "",
                  !isToday && !holiday && !isSunday ? "hover:bg-muted" : "",
                  !isSameMonth(d, cursor) ? "opacity-40" : "",
                ].join(" ")}
              >
                {d.getDate()}
                {dayEvents.length > 0 && (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
            );
            return label ? (
              <Tooltip key={d.toISOString()}>
                <TooltipTrigger asChild>{cell}</TooltipTrigger>
                <TooltipContent><p className="text-xs">{label}</p></TooltipContent>
              </Tooltip>
            ) : (
              <div key={d.toISOString()}>{cell}</div>
            );
          })}
        </TooltipProvider>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/60" /> Holiday / Sunday</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Event</span>
      </div>
    </div>
  );
};

export default HolidayCalendar;
