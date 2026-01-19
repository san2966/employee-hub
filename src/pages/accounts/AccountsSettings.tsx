import { useState, useEffect } from "react";
import AccountsLayout from "@/components/accounts/AccountsLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, User } from "lucide-react";

interface AccountsProfile {
  firstName: string;
  lastName: string;
  mobile: string;
  designation: string;
  photo: string;
}

const AccountsSettings = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<AccountsProfile>({
    firstName: "",
    lastName: "",
    mobile: "",
    designation: "",
    photo: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedProfile = sessionStorage.getItem("accountsProfile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleInputChange = (field: keyof AccountsProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    sessionStorage.setItem("accountsProfile", JSON.stringify(profile));
    
    toast({
      title: "Settings Saved",
      description: "Your profile has been updated successfully",
    });
    
    setIsLoading(false);
    
    // Trigger re-render of layout
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <AccountsLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
          <p className="opacity-90">Update your personal information</p>
        </div>

        {/* Profile Form */}
        <div className="card-corporate p-6 space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-primary/20">
                {profile.photo ? (
                  <img 
                    src={profile.photo} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 h-10 w-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                <Camera className="h-5 w-5 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Click the camera icon to upload a profile photo
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={profile.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={profile.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter mobile number"
                value={profile.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                placeholder="Enter designation"
                value={profile.designation}
                onChange={(e) => handleInputChange("designation", e.target.value)}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="min-w-32"
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AccountsLayout>
  );
};

export default AccountsSettings;
