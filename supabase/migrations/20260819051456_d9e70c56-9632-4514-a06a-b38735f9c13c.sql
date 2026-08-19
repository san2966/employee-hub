CREATE POLICY "btasks_member_insert" ON public.business_tasks
FOR INSERT TO authenticated
WITH CHECK (
  public.is_business_member(auth.uid())
  AND public.business_designation_of(auth.uid()) <> 'director'::business_designation
);

CREATE POLICY "btasks_creator_delete" ON public.business_tasks
FOR DELETE TO authenticated
USING (created_by = auth.uid());