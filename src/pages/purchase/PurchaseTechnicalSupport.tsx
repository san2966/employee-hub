import { useState } from "react";
import PurchaseLayout from "@/components/purchase/PurchaseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronRight } from "lucide-react";
import { usePurchaseInstallations, usePurchaseSupportTickets } from "@/hooks/usePurchaseData";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const installCheckboxes = [
  { key: "hardware_install", label: "Hardware Installation" },
  { key: "software_install", label: "Software Installation" },
  { key: "product_inspection", label: "Product Inspection" },
  { key: "training_done", label: "Training Done" },
];

const PurchaseTechnicalSupport = () => {
  const { data: installations, add: addInstall, update: updateInstall } = usePurchaseInstallations();
  const { data: tickets, add: addTicket, update: updateTicket } = usePurchaseSupportTickets();

  // Installation form
  const [installOpen, setInstallOpen] = useState(false);
  const [installForm, setInstallForm] = useState({ organization_name: "", work_order_no: "", amc: false, amc_start: "", amc_end: "", warranty_till: "" });
  const [expandedInstall, setExpandedInstall] = useState<string | null>(null);

  // Ticket form
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ org_name: "", issue: "", description: "", priority: "Medium" });
  const [modifyTicket, setModifyTicket] = useState<any>(null);
  const [ticketReport, setTicketReport] = useState("");

  const handleAddInstall = async () => {
    if (!installForm.organization_name.trim() || !installForm.work_order_no.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await addInstall({ ...installForm, created_by: user?.id });
    setInstallForm({ organization_name: "", work_order_no: "", amc: false, amc_start: "", amc_end: "", warranty_till: "" });
    setInstallOpen(false);
  };

  const handleInstallCheckbox = async (id: string, field: string, checked: boolean) => {
    const inst = installations.find((i: any) => i.id === id);
    if (!inst) return;
    const updated = { ...inst, [field]: checked };
    const count = installCheckboxes.filter(f => updated[f.key]).length;
    const progress = Math.round((count / installCheckboxes.length) * 100);
    await updateInstall(id, { [field]: checked, progress });
  };

  const handleAddTicket = async () => {
    if (!ticketForm.org_name.trim() || !ticketForm.issue.trim() || !ticketForm.description.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await addTicket({ ...ticketForm, created_by: user?.id });
    setTicketForm({ org_name: "", issue: "", description: "", priority: "Medium" });
    setTicketOpen(false);
  };

  const handleCompleteTicket = async () => {
    if (!modifyTicket) return;
    await updateTicket(modifyTicket.id, { status: "Completed", report: ticketReport, modified: true });
    setModifyTicket(null);
    setTicketReport("");
  };

  return (
    <PurchaseLayout title="Technical Support">
      <Tabs defaultValue="installation">
        <TabsList><TabsTrigger value="installation">Installation</TabsTrigger><TabsTrigger value="tickets">Support Tickets</TabsTrigger></TabsList>

        <TabsContent value="installation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Installations</span>
                <Dialog open={installOpen} onOpenChange={setInstallOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Installation</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Organization</Label><Input value={installForm.organization_name} onChange={e => setInstallForm(p => ({ ...p, organization_name: e.target.value }))} /></div>
                      <div><Label>Work Order No.</Label><Input value={installForm.work_order_no} onChange={e => setInstallForm(p => ({ ...p, work_order_no: e.target.value }))} /></div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={installForm.amc} onCheckedChange={c => setInstallForm(p => ({ ...p, amc: !!c }))} />
                        <Label>AMC</Label>
                      </div>
                      {installForm.amc && <>
                        <div><Label>AMC Start</Label><Input type="date" value={installForm.amc_start} onChange={e => setInstallForm(p => ({ ...p, amc_start: e.target.value }))} /></div>
                        <div><Label>AMC End</Label><Input type="date" value={installForm.amc_end} onChange={e => setInstallForm(p => ({ ...p, amc_end: e.target.value }))} /></div>
                      </>}
                      <div><Label>Warranty Till</Label><Input type="date" value={installForm.warranty_till} onChange={e => setInstallForm(p => ({ ...p, warranty_till: e.target.value }))} /></div>
                      <Button onClick={handleAddInstall} className="w-full">Save</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {installations.length === 0 ? <p className="text-center text-muted-foreground py-8">No installations</p> :
                installations.map((inst: any) => (
                  <div key={inst.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedInstall(expandedInstall === inst.id ? null : inst.id)}>
                      <div>
                        <h3 className="font-medium text-sm">{inst.organization_name}</h3>
                        <p className="text-xs text-muted-foreground">WO: {inst.work_order_no}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24"><Progress value={inst.progress} className="h-2" /></div>
                        <span className="text-xs font-medium">{inst.progress}%</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${expandedInstall === inst.id ? "rotate-90" : ""}`} />
                      </div>
                    </div>
                    {expandedInstall === inst.id && (
                      <div className="mt-4 space-y-2 border-t pt-4">
                        {installCheckboxes.map(f => (
                          <div key={f.key} className="flex items-center gap-2">
                            <Checkbox checked={inst[f.key]} onCheckedChange={c => handleInstallCheckbox(inst.id, f.key, !!c)} />
                            <span className="text-sm">{f.label}</span>
                          </div>
                        ))}
                        {inst.amc && <p className="text-xs mt-2">AMC: {inst.amc_start} → {inst.amc_end}</p>}
                        {inst.warranty_till && <p className="text-xs">Warranty: {inst.warranty_till}</p>}
                      </div>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Support Tickets</span>
                <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Ticket</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Support Ticket</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Organization</Label><Input value={ticketForm.org_name} onChange={e => setTicketForm(p => ({ ...p, org_name: e.target.value }))} /></div>
                      <div><Label>Issue</Label><Input value={ticketForm.issue} onChange={e => setTicketForm(p => ({ ...p, issue: e.target.value }))} /></div>
                      <div><Label>Description</Label><Textarea value={ticketForm.description} onChange={e => setTicketForm(p => ({ ...p, description: e.target.value }))} /></div>
                      <div>
                        <Label>Priority</Label>
                        <Select value={ticketForm.priority} onValueChange={v => setTicketForm(p => ({ ...p, priority: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddTicket} className="w-full">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Report</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No tickets</TableCell></TableRow> :
                      tickets.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell>{t.org_name}</TableCell>
                          <TableCell>{t.issue}</TableCell>
                          <TableCell className="max-w-32 truncate">{t.description}</TableCell>
                          <TableCell><Badge variant={t.priority === "High" ? "destructive" : t.priority === "Medium" ? "secondary" : "outline"}>{t.priority}</Badge></TableCell>
                          <TableCell><Badge variant={t.status === "Completed" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                          <TableCell className="text-xs">{t.created_at ? format(new Date(t.created_at), "PPp") : "-"}</TableCell>
                          <TableCell className="max-w-32 truncate">{t.report || "-"}</TableCell>
                          <TableCell>
                            {t.status !== "Completed" && (
                              <Button size="sm" variant="outline" onClick={() => { setModifyTicket(t); setTicketReport(""); }}>Modify</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modify Ticket Dialog */}
      <Dialog open={!!modifyTicket} onOpenChange={() => setModifyTicket(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modify Ticket: {modifyTicket?.issue}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Report</Label><Textarea value={ticketReport} onChange={e => setTicketReport(e.target.value)} placeholder="Enter report" /></div>
            <Button onClick={handleCompleteTicket} className="w-full">Complete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PurchaseLayout>
  );
};

export default PurchaseTechnicalSupport;
