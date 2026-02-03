import { useState } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData, Contact } from "@/hooks/useDirectorData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users, Mail, Phone, Building, Trash2 } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { EXPORT_COLUMNS } from "@/lib/exportUtils";

const Contacts = () => {
  const { toast } = useToast();
  const { contacts, organizations, addContact, deleteContact } = useDirectorData();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrg, setFilterOrg] = useState<string>("all");
  const [filterDesignation, setFilterDesignation] = useState<string>("all");
  
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    designation: "",
    department: "",
    organization: "",
    email: "",
  });

  const handleAddContact = () => {
    if (!contactForm.name || !contactForm.phone || !contactForm.email) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    addContact(contactForm);
    toast({ title: "Success", description: "Contact added" });
    setDialogOpen(false);
    setContactForm({ name: "", phone: "", designation: "", department: "", organization: "", email: "" });
  };

  const uniqueDesignations = [...new Set(contacts.map(c => c.designation).filter(Boolean))];
  const uniqueOrganizations = [...new Set(contacts.map(c => c.organization).filter(Boolean))];

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.phone.includes(searchQuery);
    const matchesOrg = filterOrg === "all" || contact.organization === filterOrg;
    const matchesDesignation = filterDesignation === "all" || contact.designation === filterDesignation;
    return matchesSearch && matchesOrg && matchesDesignation;
  });

  return (
    <DirectorLayout title="Contacts">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="card-corporate p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterOrg} onValueChange={setFilterOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {uniqueOrganizations.map(org => (
                  <SelectItem key={org} value={org}>{org}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDesignation} onValueChange={setFilterDesignation}>
              <SelectTrigger>
                <SelectValue placeholder="Designation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {uniqueDesignations.map(des => (
                  <SelectItem key={des} value={des}>{des}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add Contact Button */}
        <div className="flex justify-end gap-2">
          <ExportButtons
            portal="Director"
            type="Contacts"
            columns={EXPORT_COLUMNS.contacts}
            data={filteredContacts}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" /> Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Designation</Label>
                    <Input
                      value={contactForm.designation}
                      onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input
                      value={contactForm.department}
                      onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                      placeholder="Department"
                    />
                  </div>
                </div>
                <div>
                  <Label>Organization</Label>
                  <Input
                    value={contactForm.organization}
                    onChange={(e) => setContactForm({ ...contactForm, organization: e.target.value })}
                    placeholder="Organization name"
                  />
                </div>
                <Button onClick={handleAddContact} className="w-full">Add Contact</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <div className="card-corporate p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No Contacts Found</p>
            <p className="text-muted-foreground mt-2">
              {contacts.length === 0 
                ? "Click 'Add Contact' to create your first contact"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map(contact => (
              <div key={contact.id} className="card-corporate p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{contact.name}</p>
                      {contact.designation && (
                        <p className="text-sm text-muted-foreground">{contact.designation}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteContact(contact.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  {contact.organization && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.organization}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DirectorLayout>
  );
};

export default Contacts;
