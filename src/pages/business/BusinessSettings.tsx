import { useEffect, useState } from "react";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessAuth, designationLabels } from "@/hooks/useBusinessAuth";
import DeviceHistoryCard from "@/components/DeviceHistoryCard";

const BusinessSettings = () => {
  const { toast } = useToast();
  const { profile, reload } = useBusinessAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  useEffect(() => {
    setName(profile?.name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  const saveProfile = async () => {
    if (!profile) return;
    const { error } = await (supabase as any)
      .from("business_profiles").update({ name, phone }).eq("id", profile.id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Profile updated" });
    void reload();
  };

  const changePassword = async () => {
    if (pw.length < 8) { toast({ title: "Password must be at least 8 characters", variant: "destructive" }); return; }
    if (pw !== pw2) { toast({ title: "Passwords do not match", variant: "destructive" }); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast({ title: "Could not change password", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Password changed" });
    setPw(""); setPw2("");
  };

  return (
    <BusinessLayout title="Settings">
      <div className="grid gap-4 lg:grid-cols-2 max-w-4xl">
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Profile</h2>
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={profile?.email ?? ""} disabled /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div>
            <Label>Designation</Label>
            <Input value={profile ? designationLabels[profile.designation] : ""} disabled />
          </div>
          <Button onClick={saveProfile}>Save Changes</Button>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Change Password</h2>
          <div><Label>New Password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div><Label>Confirm Password</Label><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <Button onClick={changePassword}>Update Password</Button>
        </Card>
      </div>
      <div className="mt-6 max-w-6xl mx-auto"><DeviceHistoryCard /></div>
    </BusinessLayout>
  );
};

export default BusinessSettings;