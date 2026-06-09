import { useState, useEffect, useCallback } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { uploadTenderFile, type Tender, type TenderDocument, type TenderCompany, type TenderCompanyLink } from "@/hooks/useTenderData";
import { useToast } from "@/hooks/use-toast";
import { FileText, CalendarIcon, Download, Building2, Check, X } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TenderManager = () => {
  const [role, setRole] = useState("");
  const [documents, setDocuments] = useState<TenderDocument[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [companies, setCompanies] = useState<TenderCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Dialog states
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [techUpdateOpen, setTechUpdateOpen] = useState(false);
  const [finDateOpen, setFinDateOpen] = useState(false);
  const [finUpdateOpen, setFinUpdateOpen] = useState(false);
  const [workOrderOpen, setWorkOrderOpen] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Form states
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [techDate, setTechDate] = useState<Date | undefined>();
  const [finDate, setFinDate] = useState<Date | undefined>();
  const [checkboxes, setCheckboxes] = useState({ emd: false, bg: false, dd: false, epbg: false, gras: false });
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const [tenderLinks, setTenderLinks] = useState<TenderCompanyLink[]>([]);
  const [companyDecisions, setCompanyDecisions] = useState<Record<string, "accepted" | "rejected">>({});
  const [workOrderFile, setWorkOrderFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem("tenderSession");
    if (session) setRole(JSON.parse(session).role);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [docsRes, tendersRes, compsRes] = await Promise.all([
      (supabase as any).from("tender_documents").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("tenders").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("tender_companies").select("*"),
    ]);
    setDocuments(docsRes.data || []);
    setTenders(tendersRes.data || []);
    setCompanies(compsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime sync — refresh when any tender data changes (e.g. Director updates, multi-user)
  useEffect(() => {
    const channel = supabase
      .channel("tender_manager_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tenders" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "tender_documents" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "tender_companies" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "tender_company_links" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const fetchLinks = async (tenderId: string) => {
    const { data } = await (supabase as any).from("tender_company_links").select("*").eq("tender_id", tenderId);
    if (data) {
      const companyIds = data.map((l: any) => l.company_id);
      const { data: comps } = companyIds.length > 0
        ? await (supabase as any).from("tender_companies").select("*").in("id", companyIds)
        : { data: [] };
      const compMap = new Map((comps || []).map((c: any) => [c.id, c]));
      data.forEach((l: any) => { l.company = compMap.get(l.company_id); });
    }
    setTenderLinks(data || []);
    return data || [];
  };

  const getTenderForDoc = (docId: string) => tenders.find(t => t.document_id === docId);
  const today = new Date().toISOString().split("T")[0];

  // Create tender & add companies
  const handleAddCompanies = async () => {
    if (!selectedDocId || selectedCompanyIds.length === 0) return;
    setSubmitting(true);
    let tender = getTenderForDoc(selectedDocId);
    if (!tender) {
      const { data, error } = await (supabase as any).from("tenders").insert({ document_id: selectedDocId, status: "draft" }).select().single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSubmitting(false); return; }
      tender = data;
    }
    const items = selectedCompanyIds.map(cid => ({ tender_id: tender!.id, company_id: cid }));
    await (supabase as any).from("tender_company_links").insert(items);
    await fetchAll(); setSelectedCompanyIds([]); setAddCompanyOpen(false); setSubmitting(false);
  };

  // Manage - set technical date + checkboxes + doc uploads
  const handleManageSubmit = async () => {
    if (!selectedTenderId || !techDate) return;
    setSubmitting(true);
    const uploads: Record<string, string | null> = {};
    for (const key of ["emd", "bg", "dd", "epbg", "gras"]) {
      if (docFiles[key]) uploads[`${key}_doc_url`] = await uploadTenderFile(docFiles[key]!, "tender-docs");
    }
    await (supabase as any).from("tenders").update({
      technical_opening_date: format(techDate, "yyyy-MM-dd"),
      ...checkboxes, ...uploads, status: "technical_pending",
    }).eq("id", selectedTenderId);
    await fetchAll(); setManageOpen(false); setSubmitting(false);
  };

  // Technical Update - accept/reject companies
  const handleTechUpdate = async () => {
    if (!selectedTenderId) return;
    setSubmitting(true);
    for (const link of tenderLinks) {
      const decision = companyDecisions[link.id];
      if (decision) await (supabase as any).from("tender_company_links").update({ technical_status: decision }).eq("id", link.id);
    }
    await (supabase as any).from("tenders").update({ status: "technical_done" }).eq("id", selectedTenderId);
    await fetchAll(); setTechUpdateOpen(false); setCompanyDecisions({}); setSubmitting(false);
  };

  // Set financial date
  const handleFinDateSubmit = async () => {
    if (!selectedTenderId || !finDate) return;
    setSubmitting(true);
    await (supabase as any).from("tenders").update({
      financial_opening_date: format(finDate, "yyyy-MM-dd"), status: "financial_pending",
    }).eq("id", selectedTenderId);
    await fetchAll(); setFinDateOpen(false); setSubmitting(false);
  };

  // Financial Update
  const handleFinUpdate = async () => {
    if (!selectedTenderId) return;
    setSubmitting(true);
    for (const link of tenderLinks.filter(l => l.technical_status === "accepted")) {
      const decision = companyDecisions[link.id];
      if (decision) await (supabase as any).from("tender_company_links").update({ financial_status: decision }).eq("id", link.id);
    }
    await (supabase as any).from("tenders").update({ status: "financial_done" }).eq("id", selectedTenderId);
    await fetchAll(); setFinUpdateOpen(false); setCompanyDecisions({}); setSubmitting(false);
  };

  // Upload Work Order
  const handleWorkOrder = async () => {
    if (!selectedTenderId || !workOrderFile) return;
    setSubmitting(true);
    const url = await uploadTenderFile(workOrderFile, "work-orders");
    await (supabase as any).from("tenders").update({ work_order_url: url, status: "completed" }).eq("id", selectedTenderId);
    await fetchAll(); setWorkOrderOpen(false); setWorkOrderFile(null); setSubmitting(false);
  };

  // Download PDF
  const downloadPDF = async (tender: Tender, doc: TenderDocument) => {
    const links = await fetchLinks(tender.id);
    const allCompanies = links.map((l: any) => l.company?.name || "Unknown").join(", ");
    const techApproved = links.filter((l: any) => l.technical_status === "accepted").map((l: any) => l.company?.name || "Unknown").join(", ");
    const finApproved = links.filter((l: any) => l.financial_status === "accepted").map((l: any) => l.company?.name || "Unknown").join(", ");

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
    pdf.text(`Generated: ${format(new Date(), "PPpp")}`, pageWidth - 14, 22, { align: "right" });

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
        ["Companies Applied", allCompanies || "None"],
        ["Technical Opening Date", tender.technical_opening_date || "N/A"],
        ["Technically Approved", techApproved || "None"],
        ["Financial Opening Date", tender.financial_opening_date || "N/A"],
        ["Financially Approved", finApproved || "None"],
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "secondary", technical_pending: "outline", technical_done: "default",
      financial_pending: "outline", financial_done: "default", completed: "default", cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      draft: "Draft", technical_pending: "Tech Pending", technical_done: "Tech Done",
      financial_pending: "Fin Pending", financial_done: "Fin Done", completed: "Completed", cancelled: "Cancelled",
    };
    return <Badge variant={colors[status] as any}>{labels[status] || status}</Badge>;
  };

  if (loading) return <TenderLayout title="Tender Manager"><p>Loading...</p></TenderLayout>;

  return (
    <TenderLayout title="Tender Manager">
      {documents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No bids registered yet. Add bids from Documents Manager first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const tender = getTenderForDoc(doc.id);
            const status = tender?.status || "no_tender";
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Bid #{doc.bid_number}</h3>
                    {tender && getStatusBadge(tender.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.organization} • {doc.product}</p>
                  <p className="text-xs text-muted-foreground">{doc.bid_date}</p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* Add Company - only when no tender or draft */}
                    {(!tender || status === "draft") && (
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedDocId(doc.id);
                        setSelectedTenderId(tender?.id || null);
                        setSelectedCompanyIds([]);
                        setAddCompanyOpen(true);
                      }}>
                        <Building2 className="h-3 w-3 mr-1" /> Add Company
                      </Button>
                    )}

                    {/* Manage - after companies added, in draft */}
                    {tender && status === "draft" && (
                      <Button size="sm" onClick={() => {
                        setSelectedTenderId(tender.id);
                        setCheckboxes({ emd: false, bg: false, dd: false, epbg: false, gras: false });
                        setDocFiles({}); setTechDate(undefined);
                        setManageOpen(true);
                      }}>Manage</Button>
                    )}

                    {/* Technical Update - on technical opening date */}
                    {tender && status === "technical_pending" && tender.technical_opening_date && tender.technical_opening_date <= today && (
                      <Button size="sm" onClick={async () => {
                        setSelectedTenderId(tender.id);
                        await fetchLinks(tender.id);
                        setCompanyDecisions({});
                        setTechUpdateOpen(true);
                      }}>Technical Update</Button>
                    )}

                    {/* Update (financial date) - after technical done */}
                    {tender && status === "technical_done" && (
                      <Button size="sm" onClick={() => {
                        setSelectedTenderId(tender.id);
                        setFinDate(undefined);
                        setFinDateOpen(true);
                      }}>Update</Button>
                    )}

                    {/* Financial Update - on financial opening date */}
                    {tender && status === "financial_pending" && tender.financial_opening_date && tender.financial_opening_date <= today && (
                      <Button size="sm" onClick={async () => {
                        setSelectedTenderId(tender.id);
                        const links = await fetchLinks(tender.id);
                        setCompanyDecisions({});
                        setFinUpdateOpen(true);
                      }}>Financial Update</Button>
                    )}

                    {/* Upload Work Order - after financial done */}
                    {tender && status === "financial_done" && (
                      <Button size="sm" onClick={() => {
                        setSelectedTenderId(tender.id);
                        setWorkOrderFile(null);
                        setWorkOrderOpen(true);
                      }}>Upload Work Order</Button>
                    )}

                    {/* Download - when completed */}
                    {tender && status === "completed" && (
                      <Button size="sm" variant="outline" onClick={() => downloadPDF(tender, doc)}>
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Company Dialog */}
      <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Select Companies</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {companies.length === 0 ? <p className="text-sm text-muted-foreground">No companies available. Add from Company Manager.</p> : (
              companies.map((c) => (
                <label key={c.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted">
                  <Checkbox
                    checked={selectedCompanyIds.includes(c.id)}
                    onCheckedChange={(checked) => {
                      setSelectedCompanyIds(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id));
                    }}
                  />
                  <div className="flex items-center gap-2">
                    {c.logo_url ? <img src={c.logo_url} className="w-8 h-8 rounded object-cover" /> : <Building2 className="h-5 w-5 text-muted-foreground" />}
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                </label>
              ))
            )}
          </div>
          <Button onClick={handleAddCompanies} disabled={selectedCompanyIds.length === 0 || submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Manage Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Tender</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Technical Opening Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{techDate ? format(techDate, "PPP") : "Pick a date"}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={techDate} onSelect={setTechDate} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Receipt Submitted</Label>
              {(["emd", "bg", "dd", "epbg", "gras"] as const).map(key => (
                <label key={key} className="flex items-center gap-2">
                  <Checkbox checked={checkboxes[key]} onCheckedChange={(v) => setCheckboxes(prev => ({ ...prev, [key]: !!v }))} />
                  <span className="text-sm uppercase">{key}</span>
                  {checkboxes[key] && <Input type="file" className="ml-2 h-8 text-xs" onChange={e => setDocFiles(prev => ({ ...prev, [key]: e.target.files?.[0] || null }))} />}
                </label>
              ))}
            </div>
            <Button onClick={handleManageSubmit} className="w-full" disabled={!techDate || submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Technical Update Dialog */}
      <Dialog open={techUpdateOpen} onOpenChange={setTechUpdateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Technical Update - Accept/Reject Companies</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {tenderLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm font-medium">{(link as any).company?.name || "Company"}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant={companyDecisions[link.id] === "accepted" ? "default" : "outline"} onClick={() => setCompanyDecisions(prev => ({ ...prev, [link.id]: "accepted" }))}>
                    <Check className="h-3 w-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant={companyDecisions[link.id] === "rejected" ? "destructive" : "outline"} onClick={() => setCompanyDecisions(prev => ({ ...prev, [link.id]: "rejected" }))}>
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleTechUpdate} className="w-full" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
        </DialogContent>
      </Dialog>

      {/* Financial Date Dialog */}
      <Dialog open={finDateOpen} onOpenChange={setFinDateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Financial Opening Date</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{finDate ? format(finDate, "PPP") : "Pick a date"}</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={finDate} onSelect={setFinDate} /></PopoverContent>
            </Popover>
            <Button onClick={handleFinDateSubmit} className="w-full" disabled={!finDate || submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Financial Update Dialog */}
      <Dialog open={finUpdateOpen} onOpenChange={setFinUpdateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Financial Update - Accept/Reject Companies</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {tenderLinks.filter(l => l.technical_status === "accepted").map((link) => (
              <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm font-medium">{(link as any).company?.name || "Company"}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant={companyDecisions[link.id] === "accepted" ? "default" : "outline"} onClick={() => setCompanyDecisions(prev => ({ ...prev, [link.id]: "accepted" }))}>
                    <Check className="h-3 w-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant={companyDecisions[link.id] === "rejected" ? "destructive" : "outline"} onClick={() => setCompanyDecisions(prev => ({ ...prev, [link.id]: "rejected" }))}>
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleFinUpdate} className="w-full" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
        </DialogContent>
      </Dialog>

      {/* Work Order Dialog */}
      <Dialog open={workOrderOpen} onOpenChange={setWorkOrderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Work Order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input type="file" onChange={e => setWorkOrderFile(e.target.files?.[0] || null)} />
            <Button onClick={handleWorkOrder} className="w-full" disabled={!workOrderFile || submitting}>{submitting ? "Uploading..." : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TenderLayout>
  );
};

export default TenderManager;
