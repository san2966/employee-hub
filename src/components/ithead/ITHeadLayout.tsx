import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ITHeadSidebar from "./ITHeadSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useITHeadData } from "@/hooks/useITHeadData";

interface ITHeadLayoutProps {
  children: ReactNode;
  title: string;
}

const ITHeadLayout = ({ children, title }: ITHeadLayoutProps) => {
  const navigate = useNavigate();
  const { profile } = useITHeadData();

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    if (role !== "ithead") {
      navigate("/login/ithead");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <ITHeadSidebar />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="pl-12 lg:pl-0">
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{profile.designation}</p>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile.profilePhoto} alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ITHeadLayout;
