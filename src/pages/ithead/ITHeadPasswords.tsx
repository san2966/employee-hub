import { useState } from "react";
import ITHeadLayout from "@/components/ithead/ITHeadLayout";
import { useITHeadData } from "@/hooks/useITHeadData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Eye, EyeOff, Trash2, Edit2, Key, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ITHeadPasswords = () => {
  const { passwords, addPassword, updatePassword, deletePassword } = useITHeadData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    portal: "",
    username: "",
    password: ""
  });

  const resetForm = () => {
    setFormData({ portal: "", username: "", password: "" });
  };

  const handleAdd = () => {
    if (!formData.portal.trim() || !formData.username.trim() || !formData.password.trim()) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    addPassword(formData.portal.trim(), formData.username.trim(), formData.password);
    toast({
      title: "Password Added",
      description: "New credential has been saved securely"
    });
    resetForm();
    setIsAddOpen(false);
  };

  const handleEdit = (id: string) => {
    const entry = passwords.find(p => p.id === id);
    if (entry) {
      setFormData({
        portal: entry.portal,
        username: entry.username,
        password: entry.password
      });
      setEditingId(id);
      setIsEditOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (editingId && formData.portal.trim() && formData.username.trim() && formData.password.trim()) {
      updatePassword(editingId, {
        portal: formData.portal.trim(),
        username: formData.username.trim(),
        password: formData.password
      });
      toast({
        title: "Password Updated",
        description: "Credential has been updated successfully"
      });
      resetForm();
      setEditingId(null);
      setIsEditOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    deletePassword(id);
    toast({
      title: "Password Deleted",
      description: "Credential has been removed"
    });
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({
        title: "Copied",
        description: "Password copied to clipboard"
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const filteredPasswords = passwords.filter(p =>
    p.portal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ITHeadLayout title="Password Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by portal or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Password
          </Button>
        </div>

        {/* Passwords Table */}
        <Card>
          <CardContent className="p-0">
            {filteredPasswords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Portal</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPasswords.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.portal}</TableCell>
                      <TableCell>{entry.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {visiblePasswords.has(entry.id) ? entry.password : "••••••••"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => togglePasswordVisibility(entry.id)}
                          >
                            {visiblePasswords.has(entry.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(entry.password, entry.id)}
                          >
                            {copiedId === entry.id ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(entry.createdAt), "PP")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(entry.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(entry.id)}
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
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "No credentials match your search" 
                    : "No passwords stored yet. Add your first credential!"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Password Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Portal / Service Name *</Label>
              <Input
                value={formData.portal}
                onChange={(e) => setFormData(prev => ({ ...prev, portal: e.target.value }))}
                placeholder="e.g., Gmail, Salesforce, AWS"
              />
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Username or email"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsAddOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Save Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Password Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Portal / Service Name *</Label>
              <Input
                value={formData.portal}
                onChange={(e) => setFormData(prev => ({ ...prev, portal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setEditingId(null); setIsEditOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ITHeadLayout>
  );
};

export default ITHeadPasswords;
