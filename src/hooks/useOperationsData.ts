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
    if (error) console.error(`Error fetching ${tableName}:`, error);
    else setData(rows || []);
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

export function useOperationsData() {
  const proposals = useCrudTable("operations_proposals");
  const brochures = useCrudTable("operations_brochures");
  const inwards = useCrudTable("operations_inwards");
  const presentations = useCrudTable("operations_presentations");
  const media = useCrudTable("operations_media");
  const gr = useCrudTable("operations_gr");
  const reminders = useCrudTable("operations_reminders");
  const notes = useCrudTable("operations_notes");
  const events = useCrudTable("operations_events");

  const uploadFile = useCallback(async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("operations-files").upload(path, file);
    if (error) throw error;
    const { data } = await supabase.storage.from("operations-files").createSignedUrl(path, 315360000);
    return data?.signedUrl || "";
  }, []);

  const getSignedUrl = useCallback(async (path: string) => {
    if (!path || path.startsWith("http")) {
      // If it's already a signed URL or empty, try to extract path
      if (path && path.includes("operations-files")) {
        const match = path.match(/operations-files\/(.+?)(\?|$)/);
        if (match) {
          const { data } = await supabase.storage.from("operations-files").createSignedUrl(match[1], 315360000);
          return data?.signedUrl || path;
        }
      }
      return path;
    }
    const { data } = await supabase.storage.from("operations-files").createSignedUrl(path, 315360000);
    return data?.signedUrl || "";
  }, []);

  const generateProposalId = useCallback(() => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    return `${dateStr}${seq}`;
  }, []);

  return {
    proposals, brochures, inwards, presentations, media, gr,
    reminders, notes, events, uploadFile, getSignedUrl, generateProposalId,
  };
}
