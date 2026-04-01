-- Fix director_tasks RLS for tender roles
DROP POLICY IF EXISTS "director_tasks_select" ON public.director_tasks;
CREATE POLICY "director_tasks_select" ON public.director_tasks
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'director') OR
  (has_role(auth.uid(), 'admin') AND department = 'Admin') OR
  (has_role(auth.uid(), 'hr') AND department = 'HR') OR
  ((has_role(auth.uid(), 'tender_head') OR has_role(auth.uid(), 'tender_executive')) AND department = 'Tender') OR
  (has_role(auth.uid(), 'operations') AND department = 'Operations') OR
  (has_role(auth.uid(), 'purchase') AND department = 'Purchase') OR
  (has_role(auth.uid(), 'ithead') AND department = 'IT') OR
  (has_role(auth.uid(), 'accounts') AND department = 'Accounts')
);

DROP POLICY IF EXISTS "director_tasks_update" ON public.director_tasks;
CREATE POLICY "director_tasks_update" ON public.director_tasks
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'director') OR
  (has_role(auth.uid(), 'admin') AND department = 'Admin') OR
  (has_role(auth.uid(), 'hr') AND department = 'HR') OR
  ((has_role(auth.uid(), 'tender_head') OR has_role(auth.uid(), 'tender_executive')) AND department = 'Tender') OR
  (has_role(auth.uid(), 'operations') AND department = 'Operations') OR
  (has_role(auth.uid(), 'purchase') AND department = 'Purchase') OR
  (has_role(auth.uid(), 'ithead') AND department = 'IT') OR
  (has_role(auth.uid(), 'accounts') AND department = 'Accounts')
);

-- Fix tender_payments RLS for correct tender roles
DROP POLICY IF EXISTS "tender_payments_tender_insert" ON public.tender_payments;
CREATE POLICY "tender_payments_tender_insert" ON public.tender_payments
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'tender_head') OR has_role(auth.uid(), 'tender_executive'));

DROP POLICY IF EXISTS "tender_payments_tender_select" ON public.tender_payments;
CREATE POLICY "tender_payments_tender_select" ON public.tender_payments
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'tender_head') OR has_role(auth.uid(), 'tender_executive'));