import { useState, useRef } from "react";
import ITHeadLayout from "@/components/ithead/ITHeadLayout";
import { useITHeadData } from "@/hooks/useITHeadData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Image as ImageIcon, Trash2, Network, ZoomIn, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ITHeadNetwork = () => {
  const { networkImages, addNetworkImage, deleteNetworkImage } = useITHeadData();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
        if (!imageName) {
          setImageName(file.name.replace(/\.[^/.]+$/, ""));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    if (!imageName.trim() || !imageUrl) {
      toast({
        title: "Validation Error",
        description: "Please provide an image name and upload an image",
        variant: "destructive"
      });
      return;
    }

    addNetworkImage(imageName.trim(), imageUrl);
    toast({
      title: "Image Added",
      description: "Network topology image has been uploaded"
    });
    setImageName("");
    setImageUrl("");
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteNetworkImage(id);
    toast({
      title: "Image Deleted",
      description: "Network image has been removed"
    });
  };

  return (
    <ITHeadLayout title="Network Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">
              Manage network topology diagrams and infrastructure images
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </div>

        {/* Images Grid */}
        {networkImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {networkImages.map((image) => (
              <Card key={image.id} className="overflow-hidden group">
                <div className="relative aspect-video bg-muted">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setPreviewImage(image.url)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">{image.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Added {format(new Date(image.createdAt), "PP")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No network images uploaded yet. Add your first network topology diagram!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Image Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Network Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image Name *</Label>
              <Input
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="e.g., Main Office Network Topology"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Image *</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload an image (max 5MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImageName(""); setImageUrl(""); setIsAddOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                Network Diagram
                <Button variant="ghost" size="icon" onClick={() => setPreviewImage(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              <img
                src={previewImage}
                alt="Network diagram"
                className="max-w-full max-h-[70vh] rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ITHeadLayout>
  );
};

export default ITHeadNetwork;
