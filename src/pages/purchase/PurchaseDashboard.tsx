import { useState } from "react";
import PurchaseLayout from "@/components/purchase/PurchaseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, Trash2, Bell, CalendarPlus } from "lucide-react";
import { usePurchaseProjects, usePurchaseQuotes, usePurchaseDispatches, usePurchaseEvents } from "@/hooks/usePurchaseData";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FolderKanban, FileCheck2, Truck, CalendarDays } from "lucide-react";

const checkboxFields = [
  { key: "vendor_discussion", label: "Vendor Discussion" },
  { key: "quotes_final", label: "Quotes Final" },
  { key: "proforma_invoice", label: "Proforma Invoice" },
  { key: "purchase_order", label: "Purchase Order" },
  { key: "supply_done", label: "Supply Done" },
  { key: "installation_done", label: "Installation Done" },
  { key: "dc_report_done", label: "DC Report Done" },
  { key: "training_done", label: "Training Done" },
];

const PurchaseDashboard = () => {
  const { data: projects, add: addProject, update: updateProject, remove: removeProject } = usePurchaseProjects();
  const { data: quotes } = usePurchaseQuotes();
  const { data: dispatches } = usePurchaseDispatches();
  const { data: events, add: addEvent, remove: removeEvent } = usePurchaseEvents();

  const [addOpen, setAddOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", organization_name: "", product_name: "" });
  const [eventForm, setEventForm] = useState({ title: "", description: "", event_date: "" });

  const handleAddProject = async () => {
    if (!form.name.trim() || !form.organization_name.trim() || !form.product_name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await addProject({ ...form, created_by: user?.id });
    setForm({ name: "", organization_name: "", product_name: "" });
    setAddOpen(false);
  };

  const handleCheckboxChange = async (projectId: string, field: string, checked: boolean) => {
    const project = projects.find((p: any) => p.id === projectId);
    if (!project) return;
    const updated = { ...project, [field]: checked };
    const completedCount = checkboxFields.filter(f => updated[f.key]).length;
    const progress = Math.round((completedCount / checkboxFields.length) * 100);
    await updateProject(projectId, { [field]: checked, progress });
  };

  const handleAddEvent = async () => {
    if (!eventForm.title.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await addEvent({ ...eventForm, created_by: user?.id });
    setEventForm({ title: "", description: "", event_date: "" });
    setEventOpen(false);
  };

  // Notifications from quotes and dispatches
  const notifications = [
    ...quotes.filter((q: any) => q.status === "Approved" || q.status === "Rejected").map((q: any) => ({
      text: `Quote ${q.quote_id}: ${q.status}`,
      date: q.updated_at,
    })),
    ...dispatches.filter((d: any) => d.status === "Delivered").map((d: any) => ({
      text: `Dispatch ${d.work_order_no}: Delivered`,
      date: d.delivered_date,
    })),
  ].slice(0, 10);

  return (
    <PurchaseLayout title="Dashboard">
      <div className="space-y-6">
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-1">Purchase Overview</h2>
          <p className="opacity-90">Projects, quotes and dispatches in one place</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Projects" value={projects.length} icon={FolderKanban} tone="primary"
            sub={`Avg progress ${projects.length ? Math.round(projects.reduce((s: number, p: any) => s + (p.progress || 0), 0) / projects.length) : 0}%`} />
          <KpiCard label="Quotes" value={quotes.length} icon={FileCheck2} tone="success"
            sub={`${quotes.filter((q: any) => q.status === "Approved").length} approved`} />
          <KpiCard label="Dispatches" value={dispatches.length} icon={Truck} tone="warning"
            sub={`${dispatches.filter((d: any) => d.status === "Delivered").length} delivered`} />
          <KpiCard label="Upcoming Events" value={events.length} icon={CalendarDays} tone="muted" />
        </div>

        {/* Project Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Project Tracking</span>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Project</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Project Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Project name" /></div>
                    <div><Label>Organization Name</Label><Input value={form.organization_name} onChange={e => setForm(p => ({ ...p, organization_name: e.target.value }))} placeholder="Organization" /></div>
                    <div><Label>Product Name</Label><Input value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} placeholder="Product" /></div>
                    <Button onClick={handleAddProject} className="w-full">Submit</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No projects yet</p>
              ) : projects.map((project: any) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}>
                    <div>
                      <h3 className="font-medium text-sm">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">{project.organization_name} • {project.product_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <Progress value={project.progress} className="h-2" />
                      </div>
                      <span className="text-xs font-medium">{project.progress}%</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${expandedProject === project.id ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                  {expandedProject === project.id && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      {checkboxFields.map(field => (
                        <div key={field.key} className="flex items-center gap-2">
                          <Checkbox checked={project[field.key]} onCheckedChange={(checked) => handleCheckboxChange(project.id, field.key, !!checked)} />
                          <span className="text-sm">{field.label}</span>
                        </div>
                      ))}
                      {project.progress === 100 && (
                        <Button size="sm" variant="destructive" className="mt-2" onClick={() => removeProject(project.id)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete Project
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><CalendarPlus className="h-5 w-5 text-primary" /> Events</span>
                <Dialog open={eventOpen} onOpenChange={setEventOpen}>
                  <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Title</Label><Input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} /></div>
                      <div><Label>Description</Label><Input value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} /></div>
                      <div><Label>Date</Label><Input type="date" value={eventForm.event_date} onChange={e => setEventForm(p => ({ ...p, event_date: e.target.value }))} /></div>
                      <Button onClick={handleAddEvent} className="w-full">Save</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-y-auto space-y-2">
              {events.length === 0 ? <p className="text-sm text-muted-foreground">No events</p> : events.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.event_date} {e.description && `• ${e.description}`}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeEvent(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5 text-primary" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-y-auto space-y-2">
              {notifications.length === 0 ? <p className="text-sm text-muted-foreground">No notifications</p> : notifications.map((n, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">{n.text}</p>
                  <p className="text-xs text-muted-foreground">{n.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PurchaseLayout>
  );
};

export default PurchaseDashboard;
