import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessCollection } from "@/hooks/useBusinessData";

const BusinessAreas = () => {
  const { toast } = useToast();
  const { rows, refresh } = useBusinessCollection<any>("business_areas", { orderBy: "state", ascending: true });
  const [open, setOpen] = useState(false);
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");

  const save = async () => {
    if (!district.trim() || !state.trim()) {
      toast({ title: "District and State are required", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any)
      .from("business_areas")
      .insert({ district: district.trim(), state: state.trim() });
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Area added" });
    setDistrict(""); setState(""); setOpen(false);
    void refresh();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from("business_areas").delete().eq("id", id);
    if (error) toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    else { toast({ title: "Area deleted" }); void refresh(); }
  };

  return (
    <BusinessLayout title="Areas">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{rows.length} area(s) available for employee assignment</p>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>District</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="w-24 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                <MapPin className="h-6 w-6 mx-auto mb-2 opacity-50" /> No areas added yet
              </TableCell></TableRow>
            )}
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.district}</TableCell>
                <TableCell>{a.state}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Area</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>District</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Pune" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Maharashtra" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessAreas;