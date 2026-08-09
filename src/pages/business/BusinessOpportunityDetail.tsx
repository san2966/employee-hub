import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, STATUS_OPTIONS, PRIORITY_OPTIONS, uploadBusinessDoc } from "@/hooks/useBusinessData";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";

const BusinessOpportunityDetail = ({ mode = "opportunity" }: { mode?: "opportunity" | "lead" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, readOnly } = useBusinessAuth();
  const [record, setRecord] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [followupAt, setFollowupAt] = useState("");
  const [note, setNote] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const load = useCallback(async () => {
    const { data } = await (supabase as any).from("business_opportunities").select("*").eq("id", id).maybeSingle();
    setRecord(data);
    const { data: acts } = await (supabase as any)
      .from("business_activities").select("*").eq("opportunity_id", id).order("created_at", { ascending: false });
    setActivities(acts ?? []);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const patch = async (values: Record<string, unknown>) => {
    const { error } = await (supabase as any).from("business_opportunities").update(values).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else void load();
  };

  const addFollowup = async () => {
    if (!note.trim()) { toast({ title: "Description is required", variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("business_activities").insert({
      opportunity_id: id, description: note, scheduled_at: followupAt ? new Date(followupAt).toISOString() : null,
      actor_name: profile?.name ?? null, created_by: user?.id ?? null,
    });
    if (error) { toast({ title: "Could not save", description: error.message, variant: "destructive" }); return; }
    if (followupAt) await patch({ next_followup_at: new Date(followupAt).toISOString() });
    setNote(""); setFollowupAt("");
    toast({ title: "Follow-up recorded" });
    void load();
  };

  const convert = async () => {
    if (!file || !confirmed) {
      toast({ title: "Upload a document and confirm the conversion", variant: "destructive" });
      return;
    }
    try {
      const url = await uploadBusinessDoc(file, `leads/${id}`);
      await patch({ is_lead: true, converted_at: new Date().toISOString(), conversion_doc_url: url });
      toast({ title: "Converted to Lead" });
      setConvertOpen(false);
      navigate(`/business/leads/${id}`);
    } catch (err) {
      toast({ title: "Conversion failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  };

  if (!record) return <BusinessLayout title="Loading..."><p className="text-muted-foreground">Loading record...</p></BusinessLayout>;

  return (
    <BusinessLayout title={record.is_lead ? "Lead Details" : "Opportunity Details"}>
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate(mode === "lead" ? "/business/leads" : "/business/opportunities")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {!record.is_lead && !readOnly && (
          <Button onClick={() => setConvertOpen(true)}>Convert to Lead</Button>
        )}
      </div>

      <Card className="p-5 mb-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Product Name", record.product_name], ["Organization", record.organization_name],
            ["Officer Name", record.officer_name], ["Organization Type", record.organization_type || "—"],
            ["Phone", record.phone || "—"], ["Email", record.email || "—"],
            ["Source", record.source], ["Next Follow-up", formatDateTime(record.next_followup_at)],
            ["Created", formatDateTime(record.created_at)],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-sm">{value as string}</p>
            </div>
          ))}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            {readOnly ? <Badge variant="secondary">{record.status}</Badge> : (
              <Select value={record.status} onValueChange={(v) => patch({ status: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Priority</p>
            {readOnly ? <Badge variant="outline">{record.priority}</Badge> : (
              <Select value={record.priority} onValueChange={(v) => patch({ priority: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <div className="sm:col-span-3">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm">{record.description || "—"}</p>
          </div>
          {record.conversion_doc_url && (
            <div className="sm:col-span-3">
              <a className="text-sm text-primary underline" href={record.conversion_doc_url} target="_blank" rel="noreferrer">
                View conversion document
              </a>
            </div>
          )}
        </div>
      </Card>

      {!readOnly && (
        <Card className="p-5 mb-5">
          <h2 className="font-semibold mb-3">Follow-up</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Date &amp; Time</Label>
              <Input type="datetime-local" value={followupAt} onChange={(e) => setFollowupAt(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <Button className="mt-3" onClick={addFollowup}>Update</Button>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Activity</h2>
        {activities.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
        <ol className="space-y-3">
          {activities.map((a) => (
            <li key={a.id} className="border-l-2 border-primary/40 pl-3">
              <p className="text-sm">{a.description}</p>
              <p className="text-xs text-muted-foreground">
                {a.actor_name || "—"} · logged {formatDateTime(a.created_at)}
                {a.scheduled_at ? ` · scheduled ${formatDateTime(a.scheduled_at)}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convert to Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload a Document</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
              The opportunity converted to Lead
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button onClick={convert}><Upload className="h-4 w-4 mr-2" /> Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessOpportunityDetail;