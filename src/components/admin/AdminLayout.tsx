import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

interface AdminSession {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  mobile: string;
  designation: string;
  profileImage: string;
  loginTime: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    const storedSession = sessionStorage.getItem("adminSession");
    const authData = sessionStorage.getItem("authUser");
    
    if (storedSession) {
      setSession(JSON.parse(storedSession));
    } else if (authData) {
      const user = JSON.parse(authData);
      if (user.role === "admin") {
        setSession({
          email: user.username,
          firstName: "Admin",
          lastName: "",
          displayName: "Admin",
          mobile: "",
          designation: "Administrator",
          profileImage: "",
          loginTime: new Date().toISOString(),
        });
      } else {
        navigate("/login/admin");
      }
    } else {
      navigate("/login/admin");
    }
  }, [navigate]);

  if (!session) return null;

  const displayName = session.displayName || session.firstName || "Admin";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="ml-12 md:ml-0">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {displayName}
              </span>
              <Avatar className="h-10 w-10">
                <AvatarImage src={session.profileImage} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
