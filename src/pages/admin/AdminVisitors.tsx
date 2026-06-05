import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ExportButtons } from "@/components/ExportButtons";
import { EXPORT_COLUMNS } from "@/lib/exportUtils";

const purposeOptions = ["Meeting", "Presentation", "VIP", "Business Related", "Other"];

const AdminVisitors = () => {
  const { visitors, addVisitor, deleteVisitor } = useAdminData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    organization: "",
    whomToMeet: "",
    purpose: "",
    purposeDescription: "",
  });

  const handleNext = () => {
    if (!form.name || !form.mobile || !form.organization) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.whomToMeet || !form.purpose) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (form.purpose === "Other" && !form.purposeDescription) {
      toast({ title: "Error", description: "Please describe the purpose", variant: "destructive" });
      return;
    }

    try {
      await addVisitor({
        name: form.name,
        mobile: form.mobile,
        organization: form.organization,
        whomToMeet: form.whomToMeet,
        purpose: form.purpose,
        purposeDescription: form.purposeDescription,
      });
      setForm({ name: "", mobile: "", organization: "", whomToMeet: "", purpose: "", purposeDescription: "" });
      setStep(1);
      setDialogOpen(false);
      toast({ title: "Success", description: "Visitor added successfully" });
    } catch (e: any) {
      toast({
        title: "Failed to add visitor",
        description: e?.message || "Database rejected the request",
        variant: "destructive",
      });
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || format(new Date(visitor.checkInTime), "yyyy-MM-dd") === dateFilter;
    return matchesSearch && matchesDate;
  });

  return (
    <AdminLayout title="Visitor Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search visitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setStep(1);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Visitor
              </Button>
            </DialogTrigger>
          <ExportButtons
            portal="Admin"
            type="Visitors"
            columns={EXPORT_COLUMNS.visitors}
            data={filteredVisitors}
          />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Visitor - Step {step}/2</DialogTitle>
              </DialogHeader>
              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <Label>Visitor Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter visitor name"
                    />
                  </div>
                  <div>
                    <Label>Mobile Number *</Label>
                    <Input
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div>
                    <Label>Organization *</Label>
                    <Input
                      value={form.organization}
                      onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      placeholder="Enter organization name"
                    />
                  </div>
                  <Button onClick={handleNext} className="w-full">Next</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Whom to Meet *</Label>
                    <Input
                      value={form.whomToMeet}
                      onChange={(e) => setForm({ ...form, whomToMeet: e.target.value })}
                      placeholder="Enter name of person to meet"
                    />
                  </div>
                  <div>
                    <Label>Purpose *</Label>
                    <Select
                      value={form.purpose}
                      onValueChange={(value) => setForm({ ...form, purpose: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposeOptions.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.purpose === "Other" && (
                    <div>
                      <Label>Describe Purpose *</Label>
                      <Textarea
                        value={form.purposeDescription}
                        onChange={(e) => setForm({ ...form, purposeDescription: e.target.value })}
                        placeholder="Describe the purpose of visit"
                        rows={3}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button onClick={handleSubmit} className="flex-1">Submit</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Meeting With</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No visitors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="font-medium">{visitor.name}</TableCell>
                    <TableCell>{visitor.mobile}</TableCell>
                    <TableCell>{visitor.organization}</TableCell>
                    <TableCell>{visitor.whomToMeet}</TableCell>
                    <TableCell>
                      {visitor.purpose}
                      {visitor.purposeDescription && (
                        <span className="text-xs text-muted-foreground block">
                          {visitor.purposeDescription}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(visitor.checkInTime), "PPp")}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteVisitor(visitor.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminVisitors;
