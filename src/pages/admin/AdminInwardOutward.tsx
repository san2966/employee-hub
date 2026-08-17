import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, ExternalLink, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

const modeOptions = ["Courier", "Email", "Hand-delivery", "By Post"];

const AdminInwardOutward = () => {
  const { inwardRecords, outwardRecords, addInwardRecord, addOutwardRecord } = useAdminData();
  const { toast } = useToast();
  const [inwardDialogOpen, setInwardDialogOpen] = useState(false);
  const [outwardDialogOpen, setOutwardDialogOpen] = useState(false);
  
  const [inwardForm, setInwardForm] = useState({
    date: "",
    senderName: "",
    documentType: "",
    receiverName: "",
    modeOfReceipt: [] as string[],
    referenceNumber: "",
    remarks: "",
    document: "",
  });

  const [outwardForm, setOutwardForm] = useState({
    date: "",
    receiverName: "",
    documentType: "",
    senderName: "",
    modeOfDispatch: [] as string[],
    referenceNumber: "",
    remarks: "",
    document: "",
  });

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "inward" | "outward"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "inward") {
          setInwardForm({ ...inwardForm, document: reader.result as string });
        } else {
          setOutwardForm({ ...outwardForm, document: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModeChange = (mode: string, type: "inward" | "outward", checked: boolean) => {
    if (type === "inward") {
      setInwardForm({
        ...inwardForm,
        modeOfReceipt: checked 
          ? [...inwardForm.modeOfReceipt, mode]
          : inwardForm.modeOfReceipt.filter(m => m !== mode),
      });
    } else {
      setOutwardForm({
        ...outwardForm,
        modeOfDispatch: checked
          ? [...outwardForm.modeOfDispatch, mode]
          : outwardForm.modeOfDispatch.filter(m => m !== mode),
      });
    }
  };

  const handleInwardSubmit = () => {
    if (!inwardForm.date || !inwardForm.senderName || !inwardForm.receiverName) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    addInwardRecord({
      date: inwardForm.date,
      senderName: inwardForm.senderName,
      documentType: inwardForm.documentType,
      receiverName: inwardForm.receiverName,
      modeOfReceipt: inwardForm.modeOfReceipt,
      referenceNumber: inwardForm.referenceNumber,
      remarks: inwardForm.remarks,
      document: inwardForm.document,
    });

    setInwardForm({
      date: "", senderName: "", documentType: "", receiverName: "",
      modeOfReceipt: [], referenceNumber: "", remarks: "", document: "",
    });
    setInwardDialogOpen(false);
    toast({ title: "Success", description: "Inward record added successfully" });
  };

  const handleOutwardSubmit = () => {
    if (!outwardForm.date || !outwardForm.receiverName || !outwardForm.senderName) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    addOutwardRecord({
      date: outwardForm.date,
      receiverName: outwardForm.receiverName,
      documentType: outwardForm.documentType,
      senderName: outwardForm.senderName,
      modeOfDispatch: outwardForm.modeOfDispatch,
      referenceNumber: outwardForm.referenceNumber,
      remarks: outwardForm.remarks,
      document: outwardForm.document,
    });

    setOutwardForm({
      date: "", receiverName: "", documentType: "", senderName: "",
      modeOfDispatch: [], referenceNumber: "", remarks: "", document: "",
    });
    setOutwardDialogOpen(false);
    toast({ title: "Success", description: "Outward record added successfully" });
  };

  return (
    <AdminLayout title="Inward/Outward">
      <Tabs defaultValue="inward" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inward" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            Inward
          </TabsTrigger>
          <TabsTrigger value="outward" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Outward
          </TabsTrigger>
        </TabsList>

        {/* Inward Tab */}
        <TabsContent value="inward" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Inward Records</h3>
            <Dialog open={inwardDialogOpen} onOpenChange={setInwardDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Inward
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Inward Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={inwardForm.date}
                      onChange={(e) => setInwardForm({ ...inwardForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Sender Name/Organization *</Label>
                    <Input
                      value={inwardForm.senderName}
                      onChange={(e) => setInwardForm({ ...inwardForm, senderName: e.target.value })}
                      placeholder="Enter sender name"
                    />
                  </div>
                  <div>
                    <Label>Document/Package Type</Label>
                    <Input
                      value={inwardForm.documentType}
                      onChange={(e) => setInwardForm({ ...inwardForm, documentType: e.target.value })}
                      placeholder="Enter document type"
                    />
                  </div>
                  <div>
                    <Label>Receiver Name/Department *</Label>
                    <Input
                      value={inwardForm.receiverName}
                      onChange={(e) => setInwardForm({ ...inwardForm, receiverName: e.target.value })}
                      placeholder="Enter receiver name"
                    />
                  </div>
                  <div>
                    <Label>Mode of Receipt</Label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {modeOptions.map(mode => (
                        <label key={mode} className="flex items-center gap-2">
                          <Checkbox
                            checked={inwardForm.modeOfReceipt.includes(mode)}
                            onCheckedChange={(checked) => handleModeChange(mode, "inward", !!checked)}
                          />
                          <span className="text-sm">{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Reference Number</Label>
                    <Input
                      value={inwardForm.referenceNumber}
                      onChange={(e) => setInwardForm({ ...inwardForm, referenceNumber: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Remarks/Notes</Label>
                    <Textarea
                      value={inwardForm.remarks}
                      onChange={(e) => setInwardForm({ ...inwardForm, remarks: e.target.value })}
                      placeholder="Optional"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Upload Document</Label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "inward")}
                    />
                  </div>
                  <Button onClick={handleInwardSubmit} className="w-full">Save Record</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Document</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inwardRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inward records
                    </TableCell>
                  </TableRow>
                ) : (
                  inwardRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), "dd-MM-yyyy")}</TableCell>
                      <TableCell>{record.senderName}</TableCell>
                      <TableCell>{record.documentType || "-"}</TableCell>
                      <TableCell>{record.receiverName}</TableCell>
                      <TableCell>{record.modeOfReceipt.join(", ") || "-"}</TableCell>
                      <TableCell>
                        {record.document ? (
                          <a href={record.document} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Outward Tab */}
        <TabsContent value="outward" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Outward Records</h3>
            <Dialog open={outwardDialogOpen} onOpenChange={setOutwardDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Outward
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Outward Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={outwardForm.date}
                      onChange={(e) => setOutwardForm({ ...outwardForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Receiver Name/Department *</Label>
                    <Input
                      value={outwardForm.receiverName}
                      onChange={(e) => setOutwardForm({ ...outwardForm, receiverName: e.target.value })}
                      placeholder="Enter receiver name"
                    />
                  </div>
                  <div>
                    <Label>Document/Package Type</Label>
                    <Input
                      value={outwardForm.documentType}
                      onChange={(e) => setOutwardForm({ ...outwardForm, documentType: e.target.value })}
                      placeholder="Enter document type"
                    />
                  </div>
                  <div>
                    <Label>Sender Name/Organization *</Label>
                    <Input
                      value={outwardForm.senderName}
                      onChange={(e) => setOutwardForm({ ...outwardForm, senderName: e.target.value })}
                      placeholder="Enter sender name"
                    />
                  </div>
                  <div>
                    <Label>Mode of Dispatch</Label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {modeOptions.map(mode => (
                        <label key={mode} className="flex items-center gap-2">
                          <Checkbox
                            checked={outwardForm.modeOfDispatch.includes(mode)}
                            onCheckedChange={(checked) => handleModeChange(mode, "outward", !!checked)}
                          />
                          <span className="text-sm">{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Reference Number</Label>
                    <Input
                      value={outwardForm.referenceNumber}
                      onChange={(e) => setOutwardForm({ ...outwardForm, referenceNumber: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label>Remarks/Notes</Label>
                    <Textarea
                      value={outwardForm.remarks}
                      onChange={(e) => setOutwardForm({ ...outwardForm, remarks: e.target.value })}
                      placeholder="Optional"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Upload Document</Label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "outward")}
                    />
                  </div>
                  <Button onClick={handleOutwardSubmit} className="w-full">Save Record</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Document</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outwardRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No outward records
                    </TableCell>
                  </TableRow>
                ) : (
                  outwardRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), "dd-MM-yyyy")}</TableCell>
                      <TableCell>{record.receiverName}</TableCell>
                      <TableCell>{record.documentType || "-"}</TableCell>
                      <TableCell>{record.senderName}</TableCell>
                      <TableCell>{record.modeOfDispatch.join(", ") || "-"}</TableCell>
                      <TableCell>
                        {record.document ? (
                          <a href={record.document} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : "-"}
                      </TableCell>
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

export default AdminInwardOutward;
