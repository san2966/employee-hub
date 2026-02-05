-- Fix the requirements INSERT policy to properly validate ownership
DROP POLICY IF EXISTS requirements_insert ON public.requirements;

CREATE POLICY requirements_insert ON public.requirements
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = get_employee_id(auth.uid())
  OR has_role(auth.uid(), 'director')
  OR has_role(auth.uid(), 'admin')
);