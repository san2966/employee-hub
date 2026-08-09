import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BusinessDesignation =
  | "business_head"
  | "director"
  | "area_sales_manager"
  | "business_development_manager"
  | "rc_technical";

export interface BusinessProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: BusinessDesignation;
  area_id: string | null;
  is_active: boolean;
  must_change_password: boolean;
  last_login: string | null;
}

export const designationLabels: Record<BusinessDesignation, string> = {
  business_head: "Business Head",
  director: "Director",
  area_sales_manager: "Area Sales Manager",
  business_development_manager: "Business Development Manager",
  rc_technical: "RC Technical",
};

export const useBusinessAuth = () => {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return null;
    }
    const { data } = await (supabase as any)
      .from("business_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    setProfile((data as BusinessProfile) ?? null);
    setLoading(false);
    return (data as BusinessProfile) ?? null;
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => { void load(); }, 0);
    });
    void load();
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const isHead = profile?.designation === "business_head";
  const isDirector = profile?.designation === "director";
  const readOnly = isDirector;

  return { profile, loading, reload: load, isHead, isDirector, readOnly };
};