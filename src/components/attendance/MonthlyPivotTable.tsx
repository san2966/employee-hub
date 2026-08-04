import { Fragment } from "react";
import { getDaysInMonth } from "date-fns";
import { LOCATION_COLORS, LocationType } from "@/hooks/useAttendanceData";
import { cn } from "@/lib/utils";

export function computeHours(inT?: string | null, outT?: string | null): string {
  if (!inT || !outT) return "-";
  const [ih, im] = inT.split(":").map(Number);
  const [oh, om] = outT.split(":").map(Number);
  if ([ih, im, oh, om].some(n => Number.isNaN(n))) return "-";
  const mins = (oh * 60 + om) - (ih * 60 + im);
  if (mins <= 0) return "-";
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
}

export function MonthlyPivotTable({ records, year, month }: { records: any[]; year: number; month: number }) {
  const days = getDaysInMonth(new Date(year, month - 1, 1));
  const dayNums = Array.from({ length: days }, (_, i) => i + 1);

  const grouped = new Map<string, { name: string; byDay: Record<number, any> }>();
  records.forEach(r => {
    const key = r.employee_id;
    if (!grouped.has(key)) grouped.set(key, { name: r.employee_name || "Unknown", byDay: {} });
    const d = Number((r.date as string).slice(8, 10));
    grouped.get(key)!.byDay[d] = r;
  });

  const employees = Array.from(grouped.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-xs">
        <thead className="bg-muted/60">
          <tr>
            <th className="sticky left-0 bg-muted/60 text-left px-3 py-2 font-semibold border-r">Employee</th>
            {dayNums.map(d => (
              <th key={d} className="px-2 py-2 font-semibold text-center border-r">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map(([empId, { name, byDay }]) => (
            <Fragment key={empId}>
              <tr className="bg-card">
                <td rowSpan={4} className="sticky left-0 bg-card font-semibold px-3 py-2 border-r border-t align-top">
                  {name}
                </td>
                {dayNums.map(d => {
                  const rec = byDay[d];
                  const loc = rec?.location as LocationType | undefined;
                  const color = loc ? LOCATION_COLORS[loc] : null;
                  return (
                    <td key={d} className="px-1 py-1 text-center border-r border-t">
                      {loc ? (
                        <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10px] font-medium", color?.bg, color?.text)}>
                          {loc}
                        </span>
                      ) : "-"}
                    </td>
                  );
                })}
              </tr>
              <tr>
                {dayNums.map(d => (
                  <td key={d} className="px-1 py-1 text-center text-muted-foreground border-r">
                    <span className="block text-[9px] uppercase text-muted-foreground/70">In</span>
                    {byDay[d]?.in_time || "-"}
                  </td>
                ))}
              </tr>
              <tr>
                {dayNums.map(d => (
                  <td key={d} className="px-1 py-1 text-center text-muted-foreground border-r">
                    <span className="block text-[9px] uppercase text-muted-foreground/70">Out</span>
                    {byDay[d]?.out_time || "-"}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                {dayNums.map(d => (
                  <td key={d} className="px-1 py-1 text-center font-medium border-r">
                    <span className="block text-[9px] uppercase text-muted-foreground/70">Hrs</span>
                    {computeHours(byDay[d]?.in_time, byDay[d]?.out_time)}
                  </td>
                ))}
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
