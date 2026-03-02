import { useState } from "react";
import TenderLayout from "@/components/tender/TenderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTenderSettings, uploadTenderFile } from "@/hooks/useTenderData";
import { User } from "lucide-react";

const TenderSettings = () => {
  const { settings, loading, save } = useTenderSettings();
  const [form, setForm] = useState({
    first_name: "", last_name: "", mobile: "", designation: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form when settings load
  if (settings && !initialized) {
    setForm({
      first_name: settings.first_name || "",
      last_name: settings.last_name || "",
      mobile: settings.mobile || "",
      designation: settings.designation || "",
    });
    setInitialized(true);
  }

  const handleSave = async () => {
    setSubmitting(true);
    let profile_photo_url = undefined as string | undefined;
    if (photoFile) profile_photo_url = (await uploadTenderFile(photoFile, "profiles")) || undefined;
    const data: any = { ...form };
    if (profile_photo_url) data.profile_photo_url = profile_photo_url;
    await save(data);
    setSubmitting(false);
  };

  if (loading) return <TenderLayout title="Settings"><p>Loading...</p></TenderLayout>;

  return (
    <TenderLayout title="Settings">
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">Profile Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {settings?.profile_photo_url ? (
                <img src={settings.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label>Upload Profile Photo</Label>
              <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name *</Label><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><Label>Last Name *</Label><Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
          </div>
          <div><Label>Mobile Number *</Label><Input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></div>
          <div><Label>Designation *</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} /></div>
          <Button onClick={handleSave} className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Save Settings"}</Button>
        </CardContent>
      </Card>
    </TenderLayout>
  );
};

export default TenderSettings;
