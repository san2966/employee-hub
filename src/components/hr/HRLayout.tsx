import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HRSidebar from "./HRSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HRLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface HRSession {
  email: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  designation?: string;
}

const HRLayout = ({ children, title }: HRLayoutProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<HRSession | null>(null);

  useEffect(() => {
    const sessionData = sessionStorage.getItem("hrSession");
    if (!sessionData) {
      navigate("/login/hr");
      return;
    }
    setSession(JSON.parse(sessionData));
  }, [navigate]);

  if (!session) return null;

  const displayName = session.firstName && session.lastName 
    ? `${session.firstName} ${session.lastName}` 
    : "HR User";

  const initials = session.firstName && session.lastName
    ? `${session.firstName[0]}${session.lastName[0]}`
    : "HR";

  return (
    <div className="min-h-screen bg-background flex">
      <HRSidebar />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4 ml-12 lg:ml-0">
            <img 
              src="/placeholder.svg" 
              alt="Company Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-semibold text-foreground hidden sm:block">{title}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {displayName}
            </span>
            <Avatar className="h-9 w-9">
              <AvatarImage src={session.profilePhoto} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default HRLayout;
