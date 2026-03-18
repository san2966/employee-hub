import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePortalNotifications } from "@/hooks/usePortalNotifications";
import {
  LayoutDashboard,
  CreditCard,
  ListTodo,
  Users,
  UserCog,
  PackageOpen,
  Truck,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeftRight,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: CreditCard, label: "Payments", path: "/admin/payments" },
  { icon: ListTodo, label: "Tasks", path: "/admin/tasks" },
  { icon: Users, label: "Visitor Report", path: "/admin/visitors" },
  { icon: UserCog, label: "User Management", path: "/admin/users" },
  { icon: ArrowLeftRight, label: "Inward/Outward", path: "/admin/inward-outward" },
  { icon: PackageOpen, label: "Asset Management", path: "/admin/assets" },
  { icon: Truck, label: "Vehicle Management", path: "/admin/vehicles" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { hasNew, markViewed } = usePortalNotifications("admin");

  useEffect(() => {
    markViewed(location.pathname);
  }, [location.pathname, markViewed]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminSession");
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-card border-r shadow-lg z-40 transform transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-primary">Admin Portal</h2>
            <p className="text-sm text-muted-foreground">Administration Panel</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                  markViewed(item.path);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {hasNew[item.path] && !isActive(item.path) && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
