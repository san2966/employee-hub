-- Allow Director to view & approve/reject purchase quotes
DROP POLICY IF EXISTS purchase_quotes_all ON public.purchase_quotes;

CREATE POLICY purchase_quotes_select ON public.purchase_quotes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'purchase')
    OR public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY purchase_quotes_insert ON public.purchase_quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'purchase')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY purchase_quotes_update ON public.purchase_quotes
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'purchase')
    OR public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'purchase')
    OR public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY purchase_quotes_delete ON public.purchase_quotes
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'purchase')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Ensure default status for new quotes
ALTER TABLE public.purchase_quotes ALTER COLUMN status SET DEFAULT 'Pending';
UPDATE public.purchase_quotes SET status = 'Pending' WHERE status IS NULL;