import { useState, useRef } from "react";
import OperationsLayout from "@/components/operations/OperationsLayout";
import { useOperationsData } from "@/hooks/useOperationsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, LayoutGrid, List, Download, FileText } from "lucide-react";

const OperationsProposals = () => {
  const { toast } = useToast();
  const { proposals, uploadFile, getSignedUrl, generateProposalId } = useOperationsData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ organization_name: "", product_name: "", subject: "", to_sender: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [viewMode, setViewMode] = useState<"tile" | "list">("list");

  const handleGenerate = async () => {
    if (!form.organization_name || !form.product_name || !form.subject || !form.to_sender) {
      toast({ title: "Error", description: "All fields are mandatory", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Error", description: "Document upload is mandatory", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be under 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileUrl = await uploadFile(file, "proposals");
      const uniqueId = generateProposalId();
      await proposals.add({ ...form, file_url: fileUrl, unique_id: uniqueId });
      setDialogOpen(false);
      setForm({ organization_name: "", product_name: "", subject: "", to_sender: "" });
      setFile(null);
    } catch (err: any) {
      toast({ title: "Upload Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDownload = async (item: any) => {
    if (item.status !== "Approved") {
      toast({ title: "Not Available", description: "Download available only for approved proposals", variant: "destructive" });
      return;
    }
    const url = await getSignedUrl(item.file_url);
    if (url) window.open(url, "_blank");
  };

  const orgs = [...new Set(proposals.data.map((p: any) => p.organization_name))];
  const products = [...new Set(proposals.data.map((p: any) => p.product_name))];

  const filtered = proposals.data.filter((p: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.unique_id?.toLowerCase().includes(q) || p.organization_name.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q);
    const matchesOrg = !orgFilter || p.organization_name === orgFilter;
    const matchesProduct = !productFilter || p.product_name === productFilter;
    return matchesSearch && matchesOrg && matchesProduct;
  });

  const statusColor = (s: string) => s === "Approved" ? "bg-green-100 text-green-700" : s === "Not Approved" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700";

  return (
    <OperationsLayout title="Proposal Management">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search proposals..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
            <option value="">All Organizations</option>
            {orgs.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="">All Products</option>
            {products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex gap-1 border rounded-md p-1">
            <Button size="icon" variant={viewMode === "tile" ? "default" : "ghost"} onClick={() => setViewMode("tile")}><LayoutGrid className="h-4 w-4" /></Button>
            <Button size="icon" variant={viewMode === "list" ? "default" : "ghost"} onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" />Create Proposal</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Proposal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Organization Name *</Label><Input value={form.organization_name} onChange={(e) => setForm({...form, organization_name: e.target.value})} /></div>
                <div><Label>Product Name *</Label><Input value={form.product_name} onChange={(e) => setForm({...form, product_name: e.target.value})} /></div>
                <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} /></div>
                <div><Label>To *</Label><Input value={form.to_sender} onChange={(e) => setForm({...form, to_sender: e.target.value})} /></div>
                <div>
                  <Label>Upload Document *</Label>
                  <Input type="file" ref={fileRef} accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-muted-foreground mt-1">Max 10MB, PDF/DOC</p>
                </div>
                <Button onClick={handleGenerate} disabled={uploading} className="w-full">{uploading ? "Generating..." : "Generate"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {proposals.loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : viewMode === "list" ? (
          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{p.unique_id}</td>
                      <td className="px-4 py-3">{p.organization_name}</td>
                      <td className="px-4 py-3">{p.product_name}</td>
                      <td className="px-4 py-3">{p.subject}</td>
                      <td className="px-4 py-3"><Badge className={statusColor(p.status)}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-xs">{p.reason || "-"}</td>
                      <td className="px-4 py-3">
                        {p.status === "Approved" && (
                          <Button size="sm" variant="outline" onClick={() => handleDownload(p)}>
                            <Download className="h-3 w-3 mr-1" />Download
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p: any) => (
              <div key={p.id} className="bg-card border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <FileText className="h-8 w-8 text-primary/50" />
                  <Badge className={statusColor(p.status)}>{p.status}</Badge>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{p.unique_id}</p>
                <p className="font-medium text-foreground">{p.organization_name}</p>
                <p className="text-sm text-muted-foreground">{p.product_name}</p>
                {p.reason && <p className="text-xs text-destructive">Reason: {p.reason}</p>}
                {p.status === "Approved" && (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownload(p)}>
                    <Download className="h-3 w-3 mr-1" />Download
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        {filtered.length === 0 && !proposals.loading && <p className="text-center text-muted-foreground py-8">No proposals found</p>}
      </div>
    </OperationsLayout>
  );
};

export default OperationsProposals;
