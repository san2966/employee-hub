import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HRLayout from "@/components/hr/HRLayout";
import { useHRData, Employee } from "@/hooks/useHRData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, Users, X, Mail, Phone, GraduationCap, Briefcase } from "lucide-react";

const ManageEmployee = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("id");
  const { employees, updateEmployee, deleteEmployee } = useHRData();
  const { toast } = useToast();

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; employee: Employee | null; reason: string }>({
    open: false,
    employee: null,
    reason: "",
  });

  const handleEdit = (employee: Employee) => {
    setEditingEmployee({ ...employee });
  };

  const handleSaveEdit = () => {
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, editingEmployee);
      toast({
        title: "Employee Updated",
        description: `${editingEmployee.name}'s information has been updated.`,
      });
      setEditingEmployee(null);
    }
  };

  const handleDeleteClick = (employee: Employee) => {
    setDeleteDialog({ open: true, employee, reason: "" });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.employee && deleteDialog.reason.trim()) {
      deleteEmployee(deleteDialog.employee.id, deleteDialog.reason);
      toast({
        title: "Employee Deleted",
        description: `${deleteDialog.employee.name} has been removed from the system.`,
      });
      setDeleteDialog({ open: false, employee: null, reason: "" });
    } else {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for deletion.",
        variant: "destructive",
      });
    }
  };

  const updateEditField = (field: keyof Employee, value: string) => {
    if (editingEmployee) {
      setEditingEmployee({ ...editingEmployee, [field]: value });
    }
  };

  return (
    <HRLayout title="Manage Employees">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Employee Management</h2>
            <p className="text-muted-foreground">View, edit, or remove employee records</p>
          </div>
          <Button onClick={() => navigate("/hr/employee-add")}>
            Add New Employee
          </Button>
        </div>

        {/* Employee Cards */}
        {employees.length === 0 ? (
          <div className="bg-card rounded-xl border p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Employees</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding employees to the system.
            </p>
            <Button onClick={() => navigate("/hr/employee-add")}>
              Add Employee
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`
                  bg-card rounded-xl border shadow-sm overflow-hidden transition-all duration-300
                  ${highlightedId === employee.id ? 'ring-2 ring-primary' : ''}
                `}
              >
                {/* Card Header with Actions */}
                <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="p-2 rounded-lg bg-white/80 hover:bg-white text-primary transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(employee)}
                      className="p-2 rounded-lg bg-white/80 hover:bg-white text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {employee.photo ? (
                      <img
                        src={employee.photo}
                        alt={employee.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold border-2 border-white shadow-md">
                        {employee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.designation}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">@</span>
                    <span className="text-foreground">{employee.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{employee.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{employee.degreeName}</span>
                  </div>
                  {employee.specialization && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{employee.specialization}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
            </DialogHeader>
            {editingEmployee && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingEmployee.name}
                    onChange={(e) => updateEditField("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    value={editingEmployee.designation}
                    onChange={(e) => updateEditField("designation", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editingEmployee.email}
                    onChange={(e) => updateEditField("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editingEmployee.phone}
                    onChange={(e) => updateEditField("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={editingEmployee.username}
                    onChange={(e) => updateEditField("username", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={editingEmployee.password}
                    onChange={(e) => updateEditField("password", e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    value={editingEmployee.address}
                    onChange={(e) => updateEditField("address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Input
                    value={editingEmployee.degreeName}
                    onChange={(e) => updateEditField("degreeName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input
                    value={editingEmployee.specialization}
                    onChange={(e) => updateEditField("specialization", e.target.value)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingEmployee(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, employee: null, reason: "" })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Employee</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete <strong>{deleteDialog.employee?.name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="space-y-2">
                <Label>Reason for Deletion *</Label>
                <Textarea
                  value={deleteDialog.reason}
                  onChange={(e) => setDeleteDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please provide a reason for deletion..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, employee: null, reason: "" })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </HRLayout>
  );
};

export default ManageEmployee;
