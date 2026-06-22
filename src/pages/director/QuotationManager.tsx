import { useState, useEffect, useCallback } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Eye, Check, X } from "lucide-react";

const DirectorQuotationManager = () => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectQuote, setRejectQuote] = useState<any>(null);
  const [rejectDesc, setRejectDesc] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("purchase_quotes").select("*").order("created_at", { ascending: false });
    if (error) console.error("fetch purchase_quotes failed:", error);
    setQuotes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  useEffect(() => {
    const channel = supabase.channel("director_quotes_realtime").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "purchase_quotes" },
      () => { fetchQuotes(); }
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchQuotes]);

  const handleApprove = async (quoteId: string) => {
    const { error } = await (supabase as any).from("purchase_quotes").update({ status: "accepted", description: null }).eq("id", quoteId);
    if (error) console.error("approve quote failed:", error);
    fetchQuotes();
  };

  const handleReject = async () => {
    if (!rejectQuote) return;
    const { error } = await (supabase as any).from("purchase_quotes").update({ status: "rejected", description: rejectDesc }).eq("id", rejectQuote.id);
    if (error) console.error("reject quote failed:", error);
    setRejectOpen(false);
    setRejectQuote(null);
    setRejectDesc("");
    fetchQuotes();
  };

  if (loading) return <DirectorLayout title="Quotation Manager"><p>Loading...</p></DirectorLayout>;

  return (
    <DirectorLayout title="Quotation Manager">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote ID</TableHead>
                  <TableHead className="min-w-[190px]">Actions</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No quotations submitted
                  </TableCell></TableRow>
                ) : quotes.map((q: any) => {
                  const status = String(q.status || "pending").toLowerCase();
                  return (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.quote_id}</TableCell>
                    <TableCell className="min-w-[190px]">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90 text-success-foreground"
                          onClick={() => handleApprove(q.id)}
                        >
                          <Check className="h-3 w-3 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => { setRejectQuote(q); setRejectDesc(""); setRejectOpen(true); }}
                        >
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{q.subject}</TableCell>
                    <TableCell>{q.type}</TableCell>
                    <TableCell>
                      {q.file_url && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setPreviewUrl(q.file_url)}><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" asChild><a href={q.file_url} download><Download className="h-4 w-4" /></a></Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status === "accepted" || status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>
                        {q.status || "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );})}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Quote: {rejectQuote?.quote_id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Rejection Reason</Label><Textarea value={rejectDesc} onChange={e => setRejectDesc(e.target.value)} placeholder="Enter reason for rejection" /></div>
            <Button onClick={handleReject} variant="destructive" className="w-full">Submit Rejection</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Quote Preview</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} alt="Quote" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
};

export default DirectorQuotationManager;
