import { useState, useEffect } from "react";
import ITHeadLayout from "@/components/ithead/ITHeadLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, CheckCircle, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ExportButtons } from "@/components/ExportButtons";
import { EXPORT_COLUMNS } from "@/lib/exportUtils";

interface TicketRecord {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  status: "Active" | "Closed";
  problem_cause?: string;
  solution_provided?: string;
  resolution_image_url?: string;
  created_at: string;
  resolved_at?: string;
}

const ITHeadTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Closed">("all");
  
  const [resolveForm, setResolveForm] = useState({
    problemCause: "",
    solutionProvided: "",
    resolutionImage: "",
  });

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets((data || []) as TicketRecord[]);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Real-time subscription
    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolveForm({ ...resolveForm, resolutionImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket) return;

    if (!resolveForm.problemCause.trim() || !resolveForm.solutionProvided.trim()) {
      toast({
        title: "Error",
        description: "Please fill in Problem Cause and Solution Provided",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          status: "Closed",
          problem_cause: resolveForm.problemCause,
          solution_provided: resolveForm.solutionProvided,
          resolution_image_url: resolveForm.resolutionImage || null,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      // Send resolution email
      await supabase.functions.invoke("send-ticket-email", {
        body: {
          type: "resolved",
          ticketNumber: selectedTicket.ticket_number,
          name: selectedTicket.name,
          email: selectedTicket.email,
          subject: selectedTicket.subject,
          problemCause: resolveForm.problemCause,
          solutionProvided: resolveForm.solutionProvided,
        },
      });

      toast({ title: "Success", description: "Ticket resolved and notification sent" });
      setResolveDialogOpen(false);
      setSelectedTicket(null);
      setResolveForm({ problemCause: "", solutionProvided: "", resolutionImage: "" });
      fetchTickets();
    } catch (error: any) {
      console.error("Error resolving ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resolve ticket",
        variant: "destructive",
      });
    }
  };

  const openResolveDialog = (ticket: TicketRecord) => {
    setSelectedTicket(ticket);
    setResolveDialogOpen(true);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = tickets.filter((t) => t.status === "Active").length;
  const closedCount = tickets.filter((t) => t.status === "Closed").length;

  return (
    <ITHeadLayout title="Ticket Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tickets.length}</p>
                  <p className="text-sm text-muted-foreground">Total Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <Ticket className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-sm text-muted-foreground">Active Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent rounded-lg">
                  <CheckCircle className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{closedCount}</p>
                  <p className="text-sm text-muted-foreground">Resolved Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ticket #, name, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as "all" | "Active" | "Closed")}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ExportButtons
                portal="ITHead"
                type="Tickets"
                columns={EXPORT_COLUMNS.tickets}
                data={filteredTickets}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {tickets.length === 0 ? "No tickets yet" : "No tickets match your filters"}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono font-medium">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell>{ticket.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ticket.email}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell>
                          {format(new Date(ticket.created_at), "dd-MM-yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={ticket.status === "Active" ? "default" : "secondary"}
                            className={
                              ticket.status === "Active"
                                ? "bg-warning/20 text-warning-foreground border-warning"
                                : "bg-primary/20 text-primary border-primary"
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.status === "Active" ? (
                            <Button
                              size="sm"
                              onClick={() => openResolveDialog(ticket)}
                            >
                              Resolve
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Resolved</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolve Dialog */}
        <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Resolve Ticket: {selectedTicket?.ticket_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Subject: {selectedTicket?.subject}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedTicket?.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Problem Cause *</Label>
                <Input
                  value={resolveForm.problemCause}
                  onChange={(e) =>
                    setResolveForm({ ...resolveForm, problemCause: e.target.value })
                  }
                  placeholder="Describe the problem cause"
                />
              </div>
              <div className="space-y-2">
                <Label>Solution Provided *</Label>
                <Textarea
                  value={resolveForm.solutionProvided}
                  onChange={(e) =>
                    setResolveForm({ ...resolveForm, solutionProvided: e.target.value })
                  }
                  placeholder="Describe the solution provided"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Image (Optional)</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                {resolveForm.resolutionImage && (
                  <img
                    src={resolveForm.resolutionImage}
                    alt="Resolution"
                    className="w-32 h-32 object-cover rounded-lg mt-2"
                  />
                )}
              </div>
              <Button onClick={handleResolve} className="w-full">
                Mark as Resolved & Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ITHeadLayout>
  );
};

export default ITHeadTickets;
