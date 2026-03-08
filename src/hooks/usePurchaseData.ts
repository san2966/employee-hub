import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function useCrudTable(tableName: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await (supabase as any)
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
    } else {
      setData(rows || []);
    }
    setLoading(false);
  }, [tableName]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (record: any) => {
    const { error } = await (supabase as any).from(tableName).insert(record);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Success", description: "Record added successfully" });
    await fetch();
    return true;
  }, [tableName, fetch, toast]);

  const update = useCallback(async (id: string, updates: any) => {
    const { error } = await (supabase as any).from(tableName).update(updates).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Success", description: "Record updated successfully" });
    await fetch();
    return true;
  }, [tableName, fetch, toast]);

  const remove = useCallback(async (id: string) => {
    const { error } = await (supabase as any).from(tableName).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Success", description: "Record deleted successfully" });
    await fetch();
    return true;
  }, [tableName, fetch, toast]);

  return { data, loading, fetch, add, update, remove };
}

export const usePurchaseProjects = () => useCrudTable("purchase_projects");
export const usePurchaseTasks = () => useCrudTable("purchase_tasks");
export const usePurchaseQuotes = () => useCrudTable("purchase_quotes");
export const usePurchaseProducts = () => useCrudTable("purchase_products");
export const usePurchaseVendors = () => useCrudTable("purchase_vendors");
export const usePurchaseContacts = () => useCrudTable("purchase_contacts");
export const usePurchaseDispatches = () => useCrudTable("purchase_dispatches");
export const usePurchaseDocuments = () => useCrudTable("purchase_documents");
export const usePurchaseWorkCompletions = () => useCrudTable("purchase_work_completions");
export const usePurchaseProjectImages = () => useCrudTable("purchase_project_images");
export const usePurchaseInstallations = () => useCrudTable("purchase_installations");
export const usePurchaseSupportTickets = () => useCrudTable("purchase_support_tickets");
export const usePurchaseEvents = () => useCrudTable("purchase_events");

export const useUploadFile = () => {
  const { toast } = useToast();

  const upload = useCallback(async (file: File, folder: string, maxSizeMB: number = 10) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({ title: "Error", description: `File must be less than ${maxSizeMB}MB`, variant: "destructive" });
      return null;
    }
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("purchase-files").upload(path, file);
    if (error) {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = await supabase.storage.from("purchase-files").createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  }, [toast]);

  return { upload };
};
