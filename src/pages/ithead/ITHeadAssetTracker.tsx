import { useState, useMemo } from "react";
import ITHeadLayout from "@/components/ithead/ITHeadLayout";
import { useITHeadData, ITAsset } from "@/hooks/useITHeadData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { UserPlus, HardDrive, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const ITHeadAssetTracker = () => {
  const { assets, assetAssignments, createAssetAssignment, deleteAssetAssignment, uploadITFile } = useITHeadData();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ITAsset | null>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [recordFile, setRecordFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [typeFilter, setTypeFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  // Latest assignment per asset for "Currently With"
  const currentByAsset = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assetAssignments) {
      if (!map.has(a.assetId)) map.set(a.assetId, a.assignedTo);
    }
    return map;
  }, [assetAssignments]);

  const assetTypes = Array.from(new Set(assets.map(a => a.type))).filter(Boolean);
  const brands = Array.from(new Set(assets.map(a => a.brand))).filter(Boolean);

  const openAssign = (asset: ITAsset) => {
    setSelectedAsset(asset);
    setAssignedTo("");
    setRecordFile(null);
    setDialogOpen(true);
  };

  const submitAssign = async () => {
    if (!selectedAsset || !assignedTo.trim()) {
      toast({ title: "Missing info", description: "Please enter the person to assign to", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let recordUrl: string | undefined;
      if (recordFile) {
        recordUrl = await uploadITFile(recordFile, "assignments");
      }
      await createAssetAssignment(selectedAsset.id, assignedTo.trim(), recordUrl);
      toast({ title: "Assigned", description: `Asset assigned to ${assignedTo}` });
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const filteredAssignments = assetAssignments.filter(r => {
    if (!r.asset) return false;
    if (typeFilter !== "all" && r.asset.type !== typeFilter) return false;
    if (brandFilter !== "all" && r.asset.brand !== brandFilter) return false;
    return true;
  });

  return (
    <ITHeadLayout title="Asset Tracker">
      <Tabs defaultValue="assign" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="assign">Assign Asset</TabsTrigger>
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
        </TabsList>

        {/* Assign Asset */}
        <TabsContent value="assign">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Registration Number</th>
                      <th className="px-4 py-3 text-left font-medium">Photo</th>
                      <th className="px-4 py-3 text-left font-medium">Asset Type</th>
                      <th className="px-4 py-3 text-left font-medium">S/N</th>
                      <th className="px-4 py-3 text-left font-medium">Brand</th>
                      <th className="px-4 py-3 text-left font-medium">Model</th>
                      <th className="px-4 py-3 text-left font-medium">Currently With</th>
                      <th className="px-4 py-3 text-left font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        <HardDrive className="h-8 w-8 mx-auto mb-2" />No assets yet
                      </td></tr>
                    ) : assets.map(a => (
                      <tr key={a.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{a.registrationNumber}</td>
                        <td className="px-4 py-3">
                          {a.photo ? (
                            <img src={a.photo} alt={a.model} className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <HardDrive className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">{a.type}</td>
                        <td className="px-4 py-3 font-mono text-xs">{a.serialNumber}</td>
                        <td className="px-4 py-3">{a.brand}</td>
                        <td className="px-4 py-3">{a.model}</td>
                        <td className="px-4 py-3">{currentByAsset.get(a.id) || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" onClick={() => openAssign(a)}>
                            <UserPlus className="h-3 w-3 mr-1" />Assign
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracker */}
        <TabsContent value="tracker">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="w-56">
                <Label className="text-xs">Asset Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {assetTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <Label className="text-xs">Brand Name</Label>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Registration</th>
                        <th className="px-4 py-3 text-left font-medium">Type</th>
                        <th className="px-4 py-3 text-left font-medium">Brand</th>
                        <th className="px-4 py-3 text-left font-medium">Model</th>
                        <th className="px-4 py-3 text-left font-medium">Assigned To</th>
                        <th className="px-4 py-3 text-left font-medium">Record</th>
                        <th className="px-4 py-3 text-left font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No assignment records</td></tr>
                      ) : filteredAssignments.map(r => (
                        <tr key={r.id} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-3">{r.assignedAt ? format(new Date(r.assignedAt), "PP") : ""}</td>
                          <td className="px-4 py-3 font-mono text-xs">{r.asset?.registrationNumber}</td>
                          <td className="px-4 py-3">{r.asset?.type}</td>
                          <td className="px-4 py-3">{r.asset?.brand}</td>
                          <td className="px-4 py-3">{r.asset?.model}</td>
                          <td className="px-4 py-3">{r.assignedTo}</td>
                          <td className="px-4 py-3">
                            {r.recordUrl ? (
                              <a href={r.recordUrl} target="_blank" rel="noreferrer" className="text-primary underline">View</a>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAssetAssignment(r.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{selectedAsset.brand} {selectedAsset.model}</p>
                <p className="text-xs font-mono text-muted-foreground">{selectedAsset.registrationNumber}</p>
              </div>
              <div className="space-y-2">
                <Label>Assigned To *</Label>
                <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Employee name" />
              </div>
              <div className="space-y-2">
                <Label>Upload Record (Optional)</Label>
                <Input type="file" onChange={(e) => setRecordFile(e.target.files?.[0] || null)} />
                {recordFile && <p className="text-xs text-muted-foreground">Selected: {recordFile.name}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitAssign} disabled={saving}>{saving ? "Saving..." : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ITHeadLayout>
  );
};

export default ITHeadAssetTracker;