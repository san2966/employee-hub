import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Car, Bike, Truck, Fuel, Users } from "lucide-react";
import { format } from "date-fns";

const vehicleTypeIcons: Record<string, React.ElementType> = {
  Bike: Bike,
  Car: Car,
  Other: Truck,
};

const AdminVehicles = () => {
  const {
    vehicles, vehicleAssignments, fuelEntries, employees,
    addVehicle, deleteVehicle, addVehicleAssignment, addFuelEntry
  } = useAdminData();
  const { toast } = useToast();

  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [fuelDialogOpen, setFuelDialogOpen] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    type: "" as "Bike" | "Car" | "Other" | "",
    brand: "",
    model: "",
    numberPlate: "",
  });

  const [assignForm, setAssignForm] = useState({
    vehicleId: "",
    date: "",
    employeeName: "",
    previousKm: "",
    currentKm: "",
    image: "",
  });

  const [fuelForm, setFuelForm] = useState({
    vehicleId: "",
    date: "",
    quantity: "",
    amount: "",
  });

  const hrEmployees = JSON.parse(localStorage.getItem("hr_employees") || "[]");
  const allEmployees = [
    ...employees.map(e => ({ id: e.id, name: e.name })),
    ...hrEmployees.map((e: any) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })),
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssignForm({ ...assignForm, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVehicle = () => {
    if (!vehicleForm.type || !vehicleForm.brand || !vehicleForm.model || !vehicleForm.numberPlate) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    addVehicle({
      type: vehicleForm.type as "Bike" | "Car" | "Other",
      brand: vehicleForm.brand,
      model: vehicleForm.model,
      numberPlate: vehicleForm.numberPlate,
    });

    setVehicleForm({ type: "", brand: "", model: "", numberPlate: "" });
    setVehicleDialogOpen(false);
    toast({ title: "Success", description: "Vehicle added successfully" });
  };

  const handleAssignVehicle = () => {
    if (!assignForm.vehicleId || !assignForm.date || !assignForm.employeeName || !assignForm.previousKm || !assignForm.currentKm) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const vehicle = vehicles.find(v => v.id === assignForm.vehicleId);
    
    addVehicleAssignment({
      vehicleId: assignForm.vehicleId,
      vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.numberPlate})` : "",
      date: assignForm.date,
      employeeName: assignForm.employeeName,
      previousKm: parseFloat(assignForm.previousKm),
      currentKm: parseFloat(assignForm.currentKm),
      image: assignForm.image,
    });

    setAssignForm({ vehicleId: "", date: "", employeeName: "", previousKm: "", currentKm: "", image: "" });
    setAssignDialogOpen(false);
    toast({ title: "Success", description: "Vehicle assignment recorded" });
  };

  const handleAddFuelEntry = () => {
    if (!fuelForm.vehicleId || !fuelForm.date || !fuelForm.quantity || !fuelForm.amount) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const vehicle = vehicles.find(v => v.id === fuelForm.vehicleId);

    addFuelEntry({
      vehicleId: fuelForm.vehicleId,
      vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.numberPlate})` : "",
      date: fuelForm.date,
      quantity: parseFloat(fuelForm.quantity),
      amount: parseFloat(fuelForm.amount),
    });

    setFuelForm({ vehicleId: "", date: "", quantity: "", amount: "" });
    setFuelDialogOpen(false);
    toast({ title: "Success", description: "Fuel entry recorded" });
  };

  return (
    <AdminLayout title="Vehicle Management">
      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicle List</TabsTrigger>
          <TabsTrigger value="assignments">Assign Vehicle</TabsTrigger>
          <TabsTrigger value="fuel">Petrol/Diesel Entry</TabsTrigger>
        </TabsList>

        {/* Vehicle List Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Registered Vehicles</h3>
            <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Vehicle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Vehicle Type *</Label>
                    <Select
                      value={vehicleForm.type}
                      onValueChange={(v) => setVehicleForm({ ...vehicleForm, type: v as "Bike" | "Car" | "Other" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bike">Bike</SelectItem>
                        <SelectItem value="Car">Car</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Brand *</Label>
                    <Input
                      value={vehicleForm.brand}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                      placeholder="Enter brand name"
                    />
                  </div>
                  <div>
                    <Label>Model *</Label>
                    <Input
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      placeholder="Enter model"
                    />
                  </div>
                  <div>
                    <Label>Number Plate *</Label>
                    <Input
                      value={vehicleForm.numberPlate}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, numberPlate: e.target.value })}
                      placeholder="Enter number plate"
                    />
                  </div>
                  <Button onClick={handleAddVehicle} className="w-full">Add Vehicle</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                No vehicles registered yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map(vehicle => {
                const VehicleIcon = vehicleTypeIcons[vehicle.type] || Car;
                return (
                  <Card key={vehicle.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <VehicleIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{vehicle.brand} {vehicle.model}</CardTitle>
                            <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteVehicle(vehicle.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="font-mono text-lg">{vehicle.numberPlate}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Assign Vehicle Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Vehicle Assignments</h3>
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Assign Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Vehicle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Vehicle *</Label>
                    <Select
                      value={assignForm.vehicleId}
                      onValueChange={(v) => setAssignForm({ ...assignForm, vehicleId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.length === 0 ? (
                          <SelectItem value="none" disabled>No vehicles available</SelectItem>
                        ) : (
                          vehicles.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.brand} {v.model} ({v.numberPlate})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={assignForm.date}
                      onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Employee Name *</Label>
                    <Select
                      value={assignForm.employeeName}
                      onValueChange={(v) => setAssignForm({ ...assignForm, employeeName: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Previous Km *</Label>
                      <Input
                        type="number"
                        value={assignForm.previousKm}
                        onChange={(e) => setAssignForm({ ...assignForm, previousKm: e.target.value })}
                        placeholder="Enter km"
                      />
                    </div>
                    <div>
                      <Label>Current Km *</Label>
                      <Input
                        type="number"
                        value={assignForm.currentKm}
                        onChange={(e) => setAssignForm({ ...assignForm, currentKm: e.target.value })}
                        placeholder="Enter km"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Upload Image (Optional)</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} />
                  </div>
                  <Button onClick={handleAssignVehicle} className="w-full">Record Assignment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Previous Km</TableHead>
                  <TableHead>Current Km</TableHead>
                  <TableHead>Distance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No assignments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicleAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{format(new Date(assignment.date), "PP")}</TableCell>
                      <TableCell>{assignment.vehicleInfo}</TableCell>
                      <TableCell>{assignment.employeeName}</TableCell>
                      <TableCell>{assignment.previousKm.toLocaleString()} km</TableCell>
                      <TableCell>{assignment.currentKm.toLocaleString()} km</TableCell>
                      <TableCell className="font-medium">
                        {(assignment.currentKm - assignment.previousKm).toLocaleString()} km
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Fuel Entry Tab */}
        <TabsContent value="fuel" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Fuel Entries</h3>
            <Dialog open={fuelDialogOpen} onOpenChange={setFuelDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Fuel className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Fuel Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Vehicle *</Label>
                    <Select
                      value={fuelForm.vehicleId}
                      onValueChange={(v) => setFuelForm({ ...fuelForm, vehicleId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.length === 0 ? (
                          <SelectItem value="none" disabled>No vehicles available</SelectItem>
                        ) : (
                          vehicles.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.brand} {v.model} ({v.numberPlate})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={fuelForm.date}
                      onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantity (Ltr) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={fuelForm.quantity}
                        onChange={(e) => setFuelForm({ ...fuelForm, quantity: e.target.value })}
                        placeholder="Enter liters"
                      />
                    </div>
                    <div>
                      <Label>Amount (₹) *</Label>
                      <Input
                        type="number"
                        value={fuelForm.amount}
                        onChange={(e) => setFuelForm({ ...fuelForm, amount: e.target.value })}
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddFuelEntry} className="w-full">Add Entry</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Rate/Ltr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No fuel entries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  fuelEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.date), "PP")}</TableCell>
                      <TableCell>{entry.vehicleInfo}</TableCell>
                      <TableCell>{entry.quantity} Ltr</TableCell>
                      <TableCell>₹{entry.amount.toLocaleString()}</TableCell>
                      <TableCell>₹{(entry.amount / entry.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminVehicles;
