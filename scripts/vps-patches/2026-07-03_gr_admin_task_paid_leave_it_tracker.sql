-- 2026-07-03: Director GR access, admin_task table, paid leave default 6,
-- IT asset photo column, IT asset assignments (Asset Tracker), it-files bucket.

BEGIN;

-- 1. Operations GR: allow Director access alongside Operations
DROP POLICY IF EXISTS "ops_gr_all" ON public.operations_gr;
DROP POLICY IF EXISTS "ops_gr_director" ON public.operations_gr;
DROP POLICY IF EXISTS "ops_gr_ops_dir" ON public.operations_gr;
CREATE POLICY "ops_gr_ops_dir" ON public.operations_gr FOR ALL
  USING (public.has_role(auth.uid(), 'operations') OR public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'operations') OR public.has_role(auth.uid(), 'director'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operations_gr TO authenticated;
GRANT ALL ON public.operations_gr TO service_role;
DO $$ BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.operations_gr';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 2. admin_task table (Admin Login → Tasks page)
CREATE TABLE IF NOT EXISTS public.admin_task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  employee_name TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_task TO authenticated;
GRANT SELECT ON public.admin_task TO anon;
GRANT ALL ON public.admin_task TO service_role;
ALTER TABLE public.admin_task ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_task all" ON public.admin_task;
CREATE POLICY "admin_task all" ON public.admin_task FOR ALL USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS update_admin_task_updated_at ON public.admin_task;
CREATE TRIGGER update_admin_task_updated_at BEFORE UPDATE ON public.admin_task
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_task';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 3. Paid leave default 12 -> 6 (cap existing balances at 6)
ALTER TABLE public.employees ALTER COLUMN paid_leave_balance SET DEFAULT 6;
UPDATE public.employees SET paid_leave_balance = LEAST(COALESCE(paid_leave_balance, 6), 6);

CREATE OR REPLACE FUNCTION public.sync_employee_leave_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN
    IF OLD.leave_type::text = 'paid' THEN
      UPDATE public.employees SET paid_leave_balance = COALESCE(paid_leave_balance, 6) + 1 WHERE id = OLD.employee_id;
    ELSIF OLD.leave_type::text = 'medical' THEN
      UPDATE public.employees SET medical_leave_balance = COALESCE(medical_leave_balance, 6) + 1 WHERE id = OLD.employee_id;
    ELSIF OLD.leave_type::text = 'exchange' AND COALESCE(OLD.is_add_leave, false) THEN
      UPDATE public.employees SET exchange_leave_balance = GREATEST(0, COALESCE(exchange_leave_balance, 0) - 1) WHERE id = OLD.employee_id;
    ELSIF OLD.leave_type::text = 'exchange' THEN
      UPDATE public.employees SET exchange_leave_balance = COALESCE(exchange_leave_balance, 0) + 1 WHERE id = OLD.employee_id;
    END IF;
  END IF;
  IF NEW.status = 'approved' THEN
    IF NEW.leave_type::text = 'paid' THEN
      UPDATE public.employees SET paid_leave_balance = GREATEST(0, COALESCE(paid_leave_balance, 6) - 1) WHERE id = NEW.employee_id;
    ELSIF NEW.leave_type::text = 'medical' THEN
      UPDATE public.employees SET medical_leave_balance = GREATEST(0, COALESCE(medical_leave_balance, 6) - 1) WHERE id = NEW.employee_id;
    ELSIF NEW.leave_type::text = 'exchange' AND COALESCE(NEW.is_add_leave, false) THEN
      UPDATE public.employees SET exchange_leave_balance = COALESCE(exchange_leave_balance, 0) + 1 WHERE id = NEW.employee_id;
    ELSIF NEW.leave_type::text = 'exchange' THEN
      UPDATE public.employees SET exchange_leave_balance = GREATEST(0, COALESCE(exchange_leave_balance, 0) - 1) WHERE id = NEW.employee_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. IT Assets: photo column
ALTER TABLE public.it_assets ADD COLUMN IF NOT EXISTS photo TEXT;

-- 5. IT Asset Assignments (Tracker)
CREATE TABLE IF NOT EXISTS public.it_asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.it_assets(id) ON DELETE CASCADE,
  assigned_to TEXT NOT NULL,
  record_url TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.it_asset_assignments TO authenticated;
GRANT ALL ON public.it_asset_assignments TO service_role;
ALTER TABLE public.it_asset_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "it_asset_assignments_all" ON public.it_asset_assignments;
CREATE POLICY "it_asset_assignments_all" ON public.it_asset_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'ithead') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'ithead') OR public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS update_it_asset_assignments_updated_at ON public.it_asset_assignments;
CREATE TRIGGER update_it_asset_assignments_updated_at BEFORE UPDATE ON public.it_asset_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.it_asset_assignments';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 6. Storage bucket for IT files (asset photos, assignment records)
INSERT INTO storage.buckets (id, name, public) VALUES ('it-files', 'it-files', false)
  ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "it-files read" ON storage.objects;
DROP POLICY IF EXISTS "it-files write" ON storage.objects;
CREATE POLICY "it-files read" ON storage.objects FOR SELECT USING (bucket_id = 'it-files');
CREATE POLICY "it-files write" ON storage.objects FOR ALL USING (bucket_id = 'it-files') WITH CHECK (bucket_id = 'it-files');

COMMIT;