import { useState, useEffect } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Download, Eye } from "lucide-react";

const DirectorRecordManagement = () => {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<any[]>([]);
  const [inwards, setInwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [denyReason, setDenyReason] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [pRes, iRes] = await Promise.all([
      (supabase as any).from("operations_proposals").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("operations_inwards").select("*").order("created_at", { ascending: false }),
    ]);
    if (pRes.data) setProposals(pRes.data);
    if (iRes.data) setInwards(iRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Realtime subscriptions
    const proposalChannel = supabase
      .channel("director-proposals")
      .on("postgres_changes", { event: "*", schema: "public", table: "operations_proposals" }, () => fetchData())
      .subscribe();

    const inwardChannel = supabase
      .channel("director-inwards")
      .on("postgres_changes", { event: "*", schema: "public", table: "operations_inwards" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(proposalChannel);
      supabase.removeChannel(inwardChannel);
    };
  }, []);

  const handleApprove = async (proposal: any) => {
    const { error } = await (supabase as any)
      .from("operations_proposals")
      .update({ status: "Approved", updated_at: new Date().toISOString() })
      .eq("id", proposal.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Approved", description: `Proposal ${proposal.unique_id} approved` });
      fetchData();
    }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) {
      toast({ title: "Error", description: "Reason is required", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any)
      .from("operations_proposals")
      .update({ status: "Not Approved", reason: denyReason, updated_at: new Date().toISOString() })
      .eq("id", selectedProposal.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Denied", description: `Proposal ${selectedProposal.unique_id} denied` });
      setDenyDialogOpen(false);
      setDenyReason("");
      setSelectedProposal(null);
      fetchData();
    }
  };

  const handleDownload = async (fileUrl: string) => {
    if (!fileUrl) return;
    if (fileUrl.includes("operations-files")) {
      const match = fileUrl.match(/operations-files\/(.+?)(\?|$)/);
      if (match) {
        const { data } = await supabase.storage.from("operations-files").createSignedUrl(match[1], 315360000);
        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
        return;
      }
    }
    window.open(fileUrl, "_blank");
  };

  const statusColor = (s: string) => s === "Approved" ? "bg-green-100 text-green-700" : s === "Not Approved" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700";

  return (
    <DirectorLayout title="Record Management">
      <Tabs defaultValue="proposals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proposals">Proposals ({proposals.length})</TabsTrigger>
          <TabsTrigger value="inwards">Inwards ({inwards.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">File</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map((p: any) => (
                      <tr key={p.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{p.unique_id}</td>
                        <td className="px-4 py-3">{p.organization_name}</td>
                        <td className="px-4 py-3">{p.product_name}</td>
                        <td className="px-4 py-3">{p.subject}</td>
                        <td className="px-4 py-3">
                          {p.file_url && (
                            <Button size="sm" variant="ghost" onClick={() => handleDownload(p.file_url)}>
                              <Eye className="h-3 w-3 mr-1" />View
                            </Button>
                          )}
                        </td>
                        <td className="px-4 py-3"><Badge className={statusColor(p.status)}>{p.status}</Badge></td>
                        <td className="px-4 py-3">
                          {p.status === "Pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(p)}>
                                <CheckCircle className="h-3 w-3 mr-1" />Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => { setSelectedProposal(p); setDenyDialogOpen(true); }}>
                                <XCircle className="h-3 w-3 mr-1" />Deny
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {proposals.length === 0 && <p className="text-center text-muted-foreground py-8">No proposals</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inwards">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-Office</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inwards.map((i: any) => (
                      <tr key={i.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3">{i.document_type}</td>
                        <td className="px-4 py-3">{i.product_name}</td>
                        <td className="px-4 py-3">{i.organization_name}</td>
                        <td className="px-4 py-3">{i.subject}</td>
                        <td className="px-4 py-3">{i.e_office_number || "-"}</td>
                        <td className="px-4 py-3">{i.date || "-"}</td>
                        <td className="px-4 py-3">
                          {i.file_url && (
                            <Button size="sm" variant="ghost" onClick={() => handleDownload(i.file_url)}>
                              <Download className="h-3 w-3 mr-1" />Download
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inwards.length === 0 && <p className="text-center text-muted-foreground py-8">No inward records</p>}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Deny Dialog */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deny Proposal - {selectedProposal?.unique_id}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason for denial *</Label>
              <Textarea value={denyReason} onChange={(e) => setDenyReason(e.target.value)} placeholder="Enter reason..." rows={4} />
            </div>
            <Button onClick={handleDeny} variant="destructive" className="w-full">Submit Denial</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
};

export default DirectorRecordManagement;
