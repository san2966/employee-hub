import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Maps director sidebar paths to the tables they display
const PAGE_TABLE_MAP: Record<string, string[]> = {
  "/director/tasks": ["tasks"],
  "/director/reports": ["daily_reports"],
  "/director/notices": ["notices"],
  "/director/leaves": ["leave_requests"],
  "/director/requirements": ["requirements"],
  "/director/products": ["products"],
  "/director/contacts": ["contacts"],
  "/director/tender-monitor": ["tenders"],
  "/director/quotations": ["purchase_quotes"],
  "/director/records": ["operations_proposals", "operations_inwards"],
};

const STORAGE_KEY = "director_last_viewed";

function getLastViewed(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setLastViewed(path: string) {
  const current = getLastViewed();
  current[path] = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function useDirectorNotifications() {
  const [hasNew, setHasNew] = useState<Record<string, boolean>>({});

  const checkAll = useCallback(async () => {
    const lastViewed = getLastViewed();
    const results: Record<string, boolean> = {};

    const checks = Object.entries(PAGE_TABLE_MAP).map(async ([path, tables]) => {
      const lastSeen = lastViewed[path] || "1970-01-01T00:00:00Z";
      let foundNew = false;

      for (const table of tables) {
        if (foundNew) break;
        const { data, error } = await (supabase as any)
          .from(table)
          .select("created_at")
          .gt("created_at", lastSeen)
          .limit(1);

        if (!error && data && data.length > 0) {
          foundNew = true;
        }
      }
      results[path] = foundNew;
    });

    await Promise.all(checks);
    setHasNew(results);
  }, []);

  useEffect(() => {
    checkAll();
    // Re-check every 30 seconds
    const interval = setInterval(checkAll, 30000);
    return () => clearInterval(interval);
  }, [checkAll]);

  const markViewed = useCallback((path: string) => {
    setLastViewed(path);
    setHasNew((prev) => ({ ...prev, [path]: false }));
  }, []);

  return { hasNew, markViewed, refresh: checkAll };
}
