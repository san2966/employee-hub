import { useState } from "react";
import PurchaseLayout from "@/components/purchase/PurchaseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, CheckCircle } from "lucide-react";
import { usePurchaseDispatches, useUploadFile } from "@/hooks/usePurchaseData";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const PurchaseDispatch = () => {
  const { data: dispatches, add, update } = usePurchaseDispatches();
  const { upload } = useUploadFile();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    work_order_no: "", organization_name: "", transporter_name: "",
    eway_bill_no: "", vehicle_no: "", dispatched_date: "", expected_date: "",
  });
  const [ewayFile, setEwayFile] = useState<File | null>(null);

  const handleAdd = async () => {
    if (!form.work_order_no.trim() || !form.organization_name.trim() || !form.transporter_name.trim() || !form.dispatched_date) return;
    let eway_bill_url = null;
    if (ewayFile) {
      eway_bill_url = await upload(ewayFile, "dispatches", 10);
      if (!eway_bill_url) return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const status = new Date(form.dispatched_date) > new Date() ? "Pending" : "In Transit";
    await add({ ...form, eway_bill_url, status, created_by: user?.id });
    setForm({ work_order_no: "", organization_name: "", transporter_name: "", eway_bill_no: "", vehicle_no: "", dispatched_date: "", expected_date: "" });
    setEwayFile(null);
    setAddOpen(false);
  };

  const handleDelivered = async (id: string) => {
    await update(id, { status: "Delivered", delivered_date: format(new Date(), "yyyy-MM-dd") });
  };

  const getStatusVariant = (s: string) => {
    if (s === "Delivered") return "default";
    if (s === "In Transit") return "secondary";
    return "outline";
  };

  return (
    <PurchaseLayout title="Dispatch Management">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dispatches</span>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Dispatch</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Dispatch</DialogTitle></DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  <div><Label>Work Order No. *</Label><Input value={form.work_order_no} onChange={e => setForm(p => ({ ...p, work_order_no: e.target.value }))} /></div>
                  <div><Label>Organization *</Label><Input value={form.organization_name} onChange={e => setForm(p => ({ ...p, organization_name: e.target.value }))} /></div>
                  <div><Label>Transporter *</Label><Input value={form.transporter_name} onChange={e => setForm(p => ({ ...p, transporter_name: e.target.value }))} /></div>
                  <div><Label>E-way Bill No.</Label><Input value={form.eway_bill_no} onChange={e => setForm(p => ({ ...p, eway_bill_no: e.target.value }))} /></div>
                  <div><Label>E-way Bill PDF (&lt;10MB)</Label><Input type="file" accept=".pdf" onChange={e => setEwayFile(e.target.files?.[0] || null)} /></div>
                  <div><Label>Vehicle No.</Label><Input value={form.vehicle_no} onChange={e => setForm(p => ({ ...p, vehicle_no: e.target.value }))} /></div>
                  <div><Label>Dispatched Date *</Label><Input type="date" value={form.dispatched_date} onChange={e => setForm(p => ({ ...p, dispatched_date: e.target.value }))} /></div>
                  <div><Label>Expected Date</Label><Input type="date" value={form.expected_date} onChange={e => setForm(p => ({ ...p, expected_date: e.target.value }))} /></div>
                  <Button onClick={handleAdd} className="w-full">Submit</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dispatches.length === 0 ? <p className="text-sm text-muted-foreground col-span-full text-center py-8">No dispatches yet</p> :
              dispatches.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">WO: {d.work_order_no}</h3>
                      <Badge variant={getStatusVariant(d.status) as any}>{d.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{d.organization_name}</p>
                    <p className="text-xs">Transporter: {d.transporter_name}</p>
                    {d.vehicle_no && <p className="text-xs">Vehicle: {d.vehicle_no}</p>}
                    <p className="text-xs">Dispatched: {d.dispatched_date}</p>
                    {d.expected_date && <p className="text-xs">Expected: {d.expected_date}</p>}
                    {d.delivered_date && <p className="text-xs text-green-600">Delivered: {d.delivered_date}</p>}
                    <div className="flex gap-2 mt-2">
                      {d.status !== "Delivered" && (
                        <Button size="sm" variant="outline" onClick={() => handleDelivered(d.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Delivery Done
                        </Button>
                      )}
                      {d.eway_bill_url && (
                        <Button size="sm" variant="outline" asChild><a href={d.eway_bill_url} download><Download className="h-3 w-3 mr-1" /> E-way Bill</a></Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </PurchaseLayout>
  );
};

export default PurchaseDispatch;
