import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, User } from "lucide-react";

interface AdminProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  mobile: string;
  designation: string;
  profileImage: string;
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<AdminProfile>({
    firstName: "",
    lastName: "",
    displayName: "",
    mobile: "",
    designation: "System Administrator",
    profileImage: "",
  });

  useEffect(() => {
    const storedSession = sessionStorage.getItem("adminSession");
    if (storedSession) {
      const session = JSON.parse(storedSession);
      setProfile({
        firstName: session.firstName || "",
        lastName: session.lastName || "",
        displayName: session.displayName || "Administrator",
        mobile: session.mobile || "",
        designation: session.designation || "System Administrator",
        profileImage: session.profileImage || "",
      });
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const storedSession = sessionStorage.getItem("adminSession");
    if (storedSession) {
      const session = JSON.parse(storedSession);
      const updatedSession = {
        ...session,
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName || `${profile.firstName} ${profile.lastName}`.trim() || "Administrator",
        mobile: profile.mobile,
        designation: profile.designation,
        profileImage: profile.profileImage,
      };
      sessionStorage.setItem("adminSession", JSON.stringify(updatedSession));
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });
      
      // Reload to reflect changes in header
      window.location.reload();
    }
  };

  const displayName = profile.displayName || profile.firstName || "Admin";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.profileImage} alt="Profile" />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Pencil className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the pencil icon to upload a new photo
              </p>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                placeholder="Enter display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                value={profile.mobile}
                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={profile.designation}
                onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                placeholder="Enter designation"
              />
            </div>

            <Button onClick={handleSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
