import { useState } from "react";
import PurchaseLayout from "@/components/purchase/PurchaseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Settings2, Trash2 } from "lucide-react";
import { usePurchaseProducts, usePurchaseVendors, useUploadFile } from "@/hooks/usePurchaseData";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PurchaseProductManager = () => {
  const { data: products, add: addProduct, update: updateProduct, remove: removeProduct } = usePurchaseProducts();
  const { data: vendors, add: addVendor, remove: removeVendor } = usePurchaseVendors();
  const { upload } = useUploadFile();

  const [prodOpen, setProdOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [prodForm, setProdForm] = useState({ name: "", model: "", manufacturer: "", price: "" });
  const [vendorForm, setVendorForm] = useState({ name: "", contact_details: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [specsFile, setSpecsFile] = useState<File | null>(null);

  const handleAddProduct = async () => {
    if (!prodForm.name.trim() || !prodForm.model.trim() || !prodForm.manufacturer.trim()) return;
    let image_url = null, tech_specs_url = null;
    if (imageFile) image_url = await upload(imageFile, "products");
    if (specsFile) tech_specs_url = await upload(specsFile, "products");
    const { data: { user } } = await supabase.auth.getUser();
    if (editProduct) {
      await updateProduct(editProduct.id, { ...prodForm, price: prodForm.price ? Number(prodForm.price) : null, ...(image_url && { image_url }), ...(tech_specs_url && { tech_specs_url }) });
    } else {
      await addProduct({ ...prodForm, price: prodForm.price ? Number(prodForm.price) : null, image_url, tech_specs_url, created_by: user?.id });
    }
    setProdForm({ name: "", model: "", manufacturer: "", price: "" });
    setImageFile(null); setSpecsFile(null); setEditProduct(null);
    setProdOpen(false);
  };

  const handleAddVendor = async () => {
    if (!vendorForm.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await addVendor({ ...vendorForm, created_by: user?.id });
    setVendorForm({ name: "", contact_details: "" });
    setVendorOpen(false);
  };

  const downloadAllPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16); pdf.text("Products Catalog", 14, 20);
    autoTable(pdf, {
      startY: 30,
      head: [["Name", "Model", "Manufacturer", "Price"]],
      body: products.map((p: any) => [p.name, p.model, p.manufacturer, p.price ? `₹${p.price}` : "-"]),
    });
    pdf.save("Products_Catalog.pdf");
  };

  return (
    <PurchaseLayout title="Product Manager">
      <Tabs defaultValue="products">
        <TabsList><TabsTrigger value="products">Products</TabsTrigger><TabsTrigger value="vendors">Vendors</TabsTrigger></TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Products</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={downloadAllPDF}><Download className="h-4 w-4 mr-1" /> Download All</Button>
                  <Dialog open={prodOpen} onOpenChange={setProdOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Product</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{editProduct ? "Edit" : "Add"} Product</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div><Label>Name</Label><Input value={prodForm.name} onChange={e => setProdForm(p => ({ ...p, name: e.target.value }))} /></div>
                        <div><Label>Model</Label><Input value={prodForm.model} onChange={e => setProdForm(p => ({ ...p, model: e.target.value }))} /></div>
                        <div><Label>Manufacturer</Label><Input value={prodForm.manufacturer} onChange={e => setProdForm(p => ({ ...p, manufacturer: e.target.value }))} /></div>
                        <div><Label>Price</Label><Input type="number" value={prodForm.price} onChange={e => setProdForm(p => ({ ...p, price: e.target.value }))} /></div>
                        <div><Label>Image</Label><Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} /></div>
                        <div><Label>Tech Specs</Label><Input type="file" accept=".pdf,image/*" onChange={e => setSpecsFile(e.target.files?.[0] || null)} /></div>
                        <Button onClick={handleAddProduct} className="w-full">Save</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p: any) => (
                  <Card key={p.id} className="overflow-hidden">
                    {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />}
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.manufacturer} • {p.model}</p>
                      {p.price && <p className="text-sm font-medium mt-1">₹{p.price}</p>}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => { setEditProduct(p); setProdForm({ name: p.name, model: p.model, manufacturer: p.manufacturer, price: p.price?.toString() || "" }); setProdOpen(true); }}>
                          <Settings2 className="h-3 w-3 mr-1" /> Manage
                        </Button>
                        {p.tech_specs_url && <Button size="sm" variant="outline" asChild><a href={p.tech_specs_url} download><Download className="h-3 w-3 mr-1" /> Specs</a></Button>}
                        <Button size="icon" variant="ghost" onClick={() => removeProduct(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vendors</span>
                <Dialog open={vendorOpen} onOpenChange={setVendorOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Vendor</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Vendor Name</Label><Input value={vendorForm.name} onChange={e => setVendorForm(p => ({ ...p, name: e.target.value }))} /></div>
                      <div><Label>Contact Details</Label><Input value={vendorForm.contact_details} onChange={e => setVendorForm(p => ({ ...p, contact_details: e.target.value }))} /></div>
                      <Button onClick={handleAddVendor} className="w-full">Save</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact Details</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {vendors.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No vendors</TableCell></TableRow> :
                    vendors.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell>{v.contact_details || "-"}</TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => removeVendor(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PurchaseLayout>
  );
};

export default PurchaseProductManager;
