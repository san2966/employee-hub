
-- 1) Soft-hide flag for tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS hidden_in_manager boolean NOT NULL DEFAULT false;

-- 2) Admin-only employee directory (separate from HR employees table)
CREATE TABLE IF NOT EXISTS public.admin_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  designation text NOT NULL,
  phone text NOT NULL,
  alternate_phone text,
  address text NOT NULL,
  photo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_employees TO authenticated;
GRANT ALL ON public.admin_employees TO service_role;

ALTER TABLE public.admin_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_employees_all ON public.admin_employees;
CREATE POLICY admin_employees_all ON public.admin_employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS admin_employees_updated_at ON public.admin_employees;
CREATE TRIGGER admin_employees_updated_at BEFORE UPDATE ON public.admin_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
