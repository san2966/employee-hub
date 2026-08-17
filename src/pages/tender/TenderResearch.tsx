import { useState } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTenderResearch } from "@/hooks/useTenderData";
import { Plus, CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";

const TenderResearch = () => {
  const { data: research, add } = useTenderResearch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    user_name: "", tender_id_ref: "", tender_number: "", organization: "",
    subject: "", description: "", amount: "",
  });
  const [openDate, setOpenDate] = useState<Date | undefined>();
  const [closeDate, setCloseDate] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.user_name.trim() || !form.tender_id_ref.trim() || !form.tender_number.trim() || !form.organization.trim() || !form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    await add({
      ...form,
      amount: form.amount ? parseFloat(form.amount) : null,
      open_date: openDate ? format(openDate, "yyyy-MM-dd") : null,
      close_date: closeDate ? format(closeDate, "yyyy-MM-dd") : null,
    } as any);
    setForm({ user_name: "", tender_id_ref: "", tender_number: "", organization: "", subject: "", description: "", amount: "" });
    setOpenDate(undefined); setCloseDate(undefined); setOpen(false); setSubmitting(false);
  };

  // Filter out records > 90 days old (visual only; backend cron handles deletion)
  const activeResearch = research.filter((r: any) => {
    const created = new Date(r.created_at);
    const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 90;
  });

  return (
    <TenderLayout title="Research & Analysis">
      <div className="flex justify-end mb-6">
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Research</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tender ID</TableHead>
                <TableHead>Tender No.</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Open Date</TableHead>
                <TableHead>Close Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeResearch.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No research data. Records auto-delete after 90 days.</TableCell></TableRow>
              ) : activeResearch.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.user_name}</TableCell>
                  <TableCell className="text-sm">{r.tender_id_ref}</TableCell>
                  <TableCell className="text-sm">{r.tender_number}</TableCell>
                  <TableCell className="text-sm">{r.organization}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{r.subject}</TableCell>
                  <TableCell className="text-sm">{r.amount ? `₹${r.amount}` : "-"}</TableCell>
                  <TableCell className="text-sm">{r.open_date || "-"}</TableCell>
                  <TableCell className="text-sm">{r.close_date || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Research</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div><Label>User Name *</Label><Input value={form.user_name} onChange={e => setForm({ ...form, user_name: e.target.value })} /></div>
            <div><Label>Tender ID *</Label><Input value={form.tender_id_ref} onChange={e => setForm({ ...form, tender_id_ref: e.target.value })} /></div>
            <div><Label>Tender No. *</Label><Input value={form.tender_number} onChange={e => setForm({ ...form, tender_number: e.target.value })} /></div>
            <div><Label>Organization *</Label><Input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} /></div>
            <div><Label>Subject *</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Tender Amount</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            <div>
              <Label>Opening Date</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{openDate ? format(openDate, "dd-MM-yyyy") : "Pick"}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={openDate} onSelect={setOpenDate} /></PopoverContent></Popover>
            </div>
            <div>
              <Label>Closing Date</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{closeDate ? format(closeDate, "dd-MM-yyyy") : "Pick"}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={closeDate} onSelect={setCloseDate} /></PopoverContent></Popover>
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TenderLayout>
  );
};

export default TenderResearch;
