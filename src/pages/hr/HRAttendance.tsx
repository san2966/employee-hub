import { useState } from "react";
import HRLayout from "@/components/hr/HRLayout";
import { useAttendanceData, LOCATION_COLORS, LocationType } from "@/hooks/useAttendanceData";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, Download, Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

const HRAttendance = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [showMonthly, setShowMonthly] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string; attendanceId: string | null }>({
    open: false, requestId: "", attendanceId: null,
  });
  const [rejectNotes, setRejectNotes] = useState("");

  const {
    records, counts, pendingCounts, approvalRequests,
    loading, fetchMonthlyRecords, approveRequest,
  } = useAttendanceData(selectedDate);

  const filteredRecords = records.filter(r =>
    r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = approvalRequests.filter(r => r.status === "Pending");

  const downloadCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data.map(r => ({
      Employee: r.employee_name,
      Date: r.date,
      Location: r.location,
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
    doc.text(`Generated: ${format(new Date(), "dd-MM-yyyy hh:mm a")}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [["Employee", "Date", "Location", "In Time", "Out Time", "Status"]],
      body: data.map(r => [r.employee_name, r.date, r.location, r.in_time || "-", r.out_time || "-", r.status]),
    });
    doc.save(filename);
  };

  const handleLoadMonthly = async () => {
    const data = await fetchMonthlyRecords(filterYear, filterMonth);
    setMonthlyRecords(data);
    setShowMonthly(true);
  };

  const handleReject = async () => {
    await approveRequest(rejectDialog.requestId, rejectDialog.attendanceId, false, rejectNotes);
    setRejectDialog({ open: false, requestId: "", attendanceId: null });
    setRejectNotes("");
  };

  const locationTypes: LocationType[] = ["Office", "WFH", "Field", "Half-Day", "Leave", "Absent"];

  return (
    <HRLayout title="Attendance Manager">
      <div className="space-y-6">
        {/* Date Picker & Downloads */}
        <div className="flex flex-wrap items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd-MM-yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => downloadCSV(records, `Emp_HR_Attendance_${format(selectedDate, "yyyyMMdd")}.csv`)}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadPDF(records, `Attendance - ${format(selectedDate, "dd-MM-yyyy")}`, `Emp_HR_Attendance_${format(selectedDate, "yyyyMMdd")}.pdf`)}>
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

        {/* Pending Approval Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-card rounded-xl border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-foreground">
                Pending Approvals ({pendingRequests.length})
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(req => {
                  const color = LOCATION_COLORS[req.location as LocationType];
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.employee_name}</TableCell>
                      <TableCell>{req.date}</TableCell>
                      <TableCell>
                        <Badge className={cn(color?.bg, color?.text, "border-0")}>
                          {color?.emoji} {req.location}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => approveRequest(req.id, req.attendance_id, true)}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectDialog({ open: true, requestId: req.id, attendanceId: req.attendance_id })}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Today's Records */}
        <div className="bg-card rounded-xl border">
          <div className="p-6 border-b">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground">
                Records for {format(selectedDate, "dd-MM-yyyy")}
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search employee..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 w-[220px]" />
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
                  <TableHead>In Time</TableHead>
                  <TableHead>Out Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(record => {
                  const color = LOCATION_COLORS[record.location as LocationType] || LOCATION_COLORS.Office;
                  const needsAction = ["WFH", "Field", "Half-Day"].includes(record.location) && record.status === "Pending";
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employee_name}</TableCell>
                      <TableCell>
                        <Badge className={cn(color.bg, color.text, "border-0")}>
                          {color.emoji} {record.location}
                          {record.status === "Pending" && "*"}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.in_time || "-"}</TableCell>
                      <TableCell>{record.out_time || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === "Approved" ? "default" : record.status === "Rejected" ? "destructive" : "secondary"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {needsAction ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" onClick={async () => {
                              const req = approvalRequests.find(r => r.employee_id === record.employee_id && r.date === record.date && r.status === "Pending");
                              if (req) await approveRequest(req.id, record.id, true);
                              else await approveRequest("", record.id, true);
                            }}>
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                              const req = approvalRequests.find(r => r.employee_id === record.employee_id && r.date === record.date && r.status === "Pending");
                              setRejectDialog({ open: true, requestId: req?.id || "", attendanceId: record.id });
                            }}>
                              <X className="h-4 w-4 mr-1" /> Denied
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
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
                    <SelectItem key={i + 1} value={String(i + 1)}>{format(new Date(2024, i, 1), "MMMM")}</SelectItem>
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
                <Button variant="outline" size="sm" onClick={() => downloadCSV(monthlyRecords, `Emp_HR_Monthly_${filterYear}_${filterMonth}.csv`)}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadPDF(monthlyRecords, `Monthly - ${format(new Date(filterYear, filterMonth - 1), "MMMM yyyy")}`, `Emp_HR_Monthly_${filterYear}_${filterMonth}.pdf`)}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            )}
          </div>
          {showMonthly && (
            <div className="mt-4 overflow-x-auto">
              {monthlyRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No records found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>In Time</TableHead>
                      <TableHead>Out Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyRecords.map(record => {
                      const color = LOCATION_COLORS[record.location as LocationType] || LOCATION_COLORS.Office;
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.employee_name}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>
                            <Badge className={cn(color.bg, color.text, "border-0")}>{color.emoji} {record.location}</Badge>
                          </TableCell>
                          <TableCell>{record.in_time || "-"}</TableCell>
                          <TableCell>{record.out_time || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === "Approved" ? "default" : record.status === "Rejected" ? "destructive" : "secondary"}>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>

        {/* Reject Dialog */}
        <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, requestId: "", attendanceId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
            </DialogHeader>
            <Textarea placeholder="Reason for rejection (optional)" value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog({ open: false, requestId: "", attendanceId: null })}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </HRLayout>
  );
};

export default HRAttendance;
