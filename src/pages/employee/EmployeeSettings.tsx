import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeSession {
  employeeId: string;
  employeeName: string;
  username: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  designation?: string;
  mobile?: string;
}

const EmployeeSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    designation: "",
  });
  const [photo, setPhoto] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storedSession = sessionStorage.getItem("employee_session");
    if (!storedSession) {
      navigate("/login/employee");
      return;
    }
    const parsed: EmployeeSession = JSON.parse(storedSession);
    setSession(parsed);

    // Load profile from the database (persists across logins)
    (async () => {
      if (!parsed.employeeId) {
        setForm({
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          mobile: parsed.mobile || "",
          designation: parsed.designation || "",
        });
        setPhoto(parsed.photo || "");
        return;
      }
      // Prefer the dedicated employee_settings row; fall back to employees table.
      const { data: settings } = await supabase
        .from("employee_settings")
        .select("first_name, last_name, mobile, designation, photo")
        .eq("employee_id", parsed.employeeId)
        .maybeSingle();

      const { data: emp } = await supabase
        .from("employees")
        .select("first_name, last_name, mobile, phone, designation, photo, name")
        .eq("id", parsed.employeeId)
        .maybeSingle();

      const fallback = (emp?.name || "").split(" ");
      setForm({
        firstName: settings?.first_name || emp?.first_name || fallback[0] || "",
        lastName:  settings?.last_name  || emp?.last_name  || fallback.slice(1).join(" ") || "",
        mobile:    settings?.mobile     || emp?.mobile || emp?.phone || "",
        designation: settings?.designation || emp?.designation || "",
      });
      setPhoto(settings?.photo || emp?.photo || "");
    })();
  }, [navigate]);

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      if (session.employeeId) {
        const fullName = `${form.firstName} ${form.lastName}`.trim();
        // Upsert the dedicated settings row.
        const { error: setErr } = await supabase
          .from("employee_settings")
          .upsert({
            employee_id: session.employeeId,
            first_name: form.firstName || null,
            last_name: form.lastName || null,
            mobile: form.mobile || null,
            designation: form.designation || null,
            photo: photo || null,
          }, { onConflict: "employee_id" });
        if (setErr) throw setErr;

        // Keep the employees row in sync so other modules display the latest info.
        const { error } = await supabase
          .from("employees")
          .update({
            first_name: form.firstName || null,
            last_name: form.lastName || null,
            mobile: form.mobile || null,
            phone: form.mobile || null,
            designation: form.designation || null,
            photo: photo || null,
            ...(fullName ? { name: fullName } : {}),
          })
          .eq("id", session.employeeId);
        if (error) throw error;
      }

      const updatedSession = { ...session, ...form, photo };
      sessionStorage.setItem("employee_session", JSON.stringify(updatedSession));
      sessionStorage.setItem("employeeSession", JSON.stringify(updatedSession));
      setSession(updatedSession);

      toast({ title: "Settings saved", description: "Your profile has been updated" });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message || "Could not save your profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhoto(result);
        toast({ title: "Photo uploaded" });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!session) return null;

  const displayName = form.firstName && form.lastName 
    ? `${form.firstName} ${form.lastName}` 
    : session.employeeName || "Employee";

  return (
    <EmployeeLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Photo */}
        <Card className="card-corporate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={photo} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
              <div>
                <p className="font-semibold text-lg">{displayName}</p>
                <p className="text-sm text-muted-foreground">{session.username}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the camera icon to upload a new photo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="card-corporate">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input 
                  value={form.firstName} 
                  onChange={e => setForm({ ...form, firstName: e.target.value })} 
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input 
                  value={form.lastName} 
                  onChange={e => setForm({ ...form, lastName: e.target.value })} 
                />
              </div>
            </div>
            <div>
              <Label>Mobile Number</Label>
              <Input 
                value={form.mobile} 
                onChange={e => setForm({ ...form, mobile: e.target.value })} 
              />
            </div>
            <div>
              <Label>Designation</Label>
              <Input 
                value={form.designation} 
                onChange={e => setForm({ ...form, designation: e.target.value })} 
              />
            </div>
            
            <Button className="w-full mt-4" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeSettings;
