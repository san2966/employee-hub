import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "./EmployeeSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EmployeeLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface EmployeeSession {
  employeeId: string;
  employeeName: string;
  username: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  designation?: string;
}

const EmployeeLayout = ({ children, title }: EmployeeLayoutProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<EmployeeSession | null>(null);

  useEffect(() => {
    const storedSession = sessionStorage.getItem("employee_session");
    if (!storedSession) {
      navigate("/login/employee");
      return;
    }
    setSession(JSON.parse(storedSession));
  }, [navigate]);

  if (!session) {
    return null;
  }

  const displayName = session.firstName && session.lastName 
    ? `${session.firstName} ${session.lastName}` 
    : session.employeeName || "Employee";

  return (
    <div className="min-h-screen bg-background">
      <EmployeeSidebar />
      
      {/* Main content */}
      <div className="md:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="pl-12 md:pl-0">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-foreground">{displayName}</p>
                <p className="text-sm text-muted-foreground">{session.designation || "Employee"}</p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={session.photo} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
