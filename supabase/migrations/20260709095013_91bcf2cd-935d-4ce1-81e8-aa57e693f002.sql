
-- Add is_personal flag to tasks so employees can create their own daily tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_tasks_is_personal ON public.tasks(is_personal);

-- Allow employees to insert personal tasks for themselves
DROP POLICY IF EXISTS tasks_insert ON public.tasks;
CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'admin')
    OR (is_personal = true AND assigned_to = public.get_employee_id(auth.uid()))
  );

-- Allow employees to delete their own personal tasks
DROP POLICY IF EXISTS tasks_delete ON public.tasks;
CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'admin')
    OR (is_personal = true AND assigned_to = public.get_employee_id(auth.uid()))
  );
