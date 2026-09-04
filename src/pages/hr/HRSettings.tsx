import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HRLayout from "@/components/hr/HRLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save } from "lucide-react";
import DeviceHistoryCard from "@/components/DeviceHistoryCard";

interface HRProfile {
  firstName: string;
  lastName: string;
  mobile: string;
  designation: string;
  profilePhoto: string;
}

const HRSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<HRProfile>({
    firstName: "",
    lastName: "",
    mobile: "",
    designation: "",
    profilePhoto: "",
  });

  useEffect(() => {
    const sessionData = sessionStorage.getItem("hrSession");
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setProfile({
        firstName: session.firstName || "",
        lastName: session.lastName || "",
        mobile: session.mobile || "",
        designation: session.designation || "HR Manager",
        profilePhoto: session.profilePhoto || "",
      });
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const sessionData = sessionStorage.getItem("hrSession");
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const updatedSession = {
        ...session,
        ...profile,
      };
      sessionStorage.setItem("hrSession", JSON.stringify(updatedSession));
      
      toast({
        title: "Settings Saved",
        description: "Your profile has been updated successfully.",
      });

      // Force re-render by navigating
      navigate("/hr/settings");
      window.location.reload();
    }
  };

  const initials = profile.firstName && profile.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : "HR";

  return (
    <HRLayout title="Settings">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Profile Settings</h2>

          {/* Profile Photo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.profilePhoto} alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Click the camera icon to upload a new photo
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={profile.mobile}
                onChange={(e) => setProfile(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={profile.designation}
                onChange={(e) => setProfile(prev => ({ ...prev, designation: e.target.value }))}
                placeholder="Enter designation"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-6 max-w-6xl mx-auto"><DeviceHistoryCard /></div>
    </HRLayout>
  );
};

export default HRSettings;
