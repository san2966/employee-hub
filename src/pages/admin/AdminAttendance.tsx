import { Fragment, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAttendanceData, LOCATION_COLORS, LocationType } from "@/hooks/useAttendanceData";
import { format, getDaysInMonth } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

const AdminAttendance = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [employeeId, setEmployeeId] = useState("");
  const [location, setLocation] = useState<LocationType>("Office");
  const [inTime, setInTime] = useState("09:00");
  const [outTime, setOutTime] = useState("18:00");
  const [visitLocation, setVisitLocation] = useState("");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [showMonthly, setShowMonthly] = useState(false);

  const {
    records, employees, counts, pendingCounts,
    saveAttendance, savePartialTime, deleteAttendance, loading, fetchMonthlyRecords,
  } = useAttendanceData(selectedDate);

  const hideTimes = location === "Leave" || location === "Absent";
  const showVisit = location === "Field";

  const handleSave = async () => {
    if (!employeeId) {
      toast({ title: "Error", description: "Please select an employee", variant: "destructive" });
      return;
    }
    if (!hideTimes && inTime && outTime && inTime >= outTime) {
      toast({ title: "Error", description: "In Time must be before Out Time", variant: "destructive" });
      return;
    }
    if (showVisit && !visitLocation.trim()) {
      toast({ title: "Error", description: "Please enter Visit Location", variant: "destructive" });
      return;
    }
    const success = await saveAttendance(
      employeeId,
      location,
      hideTimes ? "" : inTime,
      hideTimes ? "" : outTime,
      visitLocation,
    );
    if (success) {
      setEmployeeId("");
      setLocation("Office");
      setInTime("09:00");
      setOutTime("18:00");
      setVisitLocation("");
    }
  };

  const handleSaveField = async (field: "in_time" | "out_time", value: string) => {
    if (!employeeId) {
      toast({ title: "Error", description: "Please select an employee", variant: "destructive" });
      return;
    }
    if (!value) {
      toast({ title: "Error", description: "Please enter a time", variant: "destructive" });
      return;
    }
    await savePartialTime(employeeId, location, field, value, visitLocation);
  };

  const handleLoadMonthly = async () => {
    const data = await fetchMonthlyRecords(filterYear, filterMonth);
    setMonthlyRecords(data);
    setShowMonthly(true);
  };

  const filteredRecords = records.filter(r =>
    r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMonthly = monthlyRecords.filter(r =>
    r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data.map(r => ({
      Employee: r.employee_name,
      Date: r.date,
      Location: r.location,
      "Visit Location": r.visit_location || "-",
      "In Time": r.in_time || "-",
      "Out Time": r.out_time || "-",
      Status: r.status,
    })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (data: any[], title: string, filename: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "PPP pp")}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [["Employee", "Date", "Location", "Visit Location", "In Time", "Out Time", "Status"]],
      body: data.map(r => [r.employee_name, r.date, r.location, r.visit_location || "-", r.in_time || "-", r.out_time || "-", r.status]),
    });
    doc.save(filename);
  };

  const locationTypes: LocationType[] = ["Office", "WFH", "Field", "Half-Day", "Leave", "Absent"];

  return (
    <AdminLayout title="Attendance Manager">
      <div className="space-y-6">
        {/* Date Picker & Download */}
        <div className="flex flex-wrap items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => downloadCSV(records, `Attendance_${format(selectedDate, "yyyy-MM-dd")}.csv`)}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadPDF(records, `Attendance - ${format(selectedDate, "PPP")}`, `Attendance_${format(selectedDate, "yyyy-MM-dd")}.pdf`)}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {/* Live Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {locationTypes.map(loc => {
            const color = LOCATION_COLORS[loc];
            const pending = (pendingCounts as any)[loc] || 0;
            return (
              <div key={loc} className={cn("rounded-xl p-4 border", color.bg)}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{color.emoji}</span>
                  <span className={cn("text-sm font-medium", color.text)}>{loc}</span>
                </div>
                <div className={cn("text-2xl font-bold mt-1", color.text)}>
                  {counts[loc]}
                  {pending > 0 && <span className="text-xs font-normal ml-1">({pending}*)</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Record Attendance Form */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Record Attendance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Employee</label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Location</label>
              <Select value={location} onValueChange={(v) => setLocation(v as LocationType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {locationTypes.map(loc => (
                    <SelectItem key={loc} value={loc}>
                      {LOCATION_COLORS[loc].emoji} {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!hideTimes && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">In Time</label>
                  <div className="flex gap-2">
                    <Input type="time" value={inTime} onChange={e => setInTime(e.target.value)} />
                    <Button variant="secondary" onClick={() => handleSaveField("in_time", inTime)}>Save</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Out Time</label>
                  <div className="flex gap-2">
                    <Input type="time" value={outTime} onChange={e => setOutTime(e.target.value)} />
                    <Button variant="secondary" onClick={() => handleSaveField("out_time", outTime)}>Save</Button>
                  </div>
                </div>
              </>
            )}
            {showVisit && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Visit Location</label>
                <Input value={visitLocation} onChange={e => setVisitLocation(e.target.value)} placeholder="Client site / area" />
              </div>
            )}
            <div className="flex items-end">
              <Button onClick={handleSave} className="w-full">Save All</Button>
            </div>
          </div>
        </div>

        {/* Today's Records Table */}
        <div className="bg-card rounded-xl border">
          <div className="p-6 border-b">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground">
                Records for {format(selectedDate, "PPP")}
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 w-[220px]"
                />
              </div>
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No records for this date</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Visit Location</TableHead>
                  <TableHead>In Time</TableHead>
                  <TableHead>Out Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(record => {
                  const color = LOCATION_COLORS[record.location as LocationType] || LOCATION_COLORS.Office;
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employee_name}</TableCell>
                      <TableCell>
                        <Badge className={cn(color.bg, color.text, "border-0")}>
                          {color.emoji} {record.location}
                          {record.status === "Pending" && "*"}
                        </Badge>
                      </TableCell>
                      <TableCell>{(record as any).visit_location || "-"}</TableCell>
                      <TableCell>{record.in_time || "-"}</TableCell>
                      <TableCell>{record.out_time || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={
                          record.status === "Approved" ? "default"
                          : record.status === "Rejected" ? "destructive"
                          : record.status === "Late" ? "destructive"
                          : "secondary"
                        }>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteAttendance(record.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Monthly Report Section */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Report</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Month</label>
              <Select value={String(filterMonth)} onValueChange={v => setFilterMonth(Number(v))}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {format(new Date(2024, i, 1), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Year</label>
              <Select value={String(filterYear)} onValueChange={v => setFilterYear(Number(v))}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleLoadMonthly}>Load</Button>
            {showMonthly && monthlyRecords.length > 0 && (
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => downloadCSV(monthlyRecords, `Monthly_Attendance_${filterYear}_${filterMonth}.csv`)}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadPDF(monthlyRecords, `Monthly Attendance - ${format(new Date(filterYear, filterMonth - 1), "MMMM yyyy")}`, `Monthly_Attendance_${filterYear}_${filterMonth}.pdf`)}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            )}
          </div>
          {showMonthly && (
            <div className="mt-4">
              {filteredMonthly.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No records found</p>
              ) : (
                <MonthlyPivotTable
                  records={filteredMonthly}
                  year={filterYear}
                  month={filterMonth}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAttendance;

function computeHours(inT?: string | null, outT?: string | null): string {
  if (!inT || !outT) return "-";
  const [ih, im] = inT.split(":").map(Number);
  const [oh, om] = outT.split(":").map(Number);
  if ([ih, im, oh, om].some(n => Number.isNaN(n))) return "-";
  let mins = (oh * 60 + om) - (ih * 60 + im);
  if (mins <= 0) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function MonthlyPivotTable({ records, year, month }: { records: any[]; year: number; month: number }) {
  const days = getDaysInMonth(new Date(year, month - 1, 1));
  const dayNums = Array.from({ length: days }, (_, i) => i + 1);

  // Group by employee -> date -> record
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
