import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Phone, MapPin } from "lucide-react";

const AdminUserManagement = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useAdminData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    designation: "",
    phone: "",
    alternatePhone: "",
    address: "",
    photo: "",
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Error", description: "Photo size must be less than 2MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.designation || !form.phone || !form.address) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateEmployee(editingId, form);
      toast({ title: "Success", description: "Employee updated successfully" });
    } else {
      addEmployee(form);
      toast({ title: "Success", description: "Employee added successfully" });
    }

    resetForm();
  };

  const resetForm = () => {
    setForm({ name: "", designation: "", phone: "", alternatePhone: "", address: "", photo: "" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleEdit = (employee: typeof employees[0]) => {
    setForm({
      name: employee.name,
      designation: employee.designation,
      phone: employee.phone,
      alternatePhone: employee.alternatePhone || "",
      address: employee.address,
      photo: employee.photo,
    });
    setEditingId(employee.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    toast({ title: "Deleted", description: "Employee removed successfully" });
  };

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Employee Directory</h2>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Employee" : "Add New Employee"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={form.photo} />
                      <AvatarFallback className="text-2xl">{form.name.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1 rounded-full cursor-pointer">
                      <Pencil className="h-4 w-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>
                <div>
                  <Label>Employee Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label>Designation *</Label>
                  <Input
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Enter designation"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Primary phone"
                    />
                  </div>
                  <div>
                    <Label>Alternate Number</Label>
                    <Input
                      value={form.alternatePhone}
                      onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <Label>Address *</Label>
                  <Textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Update Employee" : "Add Employee"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {employees.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No employees added yet. Click "Add Employee" to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map(employee => (
              <Card key={employee.id} className="overflow-hidden">
                <div className="bg-primary/10 p-6 flex justify-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={employee.photo} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {employee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardContent className="pt-4">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{employee.designation}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{employee.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="line-clamp-2">{employee.address}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${employee.source === "hr" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                      {employee.source === "hr" ? "Added by HR" : "Added by Admin"}
                    </span>
                  </div>
                  {employee.source !== "hr" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(employee)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Modify
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserManagement;
