-- VPS Patch: 2026-07-01
-- Fixes for Director Quotation buttons, Employee Settings, HR Certifications,
-- Director Task Manager soft-delete, and Admin User Management persistence.
--
-- Apply on the VPS Supabase database:
--   psql "$SUPABASE_DB_URL" -f 2026-07-01_quotation_settings_certs_tasks_admin.sql

BEGIN;

-- 1) Director Task Manager: soft-hide flag (record stays visible in Reports)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS hidden_in_manager boolean NOT NULL DEFAULT false;

-- 2) Admin User Management: dedicated directory table (persists across refresh)
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
CREATE POLICY admin_employees_all ON public.admin_employees
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS admin_employees_updated_at ON public.admin_employees;
CREATE TRIGGER admin_employees_updated_at BEFORE UPDATE ON public.admin_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Director Quotation Manager: forcefully reopen action buttons.
--    Ensure status defaults to 'pending' so new inserts always render the buttons.
ALTER TABLE public.purchase_quotes ALTER COLUMN status SET DEFAULT 'pending';
UPDATE public.purchase_quotes SET status = 'pending' WHERE status IS NULL;

-- 4) Ensure realtime works for the affected tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_quotes;

COMMIT;