-- 2026-07-09: Split employee tasks into Director Tasks (assigned) and Daily Tasks (personal).
-- - Adds is_personal flag to public.tasks
-- - Allows employees to insert / delete their own personal tasks
-- Safe to run repeatedly.

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_tasks_is_personal ON public.tasks(is_personal);

DROP POLICY IF EXISTS tasks_insert ON public.tasks;
CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'admin')
    OR (is_personal = true AND assigned_to = public.get_employee_id(auth.uid()))
  );

DROP POLICY IF EXISTS tasks_delete ON public.tasks;
CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'admin')
    OR (is_personal = true AND assigned_to = public.get_employee_id(auth.uid()))
  );