import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OperationsSidebar from "./OperationsSidebar";
import { supabase } from "@/integrations/supabase/client";

interface OperationsLayoutProps {
  children: ReactNode;
  title: string;
}

const OperationsLayout = ({ children, title }: OperationsLayoutProps) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const sessionData = sessionStorage.getItem("operationsSession");
    if (!sessionData) {
      navigate("/login/operations");
      return;
    }
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await (supabase as any).from("operations_settings").select("*").eq("user_id", user.id).maybeSingle();
        if (data) setSettings(data);
      }
    };
    fetchSettings();
  }, [navigate]);

  const displayName = settings?.first_name ? `${settings.first_name} ${settings.last_name || ""}`.trim() : "User";
  const photoUrl = settings?.profile_photo_url || "";

  return (
    <div className="min-h-screen bg-background">
      <OperationsSidebar displayName={displayName} photoUrl={photoUrl} />
      <div className="lg:pl-72 pt-14 lg:pt-0 transition-all duration-300">
        <header className="sticky top-14 lg:top-0 z-30 bg-card border-b px-4 md:px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{displayName}</span>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default OperationsLayout;
