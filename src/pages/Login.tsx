import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Building2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const roleLabels: Record<string, string> = {
  director: "Director",
  hr: "HR",
  accounts: "Accounts",
  employee: "Employee",
  admin: "Admin",
  ithead: "IT Head",
};

const Login = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isLoading } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const roleLabel = role ? roleLabels[role] || "User" : "User";

  const validateInput = (value: string, fieldName: string): boolean => {
    if (!value.trim()) {
      toast({
        title: "Validation Error",
        description: `${fieldName} is required`,
        variant: "destructive",
      });
      return false;
    }
    if (value.length < 3) {
      toast({
        title: "Validation Error",
        description: `${fieldName} must be at least 3 characters`,
        variant: "destructive",
      });
      return false;
    }
    if (value.length > 50) {
      toast({
        title: "Validation Error",
        description: `${fieldName} must be less than 50 characters`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInput(username, "Username") || !validateInput(password, "Password")) {
      return;
    }

    const result = await login(username, password, role);

    if (result.success) {
      toast({
        title: "Login Successful",
        description: `Welcome back, ${roleLabel}!`,
      });
      
      // Navigate to appropriate dashboard based on role
      const userRole = result.user?.role || role;
      switch (userRole) {
        case "director":
          navigate("/director/dashboard");
          break;
        case "hr":
          navigate("/hr/dashboard");
          break;
        case "accounts":
          navigate("/accounts/dashboard");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "ithead":
          navigate("/ithead/dashboard");
          break;
        case "employee":
          navigate("/employee/dashboard");
          break;
        default:
          navigate(`/dashboard/${userRole}`);
      }
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Portal</span>
        </Link>

        {/* Login Card */}
        <div className="bg-card rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="gradient-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{roleLabel} Login</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
                maxLength={50}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  maxLength={50}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <a 
              href="#" 
              className="text-sm text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                toast({
                  title: "Password Reset",
                  description: "Please contact your administrator to reset your password.",
                });
              }}
            >
              Forgot your password?
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-primary-foreground/60 text-xs mt-6">
          This is a secure portal. All connections are encrypted.
        </p>
      </div>
    </div>
  );
};

export default Login;
