import { useState } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { useDirectorData, Product } from "@/hooks/useDirectorData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, ShoppingCart, Trash2, ImageIcon } from "lucide-react";

const ProductManager = () => {
  const { toast } = useToast();
  const { products, addProduct, sellProduct, deleteProduct } = useDirectorData();
  
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [productForm, setProductForm] = useState({
    name: "",
    model: "",
    description: "",
    image: "",
  });
  
  const [sellForm, setSellForm] = useState({
    quantity: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.model || !productForm.description) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    addProduct(productForm);
    toast({ title: "Success", description: "Product added" });
    setProductDialogOpen(false);
    setProductForm({ name: "", model: "", description: "", image: "" });
  };

  const handleSell = () => {
    if (!sellForm.quantity || !sellForm.date) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const quantity = parseInt(sellForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Error", description: "Please enter a valid quantity", variant: "destructive" });
      return;
    }

    if (selectedProduct) {
      sellProduct(selectedProduct.id, quantity, sellForm.date);
      toast({ title: "Success", description: "Sale recorded" });
      setSellDialogOpen(false);
      setSellForm({ quantity: "", date: new Date().toISOString().split("T")[0] });
      setSelectedProduct(null);
    }
  };

  const openSellDialog = (product: Product) => {
    setSelectedProduct(product);
    setSellDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm({ ...productForm, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getTotalSales = (product: Product) => {
    return product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
  };

  return (
    <DirectorLayout title="Product Manager">
      <div className="space-y-6">
        {/* Add Product Button */}
        <div className="flex justify-end">
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label>Model *</Label>
                  <Input
                    value={productForm.model}
                    onChange={(e) => setProductForm({ ...productForm, model: e.target.value })}
                    placeholder="Enter model number"
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {productForm.image && (
                    <img src={productForm.image} alt="Preview" className="mt-2 w-full h-32 object-cover rounded" />
                  )}
                </div>
                <Button onClick={handleAddProduct} className="w-full">Add Product</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <div className="card-corporate p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No Products Yet</p>
            <p className="text-muted-foreground mt-2">
              Click "Add Product" to add your first product
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="card-corporate overflow-hidden">
                {/* Product Image */}
                <div className="h-40 bg-muted/30 flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">Model: {product.model}</p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Sales</p>
                      <p className="font-semibold text-primary">{getTotalSales(product)} units</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="gradient-primary" onClick={() => openSellDialog(product)}>
                        <ShoppingCart className="h-4 w-4 mr-1" /> Sell
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Sale - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={sellForm.quantity}
                onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <Label>Date of Sale</Label>
              <Input
                type="date"
                value={sellForm.date}
                onChange={(e) => setSellForm({ ...sellForm, date: e.target.value })}
              />
            </div>
            <Button onClick={handleSell} className="w-full">Record Sale</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DirectorLayout>
  );
};

export default ProductManager;
