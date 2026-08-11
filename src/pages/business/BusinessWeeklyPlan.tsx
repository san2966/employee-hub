import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessAuth } from "@/hooks/useBusinessAuth";
import { useBusinessCollection, getWeekStart, dayName, formatDate } from "@/hooks/useBusinessData";

const PLAN_STATUS = ["Tentative", "Fixed", "Optional"];

const BusinessWeeklyPlan = () => {
  const { toast } = useToast();
  const { profile, isHead, isDirector } = useBusinessAuth();
  const { rows: plans, refresh } = useBusinessCollection<any>("business_weekly_plans", { orderBy: "plan_date", ascending: true });
  const { rows: staff } = useBusinessCollection<any>("business_profiles", { orderBy: "name", ascending: true });
  const { rows: empPlans } = useBusinessCollection<any>("business_employee_plans");

  const weekStart = getWeekStart();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ plan_date: "", visit_plan: "", plan_status: "Tentative", assignee_ids: [] as string[] });
  const [preview, setPreview] = useState<any>(null);
  const [myOpen, setMyOpen] = useState(false);
  const [myForm, setMyForm] = useState<any>({ date: "", visit_plan: "", plan_status: "Tentative" });
  const [myRows, setMyRows] = useState<any[]>([]);

  const isStaff = !isHead && !isDirector;
  const mySubmission = useMemo(
    () => empPlans.find((e) => e.profile_id === profile?.id && e.week_start === weekStart),
    [empPlans, profile?.id, weekStart],
  );
  const mySubmitted = mySubmission?.status === "Submitted";

  useEffect(() => {
    setMyRows((mySubmission?.rows as any[]) ?? []);
  }, [mySubmission?.id, mySubmission?.rows]);

  const myGrouped = useMemo(() => {
    const map = new Map<string, any[]>();
    [...myRows].sort((a, b) => (a.date || "").localeCompare(b.date || "")).forEach((r) => {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    });
    return Array.from(map.entries());
  }, [myRows]);

  const saveMyRow = () => {
    if (!myForm.date || !myForm.visit_plan.trim()) {
      toast({ title: "Date and visit plan are required", variant: "destructive" });
      return;
    }
    setMyRows((r) => [...r, { ...myForm }]);
    setMyForm({ date: "", visit_plan: "", plan_status: "Tentative" });
    setMyOpen(false);
  };

  const publishMyPlan = async () => {
    if (!profile?.id) return;
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      profile_id: profile.id,
      week_start: weekStart,
      rows: myRows,
      status: "Submitted",
      submitted_at: new Date().toISOString(),
      created_by: user?.id ?? null,
    };
    const { error } = mySubmission
      ? await (supabase as any).from("business_employee_plans").update(payload).eq("id", mySubmission.id)
      : await (supabase as any).from("business_employee_plans").insert(payload);
    if (error) { toast({ title: "Publish failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Weekly plan published" });
  };

  const nameOf = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";
  const current = useMemo(() => plans.filter((p) => p.week_start === weekStart), [plans, weekStart]);
  const history = useMemo(() => plans.filter((p) => p.week_start !== weekStart), [plans, weekStart]);
  const published = current.some((p) => p.published);

  // Head: remind every 10 minutes after 17:00 until published.
  useEffect(() => {
    if (!isHead || published) return;
    const tick = () => {
      if (new Date().getHours() >= 17) {
        toast({ title: "Weekly plan pending", description: "Please publish this week's visit plan." });
      }
    };
    tick();
    const t = setInterval(tick, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [isHead, published, toast]);

  // Staff: remind every 10 minutes after 11:00 until their plan is uploaded.
  useEffect(() => {
    if (!isStaff || mySubmitted) return;
    const tick = () => {
      if (new Date().getHours() >= 11) {
        toast({ title: "Weekly plan pending", description: "Please add and publish your visit plan for this week." });
      }
    };
    tick();
    const t = setInterval(tick, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [isStaff, mySubmitted, toast]);

  const save = async () => {
    if (!form.plan_date || !form.visit_plan.trim()) {
      toast({ title: "Date and visit plan are required", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("business_weekly_plans").insert({
      week_start: getWeekStart(new Date(`${form.plan_date}T00:00:00`)),
      plan_date: form.plan_date, visit_plan: form.visit_plan, plan_status: form.plan_status,
      assignee_ids: form.assignee_ids, published: false, created_by: user?.id ?? null,
    });
    if (error) { toast({ title: "Could not save plan", description: error.message, variant: "destructive" }); return; }
    setOpen(false);
    setForm({ plan_date: "", visit_plan: "", plan_status: "Tentative", assignee_ids: [] });
    void refresh();
  };

  const publish = async () => {
    const { error } = await (supabase as any)
      .from("business_weekly_plans").update({ published: true }).eq("week_start", weekStart);
    if (error) { toast({ title: "Publish failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Weekly plan published" });
    void refresh();
  };

  const rowsToRender = isHead ? current : current.filter((p) => p.published);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    rowsToRender.forEach((p) => {
      const list = map.get(p.plan_date) ?? [];
      list.push(p);
      map.set(p.plan_date, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rowsToRender]);

  return (
    <BusinessLayout title="Weekly Plan">
      <Tabs defaultValue="plan">
        <TabsList>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4 mt-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Final Plan · week of {formatDate(weekStart)}</h2>
              {isHead && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add</Button>}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Day</TableHead>
                    <TableHead>Visit Plan</TableHead><TableHead>Assignee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.map(([date, items]) =>
                    items.map((p, i) => (
                      <TableRow key={p.id}>
                        {i === 0 && (
                          <>
                            <TableCell rowSpan={items.length} className="align-top font-medium">{formatDate(date)}</TableCell>
                            <TableCell rowSpan={items.length} className="align-top">{dayName(date)}</TableCell>
                          </>
                        )}
                        <TableCell>{p.visit_plan} <span className="text-muted-foreground">({p.plan_status})</span></TableCell>
                        <TableCell className="text-sm">{(p.assignee_ids || []).map(nameOf).join(", ") || "—"}</TableCell>
                      </TableRow>
                    )),
                  )}
                  {grouped.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No plan entries yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {isHead && current.length > 0 && !published && (
              <Button className="mt-4" onClick={publish}>Publish</Button>
            )}
            {published && <Badge className="mt-4">Published</Badge>}
          </Card>

          {(isHead || isDirector) && (
            <Card className="p-5">
              <h2 className="font-semibold mb-3">Employee Plan</h2>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Employee Name</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {staff.filter((s) => s.designation !== "business_head").map((s) => {
                    const sub = empPlans.find((e) => e.profile_id === s.id && e.week_start === weekStart);
                    return (
                      <TableRow key={s.id}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell><Badge variant={sub ? "default" : "secondary"}>{sub ? "Submitted" : "Pending"}</Badge></TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" disabled={!sub} onClick={() => setPreview({ staff: s, sub })}>Preview</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {isStaff && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">My Plan · week of {formatDate(weekStart)}</h2>
                <Button size="sm" onClick={() => setMyOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead><TableHead>Day</TableHead>
                      <TableHead>Visit Plan</TableHead><TableHead>Assignee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myGrouped.map(([date, items]) =>
                      items.map((r: any, i: number) => (
                        <TableRow key={`${date}-${i}`}>
                          {i === 0 && (
                            <>
                              <TableCell rowSpan={items.length} className="align-top font-medium">{formatDate(date)}</TableCell>
                              <TableCell rowSpan={items.length} className="align-top">{dayName(date)}</TableCell>
                            </>
                          )}
                          <TableCell>{r.visit_plan} <span className="text-muted-foreground">({r.plan_status})</span></TableCell>
                          <TableCell className="text-sm">{profile?.name}</TableCell>
                        </TableRow>
                      )),
                    )}
                    {myGrouped.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No plan entries yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {myRows.length > 0 && (
                <div className="flex items-center gap-3 mt-4">
                  <Button onClick={publishMyPlan}>Publish</Button>
                  {mySubmitted && <Badge>Published</Badge>}
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="p-5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead><TableHead>Date</TableHead><TableHead>Day</TableHead>
                  <TableHead>Visit Plan</TableHead><TableHead>Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.week_start)}</TableCell>
                    <TableCell>{formatDate(p.plan_date)}</TableCell>
                    <TableCell>{dayName(p.plan_date)}</TableCell>
                    <TableCell>{p.visit_plan} ({p.plan_status})</TableCell>
                    <TableCell className="text-sm">{(p.assignee_ids || []).map(nameOf).join(", ") || "—"}</TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No history yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Visit Plan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date</Label><Input type="date" value={form.plan_date} onChange={(e) => setForm({ ...form, plan_date: e.target.value })} /></div>
            <div><Label>Visit Plan</Label><Input value={form.visit_plan} onChange={(e) => setForm({ ...form, visit_plan: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.plan_status} onValueChange={(v) => setForm({ ...form, plan_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLAN_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assignee</Label>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1.5 mt-1">
                {staff.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.assignee_ids.includes(s.id)}
                      onCheckedChange={() => setForm((f: any) => ({
                        ...f,
                        assignee_ids: f.assignee_ids.includes(s.id)
                          ? f.assignee_ids.filter((x: string) => x !== s.id)
                          : [...f.assignee_ids, s.id],
                      }))}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{preview?.staff?.name} — Weekly Plan</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Day</TableHead><TableHead>Visit Plan</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {(preview?.sub?.rows ?? []).map((r: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell>{r.date ? dayName(r.date) : "—"}</TableCell>
                  <TableCell>{r.visit_plan}</TableCell>
                </TableRow>
              ))}
              {(preview?.sub?.rows ?? []).length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No rows submitted.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessWeeklyPlan;