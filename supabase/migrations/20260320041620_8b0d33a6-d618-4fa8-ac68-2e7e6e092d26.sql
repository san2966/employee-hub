
-- Create tender_payments table
CREATE TABLE public.tender_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  tender_number TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  company_name TEXT,
  emd_type TEXT,
  return_date DATE,
  remark TEXT,
  reason_for_payment TEXT,
  bank_name TEXT,
  payment_date DATE,
  proof_url TEXT,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tender_payments ENABLE ROW LEVEL SECURITY;

-- Accounts: full CRUD
CREATE POLICY "tender_payments_accounts_select" ON public.tender_payments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'accounts'));

CREATE POLICY "tender_payments_accounts_insert" ON public.tender_payments
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'accounts'));

CREATE POLICY "tender_payments_accounts_update" ON public.tender_payments
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'accounts'));

CREATE POLICY "tender_payments_accounts_delete" ON public.tender_payments
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'accounts'));

-- Tender head/exec: SELECT + INSERT only
CREATE POLICY "tender_payments_tender_select" ON public.tender_payments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'tender') OR has_role(auth.uid(), 'tender_exec'));

CREATE POLICY "tender_payments_tender_insert" ON public.tender_payments
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'tender') OR has_role(auth.uid(), 'tender_exec'));

-- Director: read-only
CREATE POLICY "tender_payments_director_select" ON public.tender_payments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'director'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_payments;

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('tender-payments', 'tender-payments', false);

-- Storage RLS: accounts can upload
CREATE POLICY "tender_payments_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tender-payments' AND has_role(auth.uid(), 'accounts'));

-- All relevant roles can read
CREATE POLICY "tender_payments_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'tender-payments' AND (has_role(auth.uid(), 'accounts') OR has_role(auth.uid(), 'tender') OR has_role(auth.uid(), 'tender_exec') OR has_role(auth.uid(), 'director')));
