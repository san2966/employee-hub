import { useMemo, useState } from "react";
import { Plus, PhoneCall } from "lucide-react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessCollection, formatDate } from "@/hooks/useBusinessData";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";

const OUTCOMES = ["Connected", "Not Connected", "Interested", "Not Interested"];
const REVIEWS = ["Pending", "Converted", "Rejected"];
const empty = {
  officer_name: "", organization: "", contact: "", customer_type: "New",
  called_on: new Date().toISOString().slice(0, 10), outcome: "Connected", is_opportunity: "No",
};

const Kpi = ({ label, value }: { label: string; value: number | string }) => (
  <Card className="p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
  </Card>
);

const BusinessFollowups = () => {
  const { toast } = useToast();
  const { profile } = useBusinessAuth();
  const { rows, refresh } = useBusinessCollection<any>("business_followups");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [review, setReview] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState("Pending");
  const [reviewNote, setReviewNote] = useState("");

  const kpis = useMemo(() => ({
    total: rows.length,
    connected: rows.filter((r) => r.outcome === "Connected" || r.outcome === "Interested").length,
    opportunities: rows.filter((r) => r.is_opportunity).length,
    pending: rows.filter((r) => r.review_status === "Pending").length,
    converted: rows.filter((r) => r.review_status === "Converted").length,
  }), [rows]);

  const save = async () => {
    if (!form.officer_name.trim() || !form.organization.trim() || !form.contact.trim()) {
      toast({ title: "Officer, organization and contact are required", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("business_followups").insert({
      officer_name: form.officer_name, organization: form.organization, contact: form.contact,
      customer_type: form.customer_type, called_on: form.called_on, outcome: form.outcome,
      is_opportunity: form.is_opportunity === "Yes",
      caller_id: profile?.id ?? null, caller_name: profile?.name ?? null, created_by: user?.id ?? null,
    });
    if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    else { toast({ title: "Follow-up saved" }); setForm(empty); setOpen(false); void refresh(); }
  };

  const submitReview = async () => {
    const { error } = await (supabase as any).from("business_followups")
      .update({ review_status: reviewStatus, review_note: reviewNote || null }).eq("id", review.id);
    if (error) toast({ title: "Could not update", description: error.message, variant: "destructive" });
    else { toast({ title: "Review updated" }); setReview(null); void refresh(); }
  };

  return (
    <BusinessLayout title="Telephonic Followup">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Kpi label="Total Calls" value={kpis.total} />
        <Kpi label="Connected" value={kpis.connected} />
        <Kpi label="Opportunities" value={kpis.opportunities} />
        <Kpi label="Pending Review" value={kpis.pending} />
        <Kpi label="Converted" value={kpis.converted} />
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Call log</p>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Call</Button>
      </div>

      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Called on</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Caller</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                <PhoneCall className="h-6 w-6 mx-auto mb-2 opacity-50" /> No calls logged
              </TableCell></TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium">{r.officer_name}</p>
                  <p className="text-xs text-muted-foreground">{r.organization}</p>
                  <p className="text-xs text-muted-foreground">{r.contact}</p>
                </TableCell>
                <TableCell><Badge variant="outline">{r.customer_type}</Badge></TableCell>
                <TableCell>{formatDate(r.called_on)}</TableCell>
                <TableCell>{r.outcome}</TableCell>
                <TableCell>{r.is_opportunity ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Badge variant={r.review_status === "Converted" ? "default" : r.review_status === "Rejected" ? "destructive" : "secondary"}>
                    {r.review_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{r.caller_name || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => {
                    setReview(r); setReviewStatus(r.review_status); setReviewNote(r.review_note || "");
                  }}>Review</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Telephonic Follow-up</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Officer Name</Label>
              <Input value={form.officer_name} onChange={(e) => setForm({ ...form, officer_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Organization</Label>
              <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></div>
            <div className="space-y-2"><Label>Contact</Label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div className="space-y-2"><Label>Type</Label>
              <Select value={form.customer_type} onValueChange={(v) => setForm({ ...form, customer_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="New">New</SelectItem><SelectItem value="Existing">Existing</SelectItem></SelectContent>
              </Select></div>
            <div className="space-y-2"><Label>Called on</Label>
              <Input type="date" value={form.called_on} onChange={(e) => setForm({ ...form, called_on: e.target.value })} /></div>
            <div className="space-y-2"><Label>Outcome</Label>
              <Select value={form.outcome} onValueChange={(v) => setForm({ ...form, outcome: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-2 sm:col-span-2"><Label>Opportunity</Label>
              <Select value={form.is_opportunity} onValueChange={(v) => setForm({ ...form, is_opportunity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!review} onOpenChange={(o) => !o && setReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review Call</DialogTitle></DialogHeader>
          {review && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground text-xs">Officer</p><p className="font-medium">{review.officer_name}</p></div>
                <div><p className="text-muted-foreground text-xs">Organization</p><p className="font-medium">{review.organization}</p></div>
                <div><p className="text-muted-foreground text-xs">Contact</p><p className="font-medium">{review.contact}</p></div>
                <div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium">{review.customer_type}</p></div>
                <div><p className="text-muted-foreground text-xs">Called on</p><p className="font-medium">{formatDate(review.called_on)}</p></div>
                <div><p className="text-muted-foreground text-xs">Outcome</p><p className="font-medium">{review.outcome}</p></div>
                <div><p className="text-muted-foreground text-xs">Opportunity</p><p className="font-medium">{review.is_opportunity ? "Yes" : "No"}</p></div>
                <div><p className="text-muted-foreground text-xs">Caller</p><p className="font-medium">{review.caller_name || "—"}</p></div>
              </div>
              <div className="space-y-2">
                <Label>Review Status</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REVIEWS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReview(null)}>Cancel</Button>
            <Button onClick={submitReview}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessFollowups;