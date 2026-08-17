import { useState } from "react";
import ITHeadLayout from "@/components/ithead/ITHeadLayout";
import { useITHeadData, ITAsset } from "@/hooks/useITHeadData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Laptop, 
  Monitor, 
  Server, 
  Wifi, 
  Camera,
  Edit2,
  Trash2,
  UserPlus,
  HardDrive
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const assetTypes = [
  "Laptop",
  "Desktop",
  "All-In-One",
  "Interactive Flat Panel",
  "Router",
  "Firewall",
  "Switch",
  "PoE",
  "Access Point",
  "DVR",
  "Camera",
  "EPBAX",
  "Other"
];

const computeTypes = ["Laptop", "Desktop", "All-In-One", "Interactive Flat Panel"];

const getAssetIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "laptop":
      return Laptop;
    case "desktop":
    case "all-in-one":
      return Monitor;
    case "router":
    case "switch":
    case "poe":
    case "access point":
    case "firewall":
      return Wifi;
    case "camera":
    case "dvr":
      return Camera;
    default:
      return HardDrive;
  }
};

const ITHeadAssets = () => {
  const { assets, addAsset, updateAsset, deleteAsset, generateRegistrationNumber, uploadITFile } = useITHeadData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ITAsset | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: "",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    invoiceUrl: "",
    photo: "",
    processor: "",
    ramSize: "",
    ramSerial: "",
    storageType: "SSD",
    storageSize: "",
    storageSerial: "",
    motherboardModel: "",
    motherboardSerial: "",
    displayModel: "",
    displaySerial: "",
    macAddress: "",
    warrantyTill: ""
  });
  const [assetCondition, setAssetCondition] = useState<"new" | "old">("new");
  const [manualRegNumber, setManualRegNumber] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const resetForm = () => {
    setFormData({
      type: "",
      brand: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      invoiceUrl: "",
      photo: "",
      processor: "",
      ramSize: "",
      ramSerial: "",
      storageType: "SSD",
      storageSize: "",
      storageSerial: "",
      motherboardModel: "",
      motherboardSerial: "",
      displayModel: "",
      displaySerial: "",
      macAddress: "",
      warrantyTill: ""
    });
    setAssetCondition("new");
    setManualRegNumber("");
    setPhotoFile(null);
    setEditingId(null);
  };

  const isComputeDevice = computeTypes.includes(formData.type);

  const handleAddAsset = async () => {
    if (!formData.type || !formData.brand || !formData.model || !formData.serialNumber) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    if (assetCondition === "old" && !manualRegNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Registration number is required for old assets",
        variant: "destructive",
      });
      return;
    }

    let photoUrl = formData.photo;
    if (photoFile) {
      try {
        setPhotoUploading(true);
        photoUrl = await uploadITFile(photoFile, "asset-photos");
      } catch (e: any) {
        toast({ title: "Photo upload failed", description: e.message, variant: "destructive" });
        setPhotoUploading(false);
        return;
      }
      setPhotoUploading(false);
    }

    await addAsset({
      type: formData.type,
      brand: formData.brand,
      model: formData.model,
      serialNumber: formData.serialNumber,
      purchaseDate: formData.purchaseDate,
      invoiceUrl: formData.invoiceUrl || undefined,
      photo: photoUrl || undefined,
      processor: formData.processor || undefined,
      ramSize: formData.ramSize || undefined,
      ramSerial: formData.ramSerial || undefined,
      storageType: formData.storageType || undefined,
      storageSize: formData.storageSize || undefined,
      storageSerial: formData.storageSerial || undefined,
      motherboardModel: formData.motherboardModel || undefined,
      motherboardSerial: formData.motherboardSerial || undefined,
      displayModel: formData.displayModel || undefined,
      displaySerial: formData.displaySerial || undefined,
      macAddress: formData.macAddress || undefined,
      warrantyTill: formData.warrantyTill,
      registrationNumber: assetCondition === "old" ? manualRegNumber.trim() : undefined,
    } as any);

    toast({
      title: "Asset Added",
      description: "New asset has been registered successfully"
    });

    resetForm();
    setIsAddOpen(false);
  };

  const openModify = (asset: ITAsset) => {
    setSelectedAsset(asset);
    setEditingId(asset.id);
    setFormData({
      type: asset.type || "",
      brand: asset.brand || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate || "",
      invoiceUrl: asset.invoiceUrl || "",
      photo: asset.photo || "",
      processor: asset.processor || "",
      ramSize: asset.ramSize || "",
      ramSerial: asset.ramSerial || "",
      storageType: asset.storageType || "SSD",
      storageSize: asset.storageSize || "",
      storageSerial: asset.storageSerial || "",
      motherboardModel: asset.motherboardModel || "",
      motherboardSerial: asset.motherboardSerial || "",
      displayModel: asset.displayModel || "",
      displaySerial: asset.displaySerial || "",
      macAddress: asset.macAddress || "",
      warrantyTill: asset.warrantyTill || "",
    });
    setPhotoFile(null);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    let photoUrl = formData.photo;
    if (photoFile) {
      try {
        setPhotoUploading(true);
        photoUrl = await uploadITFile(photoFile, "asset-photos");
      } catch (e: any) {
        toast({ title: "Photo upload failed", description: e.message, variant: "destructive" });
        setPhotoUploading(false);
        return;
      }
      setPhotoUploading(false);
    }
    await updateAsset(editingId, {
      type: formData.type, brand: formData.brand, model: formData.model,
      serialNumber: formData.serialNumber, purchaseDate: formData.purchaseDate,
      invoiceUrl: formData.invoiceUrl, photo: photoUrl, processor: formData.processor,
      ramSize: formData.ramSize, ramSerial: formData.ramSerial,
      storageType: formData.storageType, storageSize: formData.storageSize,
      storageSerial: formData.storageSerial, motherboardModel: formData.motherboardModel,
      motherboardSerial: formData.motherboardSerial, displayModel: formData.displayModel,
      displaySerial: formData.displaySerial, macAddress: formData.macAddress,
      warrantyTill: formData.warrantyTill,
    });
    toast({ title: "Asset Updated", description: "Asset information saved" });
    resetForm();
    setIsEditOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteAsset(id);
    toast({
      title: "Asset Deleted",
      description: "Asset has been removed from inventory"
    });
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <ITHeadLayout title="Asset Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {assetTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => {
              const Icon = getAssetIcon(asset.type);
              return (
                <Card key={asset.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {asset.photo ? (
                        <img src={asset.photo} alt={asset.model} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {asset.brand} {asset.model}
                        </h3>
                        <p className="text-xs text-muted-foreground">{asset.type}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs">
                            <span className="text-muted-foreground">Reg:</span>{" "}
                            <span className="font-mono">{asset.registrationNumber}</span>
                          </p>
                          <p className="text-xs">
                            <span className="text-muted-foreground">S/N:</span>{" "}
                            <span className="font-mono">{asset.serialNumber}</span>
                          </p>
                          {asset.warrantyTill && (
                            <p className="text-xs">
                              <span className="text-muted-foreground">Warranty:</span>{" "}
                              {format(new Date(asset.warrantyTill), "dd-MM-yyyy")}
                            </p>
                          )}
                        </div>
                        {asset.assignedToName && (
                          <div className="mt-2 px-2 py-1 bg-primary/10 rounded text-xs">
                            Assigned to: <span className="font-medium">{asset.assignedToName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openModify(asset)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Modify
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(asset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterType !== "all" 
                  ? "No assets match your search criteria" 
                  : "No assets registered yet. Add your first asset!"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Asset Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Upload Photo</Label>
                <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                {photoFile && <p className="text-xs text-muted-foreground">Selected: {photoFile.name}</p>}
              </div>

              {/* Condition: New vs Old */}
              <div className="space-y-2">
                <Label>Asset Condition *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assetCondition"
                      value="new"
                      checked={assetCondition === "new"}
                      onChange={() => setAssetCondition("new")}
                    />
                    <span className="text-sm">New (auto-generate Registration Number)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assetCondition"
                      value="old"
                      checked={assetCondition === "old"}
                      onChange={() => setAssetCondition("old")}
                    />
                    <span className="text-sm">Old (enter existing Registration Number)</span>
                  </label>
                </div>
              </div>

              {assetCondition === "old" && (
                <div className="space-y-2">
                  <Label>Registration Number *</Label>
                  <Input
                    value={manualRegNumber}
                    onChange={(e) => setManualRegNumber(e.target.value)}
                    placeholder="Enter existing registration number"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Type *</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Brand Name *</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g., Dell, HP, Cisco"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Model name/number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number *</Label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="Device serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warranty Till</Label>
                  <Input
                    type="date"
                    value={formData.warrantyTill}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyTill: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Invoice URL (Optional)</Label>
                <Input
                  value={formData.invoiceUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceUrl: e.target.value }))}
                  placeholder="Link to invoice document"
                />
              </div>

              {/* Compute Device Fields */}
              {isComputeDevice && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-sm mb-3">Hardware Specifications</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Processor</Label>
                      <Input
                        value={formData.processor}
                        onChange={(e) => setFormData(prev => ({ ...prev, processor: e.target.value }))}
                        placeholder="e.g., Intel i7-12700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>MAC Address</Label>
                      <Input
                        value={formData.macAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, macAddress: e.target.value }))}
                        placeholder="e.g., 00:1A:2B:3C:4D:5E"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>RAM Size</Label>
                      <Input
                        value={formData.ramSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, ramSize: e.target.value }))}
                        placeholder="e.g., 16GB DDR4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>RAM Serial</Label>
                      <Input
                        value={formData.ramSerial}
                        onChange={(e) => setFormData(prev => ({ ...prev, ramSerial: e.target.value }))}
                        placeholder="RAM module serial"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Storage Type</Label>
                      <Select value={formData.storageType} onValueChange={(val) => setFormData(prev => ({ ...prev, storageType: val }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SSD">SSD</SelectItem>
                          <SelectItem value="HDD">HDD</SelectItem>
                          <SelectItem value="NVMe">NVMe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Storage Size</Label>
                      <Input
                        value={formData.storageSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, storageSize: e.target.value }))}
                        placeholder="e.g., 512GB"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Storage Serial</Label>
                      <Input
                        value={formData.storageSerial}
                        onChange={(e) => setFormData(prev => ({ ...prev, storageSerial: e.target.value }))}
                        placeholder="Storage serial"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Motherboard Model</Label>
                      <Input
                        value={formData.motherboardModel}
                        onChange={(e) => setFormData(prev => ({ ...prev, motherboardModel: e.target.value }))}
                        placeholder="Motherboard model"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Motherboard Serial</Label>
                      <Input
                        value={formData.motherboardSerial}
                        onChange={(e) => setFormData(prev => ({ ...prev, motherboardSerial: e.target.value }))}
                        placeholder="Motherboard serial"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Display Model</Label>
                      <Input
                        value={formData.displayModel}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayModel: e.target.value }))}
                        placeholder="Monitor/Display model"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Serial</Label>
                      <Input
                        value={formData.displaySerial}
                        onChange={(e) => setFormData(prev => ({ ...prev, displaySerial: e.target.value }))}
                        placeholder="Display serial"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Preview Registration Number */}
              {assetCondition === "new" && formData.brand && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Registration Number (auto-generated)</p>
                  <p className="font-mono text-sm">{generateRegistrationNumber(formData.brand)}</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsAddOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAddAsset}>Add Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modify Asset Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Modify Asset</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {selectedAsset && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-mono">{selectedAsset.registrationNumber}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Upload Photo</Label>
                <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                {formData.photo && !photoFile && (
                  <img src={formData.photo} alt="current" className="h-16 w-16 rounded object-cover" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Type *</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {assetTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <Input value={formData.brand} onChange={(e) => setFormData(p => ({ ...p, brand: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Input value={formData.model} onChange={(e) => setFormData(p => ({ ...p, model: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number *</Label>
                  <Input value={formData.serialNumber} onChange={(e) => setFormData(p => ({ ...p, serialNumber: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Date</Label>
                  <Input type="date" value={formData.purchaseDate} onChange={(e) => setFormData(p => ({ ...p, purchaseDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Warranty Till</Label>
                  <Input type="date" value={formData.warrantyTill} onChange={(e) => setFormData(p => ({ ...p, warrantyTill: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Invoice URL</Label>
                <Input value={formData.invoiceUrl} onChange={(e) => setFormData(p => ({ ...p, invoiceUrl: e.target.value }))} />
              </div>
              {isComputeDevice && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2"><Label>Processor</Label><Input value={formData.processor} onChange={(e) => setFormData(p => ({ ...p, processor: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>RAM Size</Label><Input value={formData.ramSize} onChange={(e) => setFormData(p => ({ ...p, ramSize: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Storage Size</Label><Input value={formData.storageSize} onChange={(e) => setFormData(p => ({ ...p, storageSize: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>MAC Address</Label><Input value={formData.macAddress} onChange={(e) => setFormData(p => ({ ...p, macAddress: e.target.value }))} /></div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsEditOpen(false); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={photoUploading}>{photoUploading ? "Uploading..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ITHeadLayout>
  );
};

export default ITHeadAssets;
