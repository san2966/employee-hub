import { useState, useEffect, useRef } from "react";
import OperationsLayout from "@/components/operations/OperationsLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload } from "lucide-react";

const OperationsSettings = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", mobile: "", designation: "" });
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await (supabase as any).from("operations_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setForm({ first_name: data.first_name || "", last_name: data.last_name || "", mobile: data.mobile || "", designation: data.designation || "" });
        setPhotoUrl(data.profile_photo_url || "");
      }
    };
    load();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Photo must be under 5MB", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop();
    const path = `settings/profile_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("operations-files").upload(path, file);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = await supabase.storage.from("operations-files").createSignedUrl(path, 3600 * 24 * 365);
    if (data?.signedUrl) setPhotoUrl(data.signedUrl);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const payload = { ...form, profile_photo_url: photoUrl, user_id: userId, updated_at: new Date().toISOString() };
    const { data: existing } = await (supabase as any).from("operations_settings").select("id").eq("user_id", userId).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await (supabase as any).from("operations_settings").update(payload).eq("user_id", userId));
    } else {
      ({ error } = await (supabase as any).from("operations_settings").insert(payload));
    }
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Settings saved successfully" });
      // Refresh layout
      window.location.reload();
    }
    setSaving(false);
  };

  return (
    <OperationsLayout title="Settings">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-medium text-muted-foreground">
                  {(form.first_name || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3 w-3 mr-1" />Upload Photo
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name</Label><Input value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} /></div>
            <div><Label>Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} /></div>
          </div>
          <div><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} /></div>
          <div><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} /></div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </OperationsLayout>
  );
};

export default OperationsSettings;
