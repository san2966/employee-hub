import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const IDLE_MS = 15 * 60 * 1000; // 15 minutes

const SESSION_KEYS = [
  "employee_session",
  "employeeSession",
  "directorSession",
  "hrSession",
  "accountsSession",
  "accountsProfile",
  "adminSession",
  "itHeadSession",
  "tenderSession",
  "purchaseSession",
  "operationsSession",
  "businessSession",
  "authUser",
  "userRole",
  "userName",
];

const hasSession = () => SESSION_KEYS.some((k) => sessionStorage.getItem(k));

/** Logs the user out of any portal after 15 minutes without activity. */
const IdleLogout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const timer = useRef<number>();

  useEffect(() => {
    const logout = async () => {
      if (!hasSession()) return;
      SESSION_KEYS.forEach((k) => sessionStorage.removeItem(k));
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      toast({
        title: "Signed out",
        description: "You were logged out after 15 minutes of inactivity.",
      });
      navigate("/", { replace: true });
    };

    const reset = () => {
      window.clearTimeout(timer.current);
      if (!hasSession()) return;
      timer.current = window.setTimeout(() => void logout(), IDLE_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click", "visibilitychange"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      window.clearTimeout(timer.current);
    };
  }, [navigate, toast, location.pathname]);

  return null;
};

export default IdleLogout;
