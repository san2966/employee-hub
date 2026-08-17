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
  const [links, setLinks] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [docsRes, tendersRes, linksRes, compsRes] = await Promise.all([
      (supabase as any).from("tender_documents").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("tenders").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("tender_company_links").select("*"),
      (supabase as any).from("tender_companies").select("*"),
    ]);
    setDocuments(docsRes.data || []);
    setTenders(tendersRes.data || []);
    setLinks(linksRes.data || []);
    setCompanies(compsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime sync with Tender Manager
  useEffect(() => {
    const channel = supabase
      .channel("director_tender_monitor_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tenders" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "tender_documents" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "tender_company_links" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const getTenderForDoc = (docId: string) => tenders.find((t: any) => t.document_id === docId);
  const compName = (id: string) => companies.find((c: any) => c.id === id)?.name || "Unknown";
  const linksFor = (tenderId: string) => links.filter((l: any) => l.tender_id === tenderId);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Draft", technical_pending: "Technical Pending", technical_done: "Technical Done",
      financial_pending: "Financial Pending", financial_done: "Financial Done", completed: "Completed",
    };
    return labels[status] || status;
  };

  const downloadPDF = async (tender: any, doc: any) => {
    const tLinks = linksFor(tender.id);
    const companyNames = tLinks.map((l: any) => compName(l.company_id));
    const techApproved = tLinks.filter((l: any) => l.technical_status === "accepted").map((l: any) => compName(l.company_id));
    const finApproved = tLinks.filter((l: any) => l.financial_status === "accepted").map((l: any) => compName(l.company_id));

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header branding
    pdf.setFillColor(30, 58, 138);
    pdf.rect(0, 0, pageWidth, 28, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("VMCC", 14, 14);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Tender Report", 14, 22);
    pdf.setFontSize(8);
    pdf.text(`Generated: ${format(new Date(), "dd-MM-yyyy hh:mm a")}`, pageWidth - 14, 22, { align: "right" });

    // Title
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Bid #${doc.bid_number}`, 14, 40);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${doc.organization} • ${doc.product}`, 14, 47);

    // Details table
    autoTable(pdf, {
      startY: 54,
      head: [["Field", "Details"]],
      body: [
        ["Bid Number", doc.bid_number || "-"],
        ["Organization", doc.organization || "-"],
        ["Product", doc.product || "-"],
        ["Bid Published Date", doc.bid_date || "-"],
        ["Companies Applied", companyNames.join(", ") || "None"],
        ["Technical Opening Date", tender.technical_opening_date || "N/A"],
        ["Technically Approved", techApproved.join(", ") || "None"],
        ["Financial Opening Date", tender.financial_opening_date || "N/A"],
        ["Financially Approved", finApproved.join(", ") || "None"],
        ["Work Order", tender.work_order_url ? "Available" : "N/A"],
      ],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: "center" });
    }

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
            const tLinks = tender ? linksFor(tender.id) : [];
            const applied = tLinks.map((l: any) => compName(l.company_id));
            const techOk = tLinks.filter((l: any) => l.technical_status === "accepted").map((l: any) => compName(l.company_id));
            const finOk = tLinks.filter((l: any) => l.financial_status === "accepted").map((l: any) => compName(l.company_id));
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
                    <div className="text-xs space-y-1 border-t pt-2">
                      {applied.length > 0 && <p><span className="font-medium">Companies Applied:</span> {applied.join(", ")}</p>}
                      {tender.technical_opening_date && <p><span className="font-medium">Tech Open:</span> {tender.technical_opening_date}</p>}
                      {techOk.length > 0 && <p><span className="font-medium">Tech Approved:</span> {techOk.join(", ")}</p>}
                      {tender.financial_opening_date && <p><span className="font-medium">Fin Open:</span> {tender.financial_opening_date}</p>}
                      {finOk.length > 0 && <p><span className="font-medium">Fin Approved:</span> {finOk.join(", ")}</p>}
                      {tender.work_order_url && (
                        <p>
                          <span className="font-medium">Work Order:</span>{" "}
                          <a href={tender.work_order_url} target="_blank" rel="noreferrer" className="text-primary underline">View</a>
                        </p>
                      )}
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
    </DirectorLayout>
  );
};

export default TenderMonitor;
