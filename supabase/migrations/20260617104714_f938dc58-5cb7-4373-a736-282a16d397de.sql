
-- Fix CHECK constraint to allow both naming variants
ALTER TABLE public.employee_payments DROP CONSTRAINT IF EXISTS employee_payments_category_check;
ALTER TABLE public.employee_payments ADD CONSTRAINT employee_payments_category_check
  CHECK (category IN ('travel','traveling','misc','miscellaneous'));

-- Loosen INSERT policy on employee_payments
DROP POLICY IF EXISTS employee_payments_insert ON public.employee_payments;
CREATE POLICY employee_payments_insert ON public.employee_payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Loosen INSERT policy on requirements
DROP POLICY IF EXISTS requirements_insert ON public.requirements;
CREATE POLICY requirements_insert ON public.requirements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
