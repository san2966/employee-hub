import { useState, useEffect } from "react";
import DirectorLayout from "@/components/director/DirectorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Save } from "lucide-react";

interface DirectorProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  mobile: string;
  designation: string;
  profileImage: string;
}

const Settings = () => {
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<DirectorProfile>({
    firstName: "",
    lastName: "",
    displayName: "User",
    mobile: "",
    designation: "Director",
    profileImage: "",
  });

  useEffect(() => {
    const sessionData = sessionStorage.getItem("directorSession");
    if (sessionData) {
      const data = JSON.parse(sessionData);
      setProfile({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        displayName: data.displayName || "User",
        mobile: data.mobile || "",
        designation: data.designation || "Director",
        profileImage: data.profileImage || "",
      });
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "Image size should be less than 5MB", variant: "destructive" });
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
    const displayName = profile.firstName && profile.lastName 
      ? `${profile.firstName} ${profile.lastName}`
      : profile.firstName || profile.lastName || "User";

    const updatedProfile = { ...profile, displayName };
    
    // Update session storage
    const sessionData = sessionStorage.getItem("directorSession");
    if (sessionData) {
      const data = JSON.parse(sessionData);
      sessionStorage.setItem("directorSession", JSON.stringify({ ...data, ...updatedProfile }));
    }

    setProfile(updatedProfile);
    toast({ title: "Success", description: "Profile updated successfully" });
    
    // Reload to update sidebar
    window.location.reload();
  };

  return (
    <DirectorLayout title="Settings">
      <div className="max-w-2xl mx-auto">
        <div className="card-corporate p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Profile Settings</h2>
          
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden mb-4">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            <Label htmlFor="profile-image" className="cursor-pointer">
              <span className="text-sm text-primary hover:underline">Upload Photo</span>
              <Input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </Label>
            <p className="text-xs text-muted-foreground mt-1">Max 5MB, JPG or PNG</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div>
              <Label>Mobile Number</Label>
              <Input
                type="tel"
                value={profile.mobile}
                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                placeholder="Enter mobile number"
              />
            </div>
            
            <div>
              <Label>Designation</Label>
              <Input
                value={profile.designation}
                onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                placeholder="Enter designation"
              />
            </div>

            <Button onClick={handleSave} className="w-full gradient-primary">
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </DirectorLayout>
  );
};

export default Settings;
