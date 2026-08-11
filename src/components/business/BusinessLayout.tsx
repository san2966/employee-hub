import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessAuth, designationLabels } from "@/hooks/useBusinessAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu, X, LayoutDashboard, Users, MapPin, PhoneCall, Target, Flame,
  ListTodo, FileBarChart, CalendarRange, Radio, Settings, LogOut,
} from "lucide-react";

type Designation =
  | "business_head" | "director" | "area_sales_manager"
  | "business_development_manager" | "rc_technical";

const allItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/business/dashboard" },
  { key: "employees", label: "Employees", icon: Users, path: "/business/employees" },
  { key: "areas", label: "Areas", icon: MapPin, path: "/business/areas" },
  { key: "followups", label: "Telephonic Followup", icon: PhoneCall, path: "/business/followups" },
  { key: "opportunities", label: "Opportunity", icon: Target, path: "/business/opportunities" },
  { key: "leads", label: "Lead", icon: Flame, path: "/business/leads" },
  { key: "tasks", label: "Tasks", icon: ListTodo, path: "/business/tasks" },
  { key: "weekly", label: "Weekly Plan", icon: CalendarRange, path: "/business/weekly-plan" },
  { key: "reports", label: "Report", icon: FileBarChart, path: "/business/reports" },
  { key: "rc", label: "RC Tracker", icon: Radio, path: "/business/rc-tracker" },
  { key: "settings", label: "Settings", icon: Settings, path: "/business/settings" },
];

/** Menu composition per designation (order matters). */
const menuByDesignation: Record<Designation, string[]> = {
  business_head: ["dashboard", "employees", "areas", "followups", "opportunities", "leads", "tasks", "weekly", "reports", "rc", "settings"],
  director: ["dashboard", "opportunities", "leads", "weekly", "reports", "settings"],
  area_sales_manager: ["dashboard", "opportunities", "leads", "tasks", "weekly", "reports", "rc", "settings"],
  business_development_manager: ["dashboard", "followups", "opportunities", "leads", "tasks", "weekly", "reports", "settings"],
  rc_technical: ["dashboard", "tasks", "weekly", "reports", "rc", "settings"],
};

const BusinessLayout = ({ children, title }: { children: ReactNode; title: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading } = useBusinessAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!profile) { navigate("/business/login"); return; }
    if (profile.must_change_password && location.pathname !== "/business/set-password") {
      navigate("/business/set-password");
    }
  }, [loading, profile, navigate, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/business/login");
  };

  const keys = menuByDesignation[(profile?.designation as Designation) ?? "business_head"]
    ?? menuByDesignation.business_head;
  const items = keys
    .map((k) => allItems.find((i) => i.key === k)!)
    .filter(Boolean);

  const displayName = profile?.name ?? "";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          <span className="text-lg font-bold text-foreground">Business</span>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 border-b border-border">
        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground">
          {profile ? designationLabels[profile.designation] : ""}
        </p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1.5">
          {items.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <button
                  onClick={() => { navigate(item.path); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  <span className="text-sm font-medium text-left">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <aside className="hidden md:flex w-72 h-screen bg-card border-r border-border flex-col fixed left-0 top-0">
        <SidebarContent />
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-30 bg-card border-b px-4 md:px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground pl-10 md:pl-0">{title}</h1>
          <span className="text-sm text-muted-foreground hidden sm:block">{displayName}</span>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default BusinessLayout;