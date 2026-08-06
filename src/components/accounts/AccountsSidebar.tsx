import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePortalNotifications } from "@/hooks/usePortalNotifications";
import { 
  LayoutDashboard, 
  Receipt, 
  Settings, 
  LogOut,
  Menu,
  X,
  ClipboardList,
  IndianRupee
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AccountsSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { hasNew, markViewed } = usePortalNotifications("accounts");

  useEffect(() => {
    markViewed(location.pathname);
  }, [location.pathname, markViewed]);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/accounts/dashboard" },
    { icon: Receipt, label: "Vouchers", path: "/accounts/vouchers" },
    { icon: IndianRupee, label: "Payments", path: "/accounts/payments" },
    { icon: IndianRupee, label: "Tender Payments", path: "/accounts/tender-payments" },
    { icon: ClipboardList, label: "Director Tasks", path: "/accounts/director-tasks" },
    { icon: Settings, label: "Settings", path: "/accounts/settings" },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("accountsUser");
    sessionStorage.removeItem("accountsProfile");
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
    markViewed(path);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold text-primary">Employee Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Accounts Module</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 text-left relative
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted text-foreground"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {hasNew[item.path] && !isActive && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AccountsSidebar;
