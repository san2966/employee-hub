import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDirectorNotifications } from "@/hooks/useDirectorNotifications";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Bell,
  Calendar,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DirectorSession {
  displayName: string;
  profileImage: string;
  designation: string;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/director/dashboard" },
  { icon: ClipboardList, label: "Task Manager", path: "/director/tasks" },
  { icon: FileText, label: "Reports", path: "/director/reports" },
  { icon: Bell, label: "Notice/Announcements", path: "/director/notices" },
  { icon: Calendar, label: "Leave Manager", path: "/director/leaves" },
  { icon: Package, label: "Requirements", path: "/director/requirements" },
  { icon: Package, label: "Product Manager", path: "/director/products" },
  { icon: Users, label: "Contacts", path: "/director/contacts" },
  { icon: FileText, label: "Tender Monitor", path: "/director/tender-monitor" },
  { icon: FileText, label: "Quotation Manager", path: "/director/quotations" },
  { icon: FileText, label: "Record Management", path: "/director/records" },
  { icon: Settings, label: "Settings", path: "/director/settings" },
];

const DirectorSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasNew, markViewed } = useDirectorNotifications();

  const sessionData = sessionStorage.getItem("directorSession");
  const session: DirectorSession = sessionData 
    ? JSON.parse(sessionData) 
    : { displayName: "User", profileImage: "", designation: "Director" };

  const handleLogout = () => {
    sessionStorage.removeItem("directorSession");
    navigate("/");
  };

  // Mark current page as viewed whenever route changes
  useEffect(() => {
    markViewed(location.pathname);
  }, [location.pathname, markViewed]);

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <Link to="/director/dashboard" className="flex items-center gap-2">
          <div className="gradient-primary p-2 rounded-lg">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-semibold text-sidebar-foreground">VMCC India</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex text-sidebar-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </Button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden">
            {session.profileImage ? (
              <img src={session.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-sidebar-foreground">
                {session.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {session.displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/60">{session.designation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent ${collapsed ? "px-3" : ""}`}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="ml-3 text-sm font-medium">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b h-14 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 ml-3">
          <div className="gradient-primary p-1.5 rounded-lg">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">VMCC India</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{session.displayName}</span>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {session.profileImage ? (
              <img src={session.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-primary">
                {session.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 text-sidebar-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-sidebar transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default DirectorSidebar;
