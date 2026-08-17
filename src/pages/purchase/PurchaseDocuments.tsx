import { useState } from "react";
import PurchaseLayout from "@/components/purchase/PurchaseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Eye, Search } from "lucide-react";
import { usePurchaseDocuments, usePurchaseWorkCompletions, usePurchaseProjectImages, useUploadFile } from "@/hooks/usePurchaseData";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const docTypes = ["ISO", "GST", "MSME", "OEM Letters", "Work Orders", "Letter", "PAN", "Tech Specs", "Bill", "Tax Invoice", "Other"];

const PurchaseDocuments = () => {
  const { data: docs, add: addDoc } = usePurchaseDocuments();
  const { data: workComps, add: addWC } = usePurchaseWorkCompletions();
  const { data: projImgs, add: addPI } = usePurchaseProjectImages();
  const { upload } = useUploadFile();

  // Documents form
  const [docOpen, setDocOpen] = useState(false);
  const [docForm, setDocForm] = useState({ name: "", type: "", custom_type: "" });
  const [docFile, setDocFile] = useState<File | null>(null);

  // Work completion form
  const [wcOpen, setWcOpen] = useState(false);
  const [wcForm, setWcForm] = useState({ name: "", project_name: "", organization_name: "", work_order_no: "" });
  const [wcFile, setWcFile] = useState<File | null>(null);

  // Project images form
  const [piOpen, setPiOpen] = useState(false);
  const [piForm, setPiForm] = useState({ project_name: "", organization_name: "", work_order: "" });
  const [piFile, setPiFile] = useState<File | null>(null);
  const [piSearch, setPiSearch] = useState("");

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleAddDoc = async () => {
    if (!docForm.name.trim() || !docForm.type || !docFile) return;
    const file_url = await upload(docFile, "documents", 10);
    if (!file_url) return;
    const { data: { user } } = await supabase.auth.getUser();
    await addDoc({ ...docForm, file_url, created_by: user?.id });
    setDocForm({ name: "", type: "", custom_type: "" }); setDocFile(null); setDocOpen(false);
  };

  const handleAddWC = async () => {
    if (!wcForm.name.trim() || !wcFile) return;
    const file_url = await upload(wcFile, "work-completions", 10);
    if (!file_url) return;
    const { data: { user } } = await supabase.auth.getUser();
    await addWC({ ...wcForm, file_url, created_by: user?.id });
    setWcForm({ name: "", project_name: "", organization_name: "", work_order_no: "" }); setWcFile(null); setWcOpen(false);
  };

  const handleAddPI = async () => {
    if (!piForm.project_name.trim() || !piFile) return;
    const file_url = await upload(piFile, "project-images", 15);
    if (!file_url) return;
    const { data: { user } } = await supabase.auth.getUser();
    await addPI({ ...piForm, file_url, created_by: user?.id });
    setPiForm({ project_name: "", organization_name: "", work_order: "" }); setPiFile(null); setPiOpen(false);
  };

  const filteredPI = projImgs.filter((p: any) =>
    !piSearch || p.project_name.toLowerCase().includes(piSearch.toLowerCase()) || p.organization_name.toLowerCase().includes(piSearch.toLowerCase())
  );

  return (
    <PurchaseLayout title="Documents Manager">
      <Tabs defaultValue="documents">
        <TabsList><TabsTrigger value="documents">Documents</TabsTrigger><TabsTrigger value="work-completion">Work Completion</TabsTrigger><TabsTrigger value="project-images">Project Images</TabsTrigger></TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Documents</span>
                <Dialog open={docOpen} onOpenChange={setDocOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Name</Label><Input value={docForm.name} onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))} /></div>
                      <div>
                        <Label>Type</Label>
                        <Select value={docForm.type} onValueChange={v => setDocForm(p => ({ ...p, type: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>{docTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {docForm.type === "Other" && <div><Label>Custom Type</Label><Input value={docForm.custom_type} onChange={e => setDocForm(p => ({ ...p, custom_type: e.target.value }))} /></div>}
                      <div><Label>Upload PDF (&lt;10MB)</Label><Input type="file" accept=".pdf" onChange={e => setDocFile(e.target.files?.[0] || null)} /></div>
                      <Button onClick={handleAddDoc} className="w-full">Upload</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Uploaded On</TableHead><TableHead>Download</TableHead></TableRow></TableHeader>
                <TableBody>
                  {docs.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No documents</TableCell></TableRow> :
                    docs.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>{d.type === "Other" ? d.custom_type || "Other" : d.type}</TableCell>
                        <TableCell className="text-xs">{d.uploaded_at ? format(new Date(d.uploaded_at), "dd-MM-yyyy hh:mm a") : "-"}</TableCell>
                        <TableCell>{d.file_url && <Button size="sm" variant="outline" asChild><a href={d.file_url} download><Download className="h-3 w-3" /></a></Button>}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Completion Tab */}
        <TabsContent value="work-completion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Work Completion</span>
                <Dialog open={wcOpen} onOpenChange={setWcOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Upload</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Upload Work Completion</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Name</Label><Input value={wcForm.name} onChange={e => setWcForm(p => ({ ...p, name: e.target.value }))} /></div>
                      <div><Label>Project Name</Label><Input value={wcForm.project_name} onChange={e => setWcForm(p => ({ ...p, project_name: e.target.value }))} /></div>
                      <div><Label>Organization</Label><Input value={wcForm.organization_name} onChange={e => setWcForm(p => ({ ...p, organization_name: e.target.value }))} /></div>
                      <div><Label>Work Order No.</Label><Input value={wcForm.work_order_no} onChange={e => setWcForm(p => ({ ...p, work_order_no: e.target.value }))} /></div>
                      <div><Label>Upload PDF (&lt;10MB)</Label><Input type="file" accept=".pdf" onChange={e => setWcFile(e.target.files?.[0] || null)} /></div>
                      <Button onClick={handleAddWC} className="w-full">Upload</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Project</TableHead><TableHead>Organization</TableHead><TableHead>Work Order</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {workComps.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No records</TableCell></TableRow> :
                    workComps.map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell>{w.project_name}</TableCell>
                        <TableCell>{w.organization_name}</TableCell>
                        <TableCell>{w.work_order_no}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {w.file_url && <>
                              <Button size="icon" variant="ghost" onClick={() => setPreviewUrl(w.file_url)}><Eye className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" asChild><a href={w.file_url} download><Download className="h-4 w-4" /></a></Button>
                            </>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Images Tab */}
        <TabsContent value="project-images">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Project Images</span>
                <Dialog open={piOpen} onOpenChange={setPiOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Upload</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Upload Project Image</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Project Name</Label><Input value={piForm.project_name} onChange={e => setPiForm(p => ({ ...p, project_name: e.target.value }))} /></div>
                      <div><Label>Organization</Label><Input value={piForm.organization_name} onChange={e => setPiForm(p => ({ ...p, organization_name: e.target.value }))} /></div>
                      <div><Label>Work Order</Label><Input value={piForm.work_order} onChange={e => setPiForm(p => ({ ...p, work_order: e.target.value }))} /></div>
                      <div><Label>Upload PDF (&lt;15MB)</Label><Input type="file" accept=".pdf" onChange={e => setPiFile(e.target.files?.[0] || null)} /></div>
                      <Button onClick={handleAddPI} className="w-full">Upload</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by project or org..." value={piSearch} onChange={e => setPiSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPI.map((p: any) => (
                  <Card key={p.id}><CardContent className="p-4">
                    <h3 className="font-semibold text-sm">{p.project_name}</h3>
                    <p className="text-xs text-muted-foreground">{p.organization_name}</p>
                    {p.work_order && <p className="text-xs text-muted-foreground">WO: {p.work_order}</p>}
                    {p.file_url && <Button size="sm" variant="outline" className="mt-2" asChild><a href={p.file_url} download><Download className="h-3 w-3 mr-1" /> Download</a></Button>}
                  </CardContent></Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Preview</DialogTitle></DialogHeader>
          {previewUrl && <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg" />}
        </DialogContent>
      </Dialog>
    </PurchaseLayout>
  );
};

export default PurchaseDocuments;
