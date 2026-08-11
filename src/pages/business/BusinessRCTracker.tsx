import { useMemo, useState } from "react";
import { Plus, PhoneCall } from "lucide-react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";
import { useBusinessCollection, formatDate, formatDateTime } from "@/hooks/useBusinessData";

const RC_STATUS = ["Pending", "No Answer", "Contacted"];
const CALL_STATUS = ["Connected", "Not Received"];
const CHECKS: { key: string; label: string; options: string[] }[] = [
  { key: "craft_operational", label: "Craft Operational", options: ["Yes", "Faulty", "No"] },
  { key: "battery_run_time", label: "Battery Run Time", options: ["Good", "Faulty", "Weak"] },
  { key: "charging_socket", label: "Craft Charging socket during operation", options: ["Dry & closed", "In Problem"] },
  { key: "proper_storage", label: "Proper Storage", options: ["Working, Stored Properly", "Issue"] },
  { key: "rescue_remote", label: "Rescue Craft Remote", options: ["Working, Stored Properly", "Issue"] },
  { key: "emergency_ready", label: "Emergency Ready", options: ["Yes", "No"] },
];

const emptyRecord = { rc_code: "", organization_name: "", location_name: "", operator_name: "", contact: "" };
const emptyCall = {
  status: "Connected", craft_operational: "", battery_run_time: "", charging_socket: "",
  proper_storage: "", rescue_remote: "", emergency_ready: "", output: "",
};

const codeOf = (r: any, list: any[]) =>
  r.rc_code || `RC-${String(list.length - list.findIndex((x) => x.id === r.id)).padStart(4, "0")}`;

const BusinessRCTracker = () => {
  const { toast } = useToast();
  const { profile, isHead } = useBusinessAuth();
  const canEdit = isHead || profile?.designation === "rc_technical";
  const { rows, refresh } = useBusinessCollection<any>("business_rc_tracker");
  const { rows: calls } = useBusinessCollection<any>("business_rc_calls");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyRecord);
  const [callFor, setCallFor] = useState<any>(null);
  const [callForm, setCallForm] = useState<any>(emptyCall);

  const [fOrg, setFOrg] = useState("");
  const [fId, setFId] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [tOrg, setTOrg] = useState("");
  const [tId, setTId] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const match = (r: any, org: string, id: string) =>
    (!org.trim() || (r.organization_name || "").toLowerCase().includes(org.trim().toLowerCase())) &&
    (!id.trim() || codeOf(r, rows).toLowerCase().includes(id.trim().toLowerCase()));

  const followupRows = useMemo(
    () => rows.filter((r) => match(r, fOrg, fId)).filter((r) => fStatus === "all" || r.status === fStatus),
    [rows, fOrg, fId, fStatus],
  );
  const trackerRows = useMemo(() => rows.filter((r) => match(r, tOrg, tId)), [rows, tOrg, tId]);
  const selectedCalls = useMemo(
    () => calls.filter((c) => c.rc_id === selected?.id),
    [calls, selected?.id],
  );

  const save = async () => {
    if (!form.organization_name.trim() || !form.location_name.trim()) {
      toast({ title: "Organization and location are required", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("business_rc_tracker").insert({
      ...form, status: "Pending", created_by: user?.id ?? null,
    });
    if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    else { toast({ title: "Record added" }); setForm(emptyRecord); setOpen(false); void refresh(); }
  };

  const submitCall = async () => {
    if (!callFor) return;
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = {
      rc_id: callFor.id, status: callForm.status, output: callForm.output || null,
      caller_name: profile?.name ?? null, created_by: user?.id ?? null,
    };
    if (callForm.status === "Connected") {
      CHECKS.forEach((c) => { payload[c.key] = callForm[c.key] || null; });
    }
    const { error } = await (supabase as any).from("business_rc_calls").insert(payload);
    if (error) { toast({ title: "Could not save call", description: error.message, variant: "destructive" }); return; }
    await (supabase as any).from("business_rc_tracker").update({
      status: callForm.status === "Connected" ? "Contacted" : "No Answer",
      last_contacted: new Date().toISOString().slice(0, 10),
    }).eq("id", callFor.id);
    toast({ title: "Call recorded" });
    setCallFor(null); setCallForm(emptyCall); void refresh();
  };

  const ReadOnlyTable = (
    <Card className="p-0 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead><TableHead>Organization Name</TableHead><TableHead>Location Name</TableHead>
            <TableHead>Operator Name</TableHead><TableHead>Contact</TableHead>
            <TableHead>Last Contacted</TableHead><TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No records yet</TableCell></TableRow>
          )}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-xs text-muted-foreground">{codeOf(r, rows)}</TableCell>
              <TableCell className="font-medium">{r.organization_name}</TableCell>
              <TableCell>{r.location_name}</TableCell>
              <TableCell>{r.operator_name || "—"}</TableCell>
              <TableCell>{r.contact || "—"}</TableCell>
              <TableCell>{formatDate(r.last_contacted)}</TableCell>
              <TableCell><Badge variant={r.status === "Contacted" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  if (!canEdit) return <BusinessLayout title="RC Tracker">{ReadOnlyTable}</BusinessLayout>;

  return (
    <BusinessLayout title="RC Tracker">
      <Tabs defaultValue="followup">
        <TabsList>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="followup" className="space-y-4 mt-4">
          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-4 items-end">
              <div><Label className="text-xs">Organization Name</Label>
                <Input value={fOrg} onChange={(e) => setFOrg(e.target.value)} placeholder="Search organization" /></div>
              <div><Label className="text-xs">ID</Label>
                <Input value={fId} onChange={(e) => setFId(e.target.value)} placeholder="RC-0001" /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={fStatus} onValueChange={setFStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem>
                    {RC_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select></div>
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
          </Card>

          <Card className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead><TableHead>Organization Name</TableHead><TableHead>Location Name</TableHead>
                  <TableHead>Operator Name</TableHead><TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead><TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followupRows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No records</TableCell></TableRow>
                )}
                {followupRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground">{codeOf(r, rows)}</TableCell>
                    <TableCell className="font-medium">{r.organization_name}</TableCell>
                    <TableCell>{r.location_name}</TableCell>
                    <TableCell>{r.operator_name || "—"}</TableCell>
                    <TableCell>{r.contact || "—"}</TableCell>
                    <TableCell><Badge variant={r.status === "Contacted" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setCallFor(r); setCallForm(emptyCall); }}>
                        <PhoneCall className="h-4 w-4 mr-1" /> Call
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="tracker" className="space-y-4 mt-4">
          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label className="text-xs">Organization Name</Label>
                <Input value={tOrg} onChange={(e) => setTOrg(e.target.value)} placeholder="Search organization" /></div>
              <div><Label className="text-xs">ID</Label>
                <Input value={tId} onChange={(e) => setTId(e.target.value)} placeholder="RC-0001" /></div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-0 overflow-x-auto lg:col-span-1">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>ID</TableHead><TableHead>Organization</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {trackerRows.map((r) => (
                    <TableRow key={r.id} className={`cursor-pointer ${selected?.id === r.id ? "bg-muted" : ""}`}
                      onClick={() => setSelected(r)}>
                      <TableCell className="text-xs text-muted-foreground">{codeOf(r, rows)}</TableCell>
                      <TableCell className="font-medium">{r.organization_name}</TableCell>
                    </TableRow>
                  ))}
                  {trackerRows.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-5 lg:col-span-2">
              {!selected ? (
                <p className="text-sm text-muted-foreground">Select a record to view its call history.</p>
              ) : (
                <>
                  <h2 className="font-semibold">{selected.organization_name} · {codeOf(selected, rows)}</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {selected.location_name} · {selected.operator_name || "—"} · {selected.contact || "—"}
                  </p>
                  {selectedCalls.length === 0 && <p className="text-sm text-muted-foreground">No calls logged yet.</p>}
                  <div className="space-y-3">
                    {selectedCalls.map((c) => (
                      <div key={c.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={c.status === "Connected" ? "default" : "secondary"}>{c.status}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)} · {c.caller_name || "—"}</span>
                        </div>
                        {c.status === "Connected" && (
                          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
                            {CHECKS.map((chk) => (
                              <p key={chk.key}>
                                <span className="text-muted-foreground">{chk.label}: </span>{c[chk.key] || "—"}
                              </p>
                            ))}
                          </div>
                        )}
                        {c.output && <p className="text-sm mt-2"><span className="text-muted-foreground">Output: </span>{c.output}</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add RC Record</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>ID</Label>
              <Input value={form.rc_code} onChange={(e) => setForm({ ...form, rc_code: e.target.value })} /></div>
            <div className="space-y-2"><Label>Organization Name</Label>
              <Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Location Name</Label>
              <Input value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Operator Name</Label>
              <Input value={form.operator_name} onChange={(e) => setForm({ ...form, operator_name: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Contact</Label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!callFor} onOpenChange={(o) => !o && setCallFor(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Call · {callFor?.organization_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Status</Label>
              <Select value={callForm.status} onValueChange={(v) => setCallForm({ ...callForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CALL_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {callForm.status === "Connected" && CHECKS.map((chk) => (
              <div key={chk.key}>
                <Label>{chk.label}</Label>
                <Select value={callForm[chk.key] || undefined} onValueChange={(v) => setCallForm({ ...callForm, [chk.key]: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{chk.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            {callForm.status === "Connected" && (
              <div><Label>Output</Label>
                <Textarea rows={3} value={callForm.output} onChange={(e) => setCallForm({ ...callForm, output: e.target.value })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallFor(null)}>Cancel</Button>
            <Button onClick={submitCall}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessRCTracker;
