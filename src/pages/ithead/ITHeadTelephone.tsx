import { useState, useRef } from "react";
import ITHeadLayout from "@/components/ithead/ITHeadLayout";
import { useITHeadData } from "@/hooks/useITHeadData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Image as ImageIcon, Trash2, Phone, ZoomIn, X, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ITHeadTelephone = () => {
  const { 
    telephoneImages, 
    telephoneEntries, 
    addTelephoneImage, 
    deleteTelephoneImage,
    addTelephoneEntry,
    updateTelephoneEntry,
    deleteTelephoneEntry 
  } = useITHeadData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddImageOpen, setIsAddImageOpen] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isEditEntryOpen, setIsEditEntryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entryForm, setEntryForm] = useState({
    department: "",
    intercom: "",
    phoneNumber: ""
  });

  const resetEntryForm = () => {
    setEntryForm({ department: "", intercom: "", phoneNumber: "" });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
        if (!imageName) {
          setImageName(file.name.replace(/\.[^/.]+$/, ""));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = () => {
    if (!imageName.trim() || !imageUrl) {
      toast({
        title: "Validation Error",
        description: "Please provide an image name and upload an image",
        variant: "destructive"
      });
      return;
    }

    addTelephoneImage(imageName.trim(), imageUrl);
    toast({
      title: "Image Added",
      description: "Telephone network image has been uploaded"
    });
    setImageName("");
    setImageUrl("");
    setIsAddImageOpen(false);
  };

  const handleAddEntry = () => {
    if (!entryForm.department.trim() || !entryForm.intercom.trim() || !entryForm.phoneNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    addTelephoneEntry(entryForm.department.trim(), entryForm.intercom.trim(), entryForm.phoneNumber.trim());
    toast({
      title: "Entry Added",
      description: "New telephone entry has been added"
    });
    resetEntryForm();
    setIsAddEntryOpen(false);
  };

  const handleEditEntry = (id: string) => {
    const entry = telephoneEntries.find(e => e.id === id);
    if (entry) {
      setEntryForm({
        department: entry.department,
        intercom: entry.intercom,
        phoneNumber: entry.phoneNumber
      });
      setEditingId(id);
      setIsEditEntryOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (editingId && entryForm.department.trim() && entryForm.intercom.trim() && entryForm.phoneNumber.trim()) {
      updateTelephoneEntry(editingId, {
        department: entryForm.department.trim(),
        intercom: entryForm.intercom.trim(),
        phoneNumber: entryForm.phoneNumber.trim()
      });
      toast({
        title: "Entry Updated",
        description: "Telephone entry has been updated"
      });
      resetEntryForm();
      setEditingId(null);
      setIsEditEntryOpen(false);
    }
  };

  const filteredEntries = telephoneEntries.filter(e =>
    e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.intercom.includes(searchTerm) ||
    e.phoneNumber.includes(searchTerm)
  );

  return (
    <ITHeadLayout title="Telephone/Intercom Management">
      <Tabs defaultValue="numbers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="numbers">Telephone Numbers</TabsTrigger>
          <TabsTrigger value="images">Network Images</TabsTrigger>
        </TabsList>

        {/* Telephone Numbers Tab */}
        <TabsContent value="numbers" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by department, intercom, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setIsAddEntryOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredEntries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department/User</TableHead>
                      <TableHead>Intercom</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.department}</TableCell>
                        <TableCell>{entry.intercom}</TableCell>
                        <TableCell>{entry.phoneNumber}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditEntry(entry.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                deleteTelephoneEntry(entry.id);
                                toast({ title: "Entry Deleted" });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? "No entries match your search" 
                      : "No telephone entries yet. Add your first entry!"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Upload telephone network diagrams and infrastructure images
            </p>
            <Button onClick={() => setIsAddImageOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>

          {telephoneImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {telephoneImages.map((image) => (
                <Card key={image.id} className="overflow-hidden group">
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setPreviewImage(image.url)}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          deleteTelephoneImage(image.id);
                          toast({ title: "Image Deleted" });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">{image.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Added {format(new Date(image.createdAt), "dd-MM-yyyy")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No network images uploaded yet. Add your first diagram!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Image Dialog */}
      <Dialog open={isAddImageOpen} onOpenChange={setIsAddImageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Network Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image Name *</Label>
              <Input
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="e.g., Telephone Network Diagram"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Image *</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload an image (max 5MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImageName(""); setImageUrl(""); setIsAddImageOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAddImage}>Add Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Entry Dialog */}
      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Telephone Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Department/User *</Label>
              <Input
                value={entryForm.department}
                onChange={(e) => setEntryForm(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g., Reception, John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Intercom *</Label>
              <Input
                value={entryForm.intercom}
                onChange={(e) => setEntryForm(prev => ({ ...prev, intercom: e.target.value }))}
                placeholder="e.g., 101"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={entryForm.phoneNumber}
                onChange={(e) => setEntryForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="e.g., +91 98765 43210"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetEntryForm(); setIsAddEntryOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditEntryOpen} onOpenChange={setIsEditEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Telephone Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Department/User *</Label>
              <Input
                value={entryForm.department}
                onChange={(e) => setEntryForm(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Intercom *</Label>
              <Input
                value={entryForm.intercom}
                onChange={(e) => setEntryForm(prev => ({ ...prev, intercom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={entryForm.phoneNumber}
                onChange={(e) => setEntryForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetEntryForm(); setEditingId(null); setIsEditEntryOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Update Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                Network Diagram
                <Button variant="ghost" size="icon" onClick={() => setPreviewImage(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              <img
                src={previewImage}
                alt="Network diagram"
                className="max-w-full max-h-[70vh] rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ITHeadLayout>
  );
};

export default ITHeadTelephone;
