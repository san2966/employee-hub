
-- Fix tickets SELECT policy to restrict to ithead/admin/director
DROP POLICY IF EXISTS "tickets_select" ON public.tickets;
CREATE POLICY "tickets_select" ON public.tickets
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'ithead') OR 
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'director')
);

-- Fix contacts SELECT policy to restrict to relevant roles
DROP POLICY IF EXISTS "contacts_select" ON public.contacts;
CREATE POLICY "contacts_select" ON public.contacts
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'director') OR 
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'hr') OR 
  has_role(auth.uid(), 'purchase') OR
  has_role(auth.uid(), 'operations') OR
  has_role(auth.uid(), 'tender_head') OR
  has_role(auth.uid(), 'tender_executive') OR
  has_role(auth.uid(), 'ithead') OR
  has_role(auth.uid(), 'accounts') OR
  (get_employee_id(auth.uid()) IS NOT NULL)
);

-- Add DELETE policy for tender-payments storage
CREATE POLICY "Accounts can delete tender payment proofs" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'tender-payments' AND has_role(auth.uid(), 'accounts')
);

-- Add UPDATE policy for tender-payments storage
CREATE POLICY "Accounts can update tender payment proofs" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'tender-payments' AND has_role(auth.uid(), 'accounts')
);
