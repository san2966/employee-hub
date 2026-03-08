import { useState, useEffect, useCallback } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TenderMonitor = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [docsRes, tendersRes, quotesRes] = await Promise.all([
      (supabase as any).from("tender_documents").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("tenders").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("purchase_quotes").select("*").order("created_at", { ascending: false }),
    ]);
    setDocuments(docsRes.data || []);
    setTenders(tendersRes.data || []);
    setQuotes(quotesRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime for quotes
  useEffect(() => {
    const channel = supabase.channel("director_quotes_realtime").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "purchase_quotes" },
      () => { fetchAll(); }
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const handleApprove = async (quoteId: string) => {
    await (supabase as any).from("purchase_quotes").update({ status: "Approved" }).eq("id", quoteId);
    fetchAll();
  };

  const handleReject = async () => {
    if (!rejectQuote) return;
    await (supabase as any).from("purchase_quotes").update({ status: "Rejected", description: rejectDesc }).eq("id", rejectQuote.id);
    setRejectOpen(false);
    setRejectQuote(null);
    setRejectDesc("");
    fetchAll();
  };

  const getTenderForDoc = (docId: string) => tenders.find((t: any) => t.document_id === docId);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Draft", technical_pending: "Technical Pending", technical_done: "Technical Done",
      financial_pending: "Financial Pending", financial_done: "Financial Done", completed: "Completed",
    };
    return labels[status] || status;
  };

  const downloadPDF = async (tender: any, doc: any) => {
    const { data: links } = await (supabase as any).from("tender_company_links").select("*").eq("tender_id", tender.id);
    let companyNames: string[] = [];
    let techApproved: string[] = [];
    let finApproved: string[] = [];
    if (links && links.length > 0) {
      const compIds = links.map((l: any) => l.company_id);
      const { data: comps } = await (supabase as any).from("tender_companies").select("*").in("id", compIds);
      const compMap = new Map((comps || []).map((c: any) => [c.id, c.name]));
      companyNames = links.map((l: any) => compMap.get(l.company_id) || "Unknown");
      techApproved = links.filter((l: any) => l.technical_status === "accepted").map((l: any) => compMap.get(l.company_id) || "Unknown");
      finApproved = links.filter((l: any) => l.financial_status === "accepted").map((l: any) => compMap.get(l.company_id) || "Unknown");
    }

    const pdf = new jsPDF();
    pdf.setFontSize(16); pdf.text("Tender Report", 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [["Subject", "Description"]],
      body: [
        ["Tender", doc.bid_number],
        ["Organization Name", doc.organization],
        ["Product", doc.product],
        ["Bid Published", doc.bid_date],
        ["Company Applied", companyNames.join(", ") || "None"],
        ["Technical Open", tender.technical_opening_date || "N/A"],
        ["Technically Approved", techApproved.join(", ") || "None"],
        ["Financially Approved", finApproved.join(", ") || "None"],
        ["Work Order", tender.work_order_url || "N/A"],
      ],
    });
    pdf.save(`Tender_${doc.bid_number}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  if (loading) return <DirectorLayout title="Tender Monitor"><p>Loading...</p></DirectorLayout>;

  return (
    <DirectorLayout title="Tender Monitor">
      {documents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tenders to monitor</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc: any) => {
            const tender = getTenderForDoc(doc.id);
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Bid #{doc.bid_number}</h3>
                    {tender && <Badge variant="secondary">{getStatusLabel(tender.status)}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.organization} • {doc.product}</p>
                  <p className="text-xs text-muted-foreground">Published: {doc.bid_date}</p>
                  {tender && (
                    <div className="text-xs space-y-1">
                      {tender.technical_opening_date && <p>Tech Open: {tender.technical_opening_date}</p>}
                      {tender.financial_opening_date && <p>Fin Open: {tender.financial_opening_date}</p>}
                    </div>
                  )}
                  {tender && tender.status === "completed" && (
                    <Button size="sm" variant="outline" onClick={() => downloadPDF(tender, doc)}>
                      <Download className="h-3 w-3 mr-1" /> Download Report
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

export default TenderMonitor;
