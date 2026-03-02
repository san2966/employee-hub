import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthUser {
  id: string;
  username: string;
  role: string;
  employee_id: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
  const { toast } = useToast();

  const login = useCallback(async (username: string, password: string, expectedRole?: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke("authenticate", {
        body: { username, password, expectedRole },
      });

      if (error) {
        throw new Error(error.message || "Authentication failed");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.success || !data.session) {
        throw new Error("Authentication failed - no session returned");
      }

      // Set the session in Supabase client
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        throw new Error("Failed to establish session");
      }

      const user: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
        employee_id: data.user.employee_id,
      };

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Store user info in sessionStorage for quick access
      sessionStorage.setItem("authUser", JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });

      return { success: false, error: message };
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    sessionStorage.removeItem("authUser");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("adminSession");
    sessionStorage.removeItem("hrSession");
    sessionStorage.removeItem("accountsUser");
    sessionStorage.removeItem("directorSession");
    sessionStorage.removeItem("employeeSession");
    sessionStorage.removeItem("itHeadSession");
    sessionStorage.removeItem("tenderSession");
  }, []);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const storedUser = sessionStorage.getItem("authUser");
      if (storedUser) {
        const user = JSON.parse(storedUser) as AuthUser;
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
    }

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    return false;
  }, []);

  const getUser = useCallback(() => {
    const storedUser = sessionStorage.getItem("authUser");
    if (storedUser) {
      return JSON.parse(storedUser) as AuthUser;
    }
    return authState.user;
  }, [authState.user]);

  const hasRole = useCallback((role: string | string[]) => {
    const user = getUser();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [getUser]);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
    getUser,
    hasRole,
  };
};
