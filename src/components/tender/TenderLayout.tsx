import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TenderSidebar from "./TenderSidebar";

interface TenderLayoutProps {
  children: ReactNode;
  title: string;
}

const TenderLayout = ({ children, title }: TenderLayoutProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const sessionData = sessionStorage.getItem("tenderSession");
    if (!sessionData) {
      navigate("/login/tender");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <TenderSidebar />

      <div className="lg:pl-72 pt-14 lg:pt-0 transition-all duration-300">
        <header className="sticky top-14 lg:top-0 z-30 bg-card border-b px-4 md:px-6 h-14 flex items-center">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </header>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TenderLayout;
