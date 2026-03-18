import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LOCATION_COLORS, LocationType } from "@/hooks/useAttendanceData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, getDaysInMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CalendarData {
  [employeeId: string]: {
    name: string;
    days: { [day: number]: { location: LocationType; status: string } };
  };
}

const AttendanceCalendar = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const [{ data: records }, { data: employees }] = await Promise.all([
      supabase.from("attendance").select("*").gte("date", startDate).lt("date", endDate),
      supabase.from("employees").select("id, name").eq("is_active", true).order("name"),
    ]);

    const data: CalendarData = {};
    (employees || []).forEach(emp => {
      data[emp.id] = { name: emp.name, days: {} };
    });

    (records || []).forEach(r => {
      const day = new Date(r.date).getDate();
      if (data[r.employee_id]) {
        data[r.employee_id].days[day] = {
          location: r.location as LocationType,
          status: r.status,
        };
      }
    });

    setCalendarData(data);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("calendar-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="p-6 border-b flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">Attendance Calendar</h3>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{format(new Date(2024, i, 1), "MMMM")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading calendar...</div>
      ) : (
        <ScrollArea className="w-full">
          <div className="p-4 min-w-[800px]">
            <div className="grid" style={{ gridTemplateColumns: `180px repeat(${daysInMonth}, 36px)` }}>
              {/* Header row */}
              <div className="font-medium text-sm text-muted-foreground p-2 border-b">Employee</div>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground p-2 border-b">
                  {i + 1}
                </div>
              ))}

              {/* Employee rows */}
              {Object.entries(calendarData).map(([empId, empData]) => (
                <div key={empId} className="contents">
                  <div className="text-sm font-medium p-2 border-b truncate" title={empData.name}>
                    {empData.name}
                  </div>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayData = empData.days[i + 1];
                    if (!dayData) {
                      return <div key={i} className="p-1 border-b flex items-center justify-center">
                        <span className="text-xs text-muted-foreground/30">-</span>
                      </div>;
                    }
                    const color = LOCATION_COLORS[dayData.location];
                    const isPending = dayData.status === "Pending";
                    return (
                      <div key={i} className="p-1 border-b flex items-center justify-center" title={`${dayData.location}${isPending ? " (Pending)" : ""}`}>
                        <span className={cn("text-sm", isPending && "opacity-60")}>
                          {color.emoji}{isPending && "*"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              {(Object.entries(LOCATION_COLORS) as [LocationType, typeof LOCATION_COLORS[LocationType]][]).map(([loc, color]) => (
                <div key={loc} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{color.emoji}</span>
                  <span>{loc}</span>
                  {["WFH", "Field", "Half-Day"].includes(loc) && <span className="text-muted-foreground/60">*Pending</span>}
                </div>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
};

export default AttendanceCalendar;
