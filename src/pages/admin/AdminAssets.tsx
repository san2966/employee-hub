import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, UserPlus, Package } from "lucide-react";
import { format } from "date-fns";

const categoryOptions = ["Furniture", "Stationary", "Accessories", "Miscellaneous", "Other"];
const conditionOptions = ["New", "Good", "Fair", "Poor"];

const AdminAssets = () => {
  const { assets, employees, addAsset, updateAsset, deleteAsset } = useAdminData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningAsset, setAssigningAsset] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    brand: "",
    serialNumber: "",
    purchaseDate: "",
    cost: "",
    invoiceNumber: "",
    vendorName: "",
    warrantyExpiry: "",
    condition: "",
    image: "",
  });

  const allEmployees = employees.map(e => ({ id: e.id, name: e.name }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Error", description: "Image size must be less than 2MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.category || !form.purchaseDate || !form.cost || !form.condition) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const assetData = {
      name: form.name,
      category: form.category,
      brand: form.brand,
      serialNumber: form.serialNumber,
      purchaseDate: form.purchaseDate,
      cost: parseFloat(form.cost),
      invoiceNumber: form.invoiceNumber,
      vendorName: form.vendorName,
      warrantyExpiry: form.warrantyExpiry,
      condition: form.condition,
      image: form.image,
    };

    if (editingId) {
      updateAsset(editingId, assetData);
      toast({ title: "Success", description: "Asset updated successfully" });
    } else {
      addAsset(assetData);
      toast({ title: "Success", description: "Asset added successfully" });
    }

    resetForm();
  };

  const resetForm = () => {
    setForm({
      name: "", category: "", brand: "", serialNumber: "",
      purchaseDate: "", cost: "", invoiceNumber: "", vendorName: "",
      warrantyExpiry: "", condition: "", image: "",
    });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleEdit = (asset: typeof assets[0]) => {
    setForm({
      name: asset.name,
      category: asset.category,
      brand: asset.brand || "",
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate,
      cost: asset.cost.toString(),
      invoiceNumber: asset.invoiceNumber || "",
      vendorName: asset.vendorName || "",
      warrantyExpiry: asset.warrantyExpiry || "",
      condition: asset.condition,
      image: asset.image || "",
    });
    setEditingId(asset.id);
    setDialogOpen(true);
  };

  const handleAssign = () => {
    if (!assignTo || !assigningAsset) {
      toast({ title: "Error", description: "Please select an employee", variant: "destructive" });
      return;
    }

    updateAsset(assigningAsset, { assignedTo: assignTo });
    setAssignTo("");
    setAssigningAsset(null);
    setAssignDialogOpen(false);
    toast({ title: "Success", description: "Asset assigned successfully" });
  };

  return (
    <AdminLayout title="Asset Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Asset Inventory</h2>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Asset" : "Add New Asset"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Asset Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter asset name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Condition *</Label>
                    <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map(cond => (
                          <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Brand/Model</Label>
                    <Input
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Serial Number</Label>
                    <Input
                      value={form.serialNumber}
                      onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Purchase Date *</Label>
                    <Input
                      type="date"
                      value={form.purchaseDate}
                      onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Cost (₹) *</Label>
                    <Input
                      type="number"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                      placeholder="Enter cost"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Number</Label>
                    <Input
                      value={form.invoiceNumber}
                      onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Vendor Name</Label>
                    <Input
                      value={form.vendorName}
                      onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <Label>Warranty Expiry Date</Label>
                  <Input
                    type="date"
                    value={form.warrantyExpiry}
                    onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Upload Image</Label>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Update Asset" : "Add Asset"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assign Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Employee/Department</Label>
                <Select value={assignTo} onValueChange={setAssignTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {allEmployees.length === 0 ? (
                      <SelectItem value="none" disabled>No employees available</SelectItem>
                    ) : (
                      allEmployees.map(emp => (
                        <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssign} className="w-full">Assign</Button>
            </div>
          </DialogContent>
        </Dialog>

        {assets.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No assets added yet. Click "Add Asset" to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map(asset => (
              <Card key={asset.id}>
                {asset.image && (
                  <div className="h-32 overflow-hidden rounded-t-lg">
                    <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{asset.name}</CardTitle>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">{asset.category}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-muted">{asset.condition}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {asset.brand && <p><span className="text-muted-foreground">Brand:</span> {asset.brand}</p>}
                  <p><span className="text-muted-foreground">Cost:</span> ₹{asset.cost.toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Purchased:</span> {format(new Date(asset.purchaseDate), "dd-MM-yyyy")}</p>
                  {asset.assignedTo && (
                    <p className="font-medium text-primary">Assigned to: {asset.assignedTo}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssigningAsset(asset.id);
                        setAssignDialogOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(asset)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteAsset(asset.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAssets;
