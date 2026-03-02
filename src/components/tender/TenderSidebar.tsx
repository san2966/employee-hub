import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  ListTodo,
  Building2,
  FileText,
  FolderOpen,
  Package,
  Search,
  Users,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const TenderSidebar = () => {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const session = sessionStorage.getItem("tenderSession");
    if (session) {
      const parsed = JSON.parse(session);
      setRole(parsed.role);
    }
  }, []);

  const isHead = role === "tender_head";

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/tender/dashboard" },
    { label: "Task Manager", icon: ListTodo, path: "/tender/tasks" },
    ...(isHead
      ? [
          { label: "Company Manager", icon: Building2, path: "/tender/companies" },
          { label: "Documents Manager", icon: FolderOpen, path: "/tender/documents" },
        ]
      : []),
    { label: "Tender Manager", icon: FileText, path: "/tender/tenders" },
    { label: "Product Manager", icon: Package, path: "/tender/products" },
    { label: "Research & Analysis", icon: Search, path: "/tender/research" },
    { label: "Contacts", icon: Users, path: "/tender/contacts" },
    { label: "Settings", icon: Settings, path: "/tender/settings" },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("tenderSession");
    sessionStorage.removeItem("authUser");
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">V</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              VMCC
            </span>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
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
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
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
    </>
  );
};

export default TenderSidebar;
