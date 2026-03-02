import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ===== Types =====
export interface TenderCompany {
  id: string; name: string; director_name: string; address: string; gst_number: string; logo_url: string | null; created_at: string;
}
export interface TenderProduct {
  id: string; name: string; model: string; manufacturer: string; image_url: string | null; specification: string | null; atc_url: string | null; created_at: string;
}
export interface TenderDocument {
  id: string; bid_number: string; bid_date: string; organization: string; product: string; description: string; pdf_url: string | null; created_at: string;
}
export interface Tender {
  id: string; document_id: string | null; status: string; technical_opening_date: string | null; financial_opening_date: string | null;
  emd: boolean; bg: boolean; dd: boolean; epbg: boolean; gras: boolean;
  emd_doc_url: string | null; bg_doc_url: string | null; dd_doc_url: string | null; epbg_doc_url: string | null; gras_doc_url: string | null;
  work_order_url: string | null; created_at: string; updated_at: string;
  document?: TenderDocument;
}
export interface TenderCompanyLink {
  id: string; tender_id: string; company_id: string; technical_status: string; financial_status: string; created_at: string;
  company?: TenderCompany;
}
export interface TenderTask {
  id: string; assigned_by: string; assigned_to: string; task_title: string; description: string; status: string; report: string | null; created_at: string; updated_at: string;
}
export interface TenderResearch {
  id: string; user_name: string; tender_id_ref: string; tender_number: string; organization: string; subject: string; description: string;
  amount: number | null; open_date: string | null; close_date: string | null; created_at: string;
}
export interface TenderContact {
  id: string; name: string; phone: string; designation: string | null; department: string | null; organization: string | null; email: string | null; created_at: string;
}
export interface TenderReminder {
  id: string; description: string; reminder_date: string; user_id: string; created_at: string;
}
export interface TenderNote {
  id: string; content: string; user_id: string; created_at: string;
}
export interface TenderSettings {
  id: string; user_id: string; first_name: string | null; last_name: string | null; mobile: string | null; designation: string | null; profile_photo_url: string | null;
}

// ===== File Upload =====
export const uploadTenderFile = async (file: File, folder: string): Promise<string | null> => {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("tender-files").upload(fileName, file);
  if (error) { console.error("Upload error:", error); return null; }
  const { data } = supabase.storage.from("tender-files").getPublicUrl(fileName);
  return data.publicUrl;
};

// ===== Generic CRUD Hook =====
function useCrud<T extends { id: string }>(table: string, orderBy = "created_at") {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await (supabase as any).from(table).select("*").order(orderBy, { ascending: false });
    if (error) { console.error(`Error fetching ${table}:`, error); toast({ title: "Error", description: `Failed to load ${table}`, variant: "destructive" }); }
    else setData(rows || []);
    setLoading(false);
  }, [table, orderBy, toast]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (item: Partial<T>) => {
    const { error } = await (supabase as any).from(table).insert(item);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetch(); return true;
  };

  const update = async (id: string, updates: Partial<T>) => {
    const { error } = await (supabase as any).from(table).update(updates).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetch(); return true;
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from(table).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetch(); return true;
  };

  return { data, loading, fetch, add, update, remove };
}

// ===== Exported Hooks =====
export const useTenderCompanies = () => useCrud<TenderCompany>("tender_companies");
export const useTenderProducts = () => useCrud<TenderProduct>("tender_products");
export const useTenderDocuments = () => useCrud<TenderDocument>("tender_documents");
export const useTenderTasks = () => useCrud<TenderTask>("tender_tasks");
export const useTenderResearch = () => useCrud<TenderResearch>("tender_research");
export const useTenderContacts = () => useCrud<TenderContact>("tender_contacts");
export const useTenderReminders = () => useCrud<TenderReminder>("tender_reminders");
export const useTenderNotes = () => useCrud<TenderNote>("tender_notes");

// ===== Tender Manager (complex) =====
export const useTenders = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await (supabase as any).from("tenders").select("*").order("created_at", { ascending: false });
    if (error) { console.error("Error fetching tenders:", error); }
    // Enrich with document data
    if (rows && rows.length > 0) {
      const docIds = rows.map((t: any) => t.document_id).filter(Boolean);
      if (docIds.length > 0) {
        const { data: docs } = await (supabase as any).from("tender_documents").select("*").in("id", docIds);
        const docMap = new Map((docs || []).map((d: any) => [d.id, d]));
        rows.forEach((t: any) => { t.document = docMap.get(t.document_id) || null; });
      }
    }
    setTenders(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (documentId: string) => {
    const { error } = await (supabase as any).from("tenders").insert({ document_id: documentId, status: "draft" });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetch(); return true;
  };

  const updateTender = async (id: string, updates: Partial<Tender>) => {
    const { error } = await (supabase as any).from("tenders").update(updates).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetch(); return true;
  };

  return { tenders, loading, fetch, create, updateTender };
};

// ===== Tender Company Links =====
export const useTenderCompanyLinks = (tenderId?: string) => {
  const [links, setLinks] = useState<TenderCompanyLink[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    if (!tenderId) return;
    setLoading(true);
    const { data: rows, error } = await (supabase as any).from("tender_company_links").select("*").eq("tender_id", tenderId);
    if (!error && rows) {
      const companyIds = rows.map((l: any) => l.company_id);
      if (companyIds.length > 0) {
        const { data: companies } = await (supabase as any).from("tender_companies").select("*").in("id", companyIds);
        const compMap = new Map((companies || []).map((c: any) => [c.id, c]));
        rows.forEach((l: any) => { l.company = compMap.get(l.company_id) || null; });
      }
    }
    setLinks(rows || []);
    setLoading(false);
  }, [tenderId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addLinks = async (companyIds: string[]) => {
    if (!tenderId) return false;
    const items = companyIds.map(cid => ({ tender_id: tenderId, company_id: cid }));
    const { error } = await (supabase as any).from("tender_company_links").insert(items);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetch(); return true;
  };

  const updateLink = async (id: string, updates: Partial<TenderCompanyLink>) => {
    const { error } = await (supabase as any).from("tender_company_links").update(updates).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetch(); return true;
  };

  return { links, loading, fetch, addLinks, updateLink };
};

// ===== Settings =====
export const useTenderSettings = () => {
  const [settings, setSettings] = useState<TenderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await (supabase as any).from("tender_settings").select("*").eq("user_id", user.id).maybeSingle();
    if (!error) setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (updates: Partial<TenderSettings>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: existing } = await (supabase as any).from("tender_settings").select("id").eq("user_id", user.id).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await (supabase as any).from("tender_settings").update({ ...updates }).eq("user_id", user.id));
    } else {
      ({ error } = await (supabase as any).from("tender_settings").insert({ ...updates, user_id: user.id }));
    }
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetch(); toast({ title: "Settings saved" }); return true;
  };

  return { settings, loading, save };
};
