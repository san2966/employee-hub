import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { usePortalNotifications } from "@/hooks/usePortalNotifications";
import { 
  LayoutDashboard, 
  HardDrive, 
  Key, 
  Network, 
  Phone, 
  Settings, 
  LogOut,
  Menu,
  Ticket,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/ithead/dashboard" },
  { icon: Ticket, label: "Ticket Management", path: "/ithead/tickets" },
  { icon: HardDrive, label: "Asset Management", path: "/ithead/assets" },
  { icon: Key, label: "Password Management", path: "/ithead/passwords" },
  { icon: Network, label: "Network Management", path: "/ithead/network" },
  { icon: Phone, label: "Telephone/Intercom", path: "/ithead/telephone" },
  { icon: Settings, label: "Settings", path: "/ithead/settings" },
];

const ITHeadSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { hasNew, markViewed } = usePortalNotifications("ithead");

  useEffect(() => {
    markViewed(location.pathname);
  }, [location.pathname, markViewed]);

  const handleLogout = () => {
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    navigate("/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-primary">IT Head Portal</h2>
        <p className="text-xs text-muted-foreground">Infrastructure Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              setIsOpen(false);
              markViewed(item.path);
            }}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-4 w-4" />
                {item.label}
                {hasNew[item.path] && !isActive && (
                  <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        {sidebarContent}
      </aside>
    </>
  );
};

export default ITHeadSidebar;
