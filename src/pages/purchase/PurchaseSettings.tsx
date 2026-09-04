import { useState, useEffect } from "react";
import PurchaseLayout from "@/components/purchase/PurchaseLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUploadFile } from "@/hooks/usePurchaseData";
import DeviceHistoryCard from "@/components/DeviceHistoryCard";

const PurchaseSettings = () => {
  const { toast } = useToast();
  const { upload } = useUploadFile();
  const [form, setForm] = useState({ first_name: "", last_name: "", mobile: "", designation: "" });
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await (supabase as any).from("purchase_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setForm({ first_name: data.first_name || "", last_name: data.last_name || "", mobile: data.mobile || "", designation: data.designation || "" });
        setPhotoUrl(data.profile_photo_url || "");
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: existing } = await (supabase as any).from("purchase_settings").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await (supabase as any).from("purchase_settings").update({ ...form, profile_photo_url: photoUrl, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await (supabase as any).from("purchase_settings").insert({ ...form, profile_photo_url: photoUrl, user_id: userId });
    }
    toast({ title: "Success", description: "Settings saved" });
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, "profile");
    if (url) setPhotoUrl(url);
  };

  return (
    <PurchaseLayout title="Settings">
      <Card className="max-w-xl mx-auto">
        <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {photoUrl ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" /> :
                <span className="text-2xl font-medium text-muted-foreground">{form.first_name?.charAt(0) || "U"}</span>}
            </div>
            <Input type="file" accept="image/*" onChange={handlePhotoUpload} className="max-w-48" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name</Label><Input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} /></div>
            <div><Label>Last Name</Label><Input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} /></div>
          </div>
          <div><Label>Mobile</Label><Input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} /></div>
          <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} /></div>
          <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? "Saving..." : "Save"}</Button>
        </CardContent>
      </Card>
      <div className="mt-6 max-w-6xl mx-auto"><DeviceHistoryCard /></div>
    </PurchaseLayout>
  );
};

export default PurchaseSettings;
