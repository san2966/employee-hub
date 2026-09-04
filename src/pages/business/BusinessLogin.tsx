import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { recordLoginAttempt } from "@/lib/deviceHistory";

const BusinessLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensures the default Business Head account exists (idempotent, no-op afterwards)
    supabase.functions.invoke("business-admin", { body: { action: "seed_head" } }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: "Missing details", description: "Enter your email and password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw new Error("Invalid email or password");

      let { data: profile, error: profileError } = await (supabase as any)
        .from("business_profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();

      // Repair a stale Business Head profile mapping left by older VPS seeds,
      // then retry the profile lookup once with the authenticated session.
      if (!profile && email.trim().toLowerCase() === "business-head@vmcc-india.com") {
        const { error: seedError } = await supabase.functions.invoke("business-admin", {
          body: { action: "seed_head" },
        });
        if (!seedError) {
          const retry = await (supabase as any)
            .from("business_profiles")
            .select("*")
            .eq("user_id", data.user.id)
            .maybeSingle();
          profile = retry.data;
          profileError = retry.error;
        }
      }

      if (profileError) {
        throw new Error(`Business profile could not be loaded: ${profileError.message}`);
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("This account does not have Business portal access.");
      }
      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("This account has been deactivated.");
      }

      await (supabase as any)
        .from("business_profiles")
        .update({ last_login: new Date().toISOString() })
        .eq("id", profile.id);

      void recordLoginAttempt(`business:${email.trim().toLowerCase()}`, "successful", profile.name);
      toast({ title: "Welcome back", description: profile.name });
      navigate(profile.must_change_password ? "/business/set-password" : "/business/dashboard");
    } catch (err) {
      void recordLoginAttempt(`business:${email.trim().toLowerCase()}`, "failed", email.trim());
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Portal</span>
        </Link>

        <div className="bg-card rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="gradient-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Business Login</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Sign in with your official email address
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@vmcc-india.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 gradient-primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            First time here? Use the temporary password shared with you — you will be asked to set a new one.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogin;