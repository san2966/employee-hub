import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TenderPayment {
  id: string;
  type: string;
  tender_number: string;
  organization_name: string;
  amount: number;
  company_name: string | null;
  emd_type: string | null;
  return_date: string | null;
  remark: string | null;
  reason_for_payment: string | null;
  bank_name: string | null;
  payment_date: string | null;
  proof_url: string | null;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export const PAYMENT_TYPES = ["EMD", "Demand Draft", "Bank Guarantee", "Govt Portal", "Other"] as const;
export const EMD_TYPES = ["L1", "L2", "L3", "L4", "Other"] as const;
export const COMPANY_NAMES = ["VMCC", "Spenca", "Pancharatna", "Other"] as const;

export function useTenderPayments() {
  const [payments, setPayments] = useState<TenderPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tender_payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPayments(data as TenderPayment[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("tender-payments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tender_payments" }, () => {
        fetchPayments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPayments]);

  const addPayment = async (record: Partial<TenderPayment>) => {
    const { error } = await supabase.from("tender_payments").insert(record as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Success", description: "Payment record added" });
    return true;
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase.from("tender_payments").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Deleted", description: "Record removed" });
    return true;
  };

  const payPayment = async (id: string, bankName: string, paymentDate: string, proofUrl: string) => {
    const { error } = await supabase.from("tender_payments").update({
      bank_name: bankName,
      payment_date: paymentDate,
      proof_url: proofUrl,
      paid: true,
      paid_at: new Date().toISOString(),
    } as any).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Payment Recorded", description: "Proof uploaded successfully" });
    return true;
  };

  const uploadProof = async (file: File): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File must be less than 5MB", variant: "destructive" });
      return null;
    }
    if (file.type !== "application/pdf") {
      toast({ title: "Error", description: "Only PDF files are allowed", variant: "destructive" });
      return null;
    }
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("tender-payments").upload(fileName, file);
    if (error) {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
      return null;
    }
    return fileName;
  };

  const getProofUrl = async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage.from("tender-payments").createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  };

  return { payments, loading, addPayment, deletePayment, payPayment, uploadProof, getProofUrl };
}
