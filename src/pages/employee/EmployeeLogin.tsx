import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, ArrowLeft, Briefcase } from "lucide-react";

const EmployeeLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Get employees from HR data
    const hrEmployees = JSON.parse(localStorage.getItem("hr_employees") || "[]");
    
    // Find matching employee
    const employee = hrEmployees.find(
      (emp: { username: string; password: string }) => 
        emp.username === username && emp.password === password
    );

    setTimeout(() => {
      setIsLoading(false);
      
      if (employee) {
        // Create session
        const session = {
          employeeId: employee.id,
          employeeName: employee.name,
          username: employee.username,
          firstName: employee.name?.split(" ")[0] || "",
          lastName: employee.name?.split(" ").slice(1).join(" ") || "",
          photo: employee.photo,
          designation: employee.designation,
        };
        sessionStorage.setItem("employee_session", JSON.stringify(session));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${employee.name}!`,
        });
        navigate("/employee/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid username or password. Please contact HR if you need access.",
        });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-sm relative">
        <CardHeader className="text-center space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <Briefcase className="h-8 w-8 text-primary-foreground" />
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold">Employee Portal</CardTitle>
            <CardDescription className="mt-2">
              Sign in with credentials provided by HR
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="email"
                  placeholder="your.email@vmcc-india.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Note:</strong> Your login credentials are created by HR during your onboarding process. 
              Contact HR if you need assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeLogin;
