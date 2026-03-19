import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Page-to-table mappings per portal
const PORTAL_PAGE_TABLES: Record<string, Record<string, string[]>> = {
  director: {
    "/director/tasks": ["tasks"],
    "/director/department-tasks": ["director_tasks"],
    "/director/reports": ["daily_reports"],
    "/director/notices": ["notices"],
    "/director/leaves": ["leave_requests"],
    "/director/attendance": ["attendance"],
    "/director/requirements": ["requirements"],
    "/director/products": ["products"],
    "/director/contacts": ["contacts"],
    "/director/tender-monitor": ["tenders"],
    "/director/quotations": ["purchase_quotes"],
    "/director/records": ["operations_proposals", "operations_inwards"],
  },
  hr: {
    "/hr/employee-add": ["employees"],
    "/hr/manage-employee": ["employees"],
    "/hr/leaves": ["leave_requests"],
    "/hr/attendance": ["attendance", "approval_requests"],
    "/hr/director-tasks": ["director_tasks"],
  },
  accounts: {
    "/accounts/vouchers": ["admin_payments", "employee_payments"],
    "/accounts/director-tasks": ["director_tasks"],
  },
  employee: {
    "/employee/tasks": ["tasks"],
    "/employee/contacts": ["contacts"],
    "/employee/requirements": ["requirements"],
    "/employee/payments": ["employee_payments"],
    "/employee/notices": ["notices"],
    "/employee/leaves": ["leave_requests"],
    "/employee/reports": ["daily_reports"],
  },
  admin: {
    "/admin/attendance": ["attendance"],
    "/admin/payments": ["admin_payments"],
    "/admin/tasks": ["tasks", "director_tasks"],
    "/admin/visitors": ["admin_assets"],
    "/admin/users": ["portal_users"],
    "/admin/inward-outward": ["inward_outward"],
    "/admin/assets": ["admin_assets"],
    "/admin/vehicles": ["admin_assets"],
  },
  ithead: {
    "/ithead/tickets": ["purchase_support_tickets"],
    "/ithead/assets": ["it_assets"],
    "/ithead/passwords": ["it_passwords"],
    "/ithead/network": ["it_network_images"],
    "/ithead/telephone": ["telephone_directory"],
  },
  tender: {
    "/tender/tasks": ["tender_notes"],
    "/tender/companies": ["tender_companies"],
    "/tender/documents": ["tender_documents"],
    "/tender/tenders": ["tenders"],
    "/tender/products": ["tender_products"],
    "/tender/research": ["tenders"],
    "/tender/contacts": ["tender_contacts"],
  },
  purchase: {
    "/purchase/tasks": ["purchase_tasks"],
    "/purchase/quotations": ["purchase_quotes"],
    "/purchase/products": ["purchase_products"],
    "/purchase/contacts": ["purchase_contacts"],
    "/purchase/dispatch": ["purchase_dispatches"],
    "/purchase/documents": ["purchase_documents"],
    "/purchase/technical-support": ["purchase_support_tickets"],
  },
  operations: {
    "/operations/proposals": ["operations_proposals"],
    "/operations/brochures": ["operations_brochures"],
    "/operations/inwards": ["operations_inwards"],
    "/operations/presentations": ["operations_presentations"],
    "/operations/media": ["operations_media"],
    "/operations/gr": ["operations_gr"],
  },
};

function getStorageKey(portal: string) {
  return `${portal}_last_viewed`;
}

function getLastViewed(portal: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(portal)) || "{}");
  } catch {
    return {};
  }
}

function setLastViewedPath(portal: string, path: string) {
  const current = getLastViewed(portal);
  current[path] = new Date().toISOString();
  localStorage.setItem(getStorageKey(portal), JSON.stringify(current));
}

export function usePortalNotifications(portal: string) {
  const [hasNew, setHasNew] = useState<Record<string, boolean>>({});
  const pageTableMap = PORTAL_PAGE_TABLES[portal] || {};

  const checkAll = useCallback(async () => {
    const lastViewed = getLastViewed(portal);
    const results: Record<string, boolean> = {};

    const checks = Object.entries(pageTableMap).map(async ([path, tables]) => {
      const lastSeen = lastViewed[path] || "1970-01-01T00:00:00Z";
      let foundNew = false;

      for (const table of tables) {
        if (foundNew) break;
        try {
          const { data, error } = await (supabase as any)
            .from(table)
            .select("created_at")
            .gt("created_at", lastSeen)
            .limit(1);
          if (!error && data && data.length > 0) {
            foundNew = true;
          }
        } catch {
          // Table might not be accessible, skip
        }
      }
      results[path] = foundNew;
    });

    await Promise.all(checks);
    setHasNew(results);
  }, [portal]);

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 30000);
    return () => clearInterval(interval);
  }, [checkAll]);

  const markViewed = useCallback((path: string) => {
    setLastViewedPath(portal, path);
    setHasNew((prev) => ({ ...prev, [path]: false }));
  }, [portal]);

  return { hasNew, markViewed, refresh: checkAll };
}
