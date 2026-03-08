import { Link } from "react-router-dom";
import { 
  Crown, 
  Users, 
  Calculator, 
  User, 
  Shield, 
  Server,
  FileText,
  ShoppingCart,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LoginCard from "@/components/LoginCard";

const loginOptions = [
  {
    title: "Director Login",
    description: "Access executive reports and strategic insights",
    icon: Crown,
    role: "director",
    customPath: "/login/director",
  },
  {
    title: "HR Login",
    description: "Manage employee profiles and recruitment",
    icon: Users,
    role: "hr",
    customPath: "/login/hr",
  },
  {
    title: "Accounts Login",
    description: "Handle payroll and financial operations",
    icon: Calculator,
    role: "accounts",
    customPath: "/login/accounts",
  },
  {
    title: "Employee Login",
    description: "View payslips and submit requests",
    icon: User,
    role: "employee",
  },
  {
    title: "Admin Login",
    description: "System configuration and user management",
    icon: Shield,
    role: "admin",
    customPath: "/login/admin",
  },
  {
    title: "IT Head Login",
    description: "Manage infrastructure and support tickets",
    icon: Server,
    role: "ithead",
    customPath: "/login/ithead",
  },
  {
    title: "Tender Login",
    description: "Manage tenders, bids and procurement",
    icon: FileText,
    role: "tender",
    customPath: "/login/tender",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="gradient-hero text-primary-foreground py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
              Employee Portal
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
              Secure access to your workplace tools and information. 
              Select your role below to get started.
            </p>
          </div>
        </section>

        {/* Login Cards Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
                Choose Your Portal
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Select your role to access personalized features and tools
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {loginOptions.map((option, index) => (
                <LoginCard
                  key={option.role}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  role={option.role}
                  delay={index * 100}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Secure Access</h3>
                <p className="text-sm text-muted-foreground">
                  Enterprise-grade security with encrypted connections
                </p>
              </div>
              <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">
                  Personalized dashboards for every team member
                </p>
              </div>
              <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">24/7 Available</h3>
                <p className="text-sm text-muted-foreground">
                  Access your portal anytime, anywhere
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
