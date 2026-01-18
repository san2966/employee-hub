import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DirectorSidebar from "./DirectorSidebar";

interface DirectorLayoutProps {
  children: ReactNode;
  title: string;
}

const DirectorLayout = ({ children, title }: DirectorLayoutProps) => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const sessionData = sessionStorage.getItem("directorSession");
    if (!sessionData) {
      navigate("/login/director");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <DirectorSidebar />
      
      {/* Main Content */}
      <div className="lg:pl-64 pt-14 lg:pt-0 transition-all duration-300">
        {/* Page Header */}
        <header className="sticky top-14 lg:top-0 z-30 bg-card border-b px-4 md:px-6 h-14 flex items-center">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DirectorLayout;
