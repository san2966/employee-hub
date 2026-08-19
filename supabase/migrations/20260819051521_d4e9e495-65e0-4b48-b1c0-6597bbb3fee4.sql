DROP POLICY IF EXISTS employee_payments_update ON public.employee_payments;
DROP POLICY IF EXISTS employee_payments_delete ON public.employee_payments;

CREATE POLICY employee_payments_update ON public.employee_payments
FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY employee_payments_delete ON public.employee_payments
FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);