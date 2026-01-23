import { useState } from "react";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Phone, Mail, Building, Trash2 } from "lucide-react";

const EmployeeContacts = () => {
  const session = JSON.parse(sessionStorage.getItem("employee_session") || "{}");
  const employeeId = session.employeeId || "";
  
  const { contacts, addContact, deleteContact } = useEmployeeData(employeeId);
  const { toast } = useToast();
  
  const [dialog, setDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOrg, setFilterOrg] = useState("all");
  const [filterDesignation, setFilterDesignation] = useState("all");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    designation: "",
    department: "",
    organization: "",
    email: "",
  });
  
  const organizations = [...new Set(contacts.map(c => c.organization).filter(Boolean))];
  const designations = [...new Set(contacts.map(c => c.designation).filter(Boolean))];
  
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(search.toLowerCase()) ||
                         contact.organization.toLowerCase().includes(search.toLowerCase());
    const matchesOrg = filterOrg === "all" || contact.organization === filterOrg;
    const matchesDesignation = filterDesignation === "all" || contact.designation === filterDesignation;
    return matchesSearch && matchesOrg && matchesDesignation;
  });
  
  const handleSave = () => {
    if (!form.name || !form.phone || !form.organization) {
      toast({ variant: "destructive", title: "Error", description: "Please fill required fields" });
      return;
    }
    
    addContact(form);
    toast({ title: "Contact added" });
    setDialog(false);
    setForm({ name: "", phone: "", designation: "", department: "", organization: "", email: "" });
  };

  return (
    <EmployeeLayout title="Contacts">
      <div className="space-y-6">
        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">My Contacts</h2>
          <p className="opacity-90">Manage your professional contacts</p>
        </div>

        {/* Filters */}
        <Card className="card-corporate">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm text-muted-foreground mb-2 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-48">
                <Label className="text-sm text-muted-foreground mb-2 block">Organization</Label>
                <Select value={filterOrg} onValueChange={setFilterOrg}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org} value={org}>{org}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Label className="text-sm text-muted-foreground mb-2 block">Designation</Label>
                <Select value={filterDesignation} onValueChange={setFilterDesignation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Designations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Designations</SelectItem>
                    {designations.map(des => (
                      <SelectItem key={des} value={des}>{des}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={dialog} onOpenChange={setDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name *</Label>
                      <Input 
                        value={form.name} 
                        onChange={e => setForm({ ...form, name: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label>Phone Number *</Label>
                      <Input 
                        value={form.phone} 
                        onChange={e => setForm({ ...form, phone: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label>Organization *</Label>
                      <Input 
                        value={form.organization} 
                        onChange={e => setForm({ ...form, organization: e.target.value })} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Designation (Optional)</Label>
                        <Input 
                          value={form.designation} 
                          onChange={e => setForm({ ...form, designation: e.target.value })} 
                        />
                      </div>
                      <div>
                        <Label>Department (Optional)</Label>
                        <Input 
                          value={form.department} 
                          onChange={e => setForm({ ...form, department: e.target.value })} 
                        />
                      </div>
                    </div>
                    <div>
                      <Label>E-Mail (Optional)</Label>
                      <Input 
                        type="email"
                        value={form.email} 
                        onChange={e => setForm({ ...form, email: e.target.value })} 
                      />
                    </div>
                    <Button className="w-full" onClick={handleSave}>Save Contact</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <Card className="card-corporate">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Contacts Yet</p>
              <p className="text-sm mt-2">Add your first contact to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map(contact => (
              <Card key={contact.id} className="card-corporate">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => { deleteContact(contact.id); toast({ title: "Contact deleted" }); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <h3 className="font-semibold text-lg">{contact.name}</h3>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {contact.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      {contact.organization}
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {contact.email}
                      </div>
                    )}
                  </div>
                  
                  {contact.designation && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {contact.designation}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeContacts;
