import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Server, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const ITHeadLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isLoading } = useAuth();

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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInput(username, "Username") || !validateInput(password, "Password")) {
      return;
    }

    const result = await login(username, password, "ithead");

    if (result.success) {
      sessionStorage.setItem("userRole", "ithead");
      sessionStorage.setItem("userName", result.user?.username || username);
      sessionStorage.setItem("itHeadSession", JSON.stringify({
        role: "ithead",
        username: result.user?.username || username,
        loginTime: new Date().toISOString(),
      }));
      
      toast({
        title: "Login Successful",
        description: "Welcome to the IT Head Portal",
      });
      
      navigate("/ithead/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card-corporate p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Server className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">IT Head Login</h1>
              <p className="text-muted-foreground mt-2">
                Access infrastructure and IT management tools
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Email Address</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="Enter your email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link
                to="/help"
                className="text-sm text-primary hover:underline block"
              >
                Need help signing in?
              </Link>
              <button
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ITHeadLogin;
