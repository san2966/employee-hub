import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountsSidebar from "./AccountsSidebar";
import { User } from "lucide-react";

interface AccountsLayoutProps {
  children: ReactNode;
  title: string;
}

interface AccountsProfile {
  firstName: string;
  lastName: string;
  mobile: string;
  designation: string;
  photo: string;
}

const AccountsLayout = ({ children, title }: AccountsLayoutProps) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AccountsProfile | null>(null);

  useEffect(() => {
    const accountsUser = sessionStorage.getItem("accountsUser");
    const authData = sessionStorage.getItem("authUser");
    
    if (accountsUser) {
      const savedProfile = sessionStorage.getItem("accountsProfile");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } else if (authData) {
      const user = JSON.parse(authData);
      if (user.role === "accounts") {
        // Valid accounts session via unified login
      } else {
        navigate("/login/accounts");
      }
    } else {
      navigate("/login/accounts");
    }
  }, [navigate]);

  const displayName = profile?.firstName 
    ? `${profile.firstName} ${profile.lastName}`.trim() 
    : "User";

  return (
    <div className="min-h-screen bg-background flex">
      <AccountsSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 lg:px-8">
          <div className="lg:ml-0 ml-12">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Welcome, <span className="font-medium text-foreground">{displayName}</span>
            </span>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {profile?.photo ? (
                <img src={profile.photo} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AccountsLayout;
