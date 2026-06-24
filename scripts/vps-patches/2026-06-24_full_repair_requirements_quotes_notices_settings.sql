-- ============================================================================
--  VPS REPAIR PATCH  ·  2026-06-24
--  Fixes:
--   1) Requirements (Employee ↔ Director) sync + discrete columns
--   2) Purchase Quotes (Purchase ↔ Director) accept/reject + description
--   3) Notices vs Announcements targeting
--   4) Employee Settings (employee_settings) photo persistence
--   5) Operations Proposals / Inwards file access for Director
--
--  Safe to re-run.  Run as:
--    psql -h localhost -U postgres -d postgres \
--      -f scripts/vps-patches/2026-06-24_full_repair_requirements_quotes_notices_settings.sql
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1.  REQUIREMENTS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS why_needed    text;
ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS link_url      text;
ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS expected_cost numeric;
ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS employee_name text;

-- task_status enum may not include approved/rejected on old VPS dumps.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='approved' AND enumtypid='task_status'::regtype) THEN
    ALTER TYPE task_status ADD VALUE 'approved';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='rejected' AND enumtypid='task_status'::regtype) THEN
    ALTER TYPE task_status ADD VALUE 'rejected';
  END IF;
END $$;

-- Backfill any legacy JSON-blob rows
UPDATE public.requirements
SET
  why_needed    = COALESCE(NULLIF(why_needed,''),   NULLIF((description::jsonb)->>'whyNeeded','')),
  link_url      = COALESCE(NULLIF(link_url,''),     NULLIF((description::jsonb)->>'link','')),
  expected_cost = COALESCE(expected_cost, NULLIF((description::jsonb)->>'expectedCost','')::numeric),
  description   = COALESCE(NULLIF((description::jsonb)->>'description',''), description)
WHERE description IS NOT NULL
  AND btrim(description) ~ '^\{.*\}$';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirements TO authenticated;
GRANT ALL ON public.requirements TO service_role;

ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS requirements_select ON public.requirements;
DROP POLICY IF EXISTS requirements_insert ON public.requirements;
DROP POLICY IF EXISTS requirements_update ON public.requirements;
DROP POLICY IF EXISTS requirements_delete ON public.requirements;
CREATE POLICY requirements_select ON public.requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY requirements_insert ON public.requirements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY requirements_update ON public.requirements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY requirements_delete ON public.requirements FOR DELETE TO authenticated USING (true);

-- Normalize trigger (JSON-blob → discrete columns, ensure employee link)
CREATE OR REPLACE FUNCTION public.normalize_requirement_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  payload jsonb;
  employee_label text;
BEGIN
  IF NEW.description IS NOT NULL AND btrim(NEW.description) ~ '^\{.*\}$' THEN
    BEGIN payload := NEW.description::jsonb; EXCEPTION WHEN OTHERS THEN payload := NULL; END;
    IF payload IS NOT NULL AND jsonb_typeof(payload) = 'object' THEN
      NEW.description   := COALESCE(NULLIF(payload->>'description',''), NEW.description);
      NEW.why_needed    := COALESCE(NULLIF(NEW.why_needed,''),   NULLIF(payload->>'whyNeeded',''));
      NEW.link_url      := COALESCE(NULLIF(NEW.link_url,''),     NULLIF(payload->>'link',''));
      IF NEW.expected_cost IS NULL AND NULLIF(payload->>'expectedCost','') IS NOT NULL THEN
        BEGIN NEW.expected_cost := (payload->>'expectedCost')::numeric; EXCEPTION WHEN OTHERS THEN NULL; END;
      END IF;
    END IF;
  END IF;

  IF NULLIF(NEW.employee_name,'') IS NULL AND NEW.requested_by IS NOT NULL THEN
    SELECT COALESCE(e.name, e.username, e.email) INTO employee_label
    FROM public.employees e WHERE e.id = NEW.requested_by LIMIT 1;
    NEW.employee_name := employee_label;
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS normalize_requirement_row_before_write ON public.requirements;
CREATE TRIGGER normalize_requirement_row_before_write
  BEFORE INSERT OR UPDATE ON public.requirements
  FOR EACH ROW EXECUTE FUNCTION public.normalize_requirement_row();

ALTER PUBLICATION supabase_realtime ADD TABLE public.requirements;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2.  PURCHASE QUOTES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.purchase_quotes ADD COLUMN IF NOT EXISTS description text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_quotes TO authenticated;
GRANT ALL ON public.purchase_quotes TO service_role;

ALTER TABLE public.purchase_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS purchase_quotes_select ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_insert ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_update ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_delete ON public.purchase_quotes;
CREATE POLICY purchase_quotes_select ON public.purchase_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_quotes_insert ON public.purchase_quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY purchase_quotes_update ON public.purchase_quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY purchase_quotes_delete ON public.purchase_quotes FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_quotes;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3.  NOTICES vs ANNOUNCEMENTS targeting
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS notice_type            text   NOT NULL DEFAULT 'announcement';
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS recipient_employee_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS is_global              boolean NOT NULL DEFAULT true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notices_select ON public.notices;
DROP POLICY IF EXISTS notices_insert ON public.notices;
DROP POLICY IF EXISTS notices_update ON public.notices;
DROP POLICY IF EXISTS notices_delete ON public.notices;

CREATE POLICY notices_select ON public.notices FOR SELECT TO authenticated
  USING (
    is_active IS TRUE
    AND (
      COALESCE(is_global, false) IS TRUE
      OR COALESCE(notice_type, 'announcement') = 'announcement'
      OR public.current_portal_employee_id() = ANY (COALESCE(recipient_employee_ids, '{}'::uuid[]))
      OR has_role(auth.uid(), 'director')
      OR has_role(auth.uid(), 'admin')
    )
  );
CREATE POLICY notices_insert ON public.notices FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));
CREATE POLICY notices_update ON public.notices FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));
CREATE POLICY notices_delete ON public.notices FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4.  EMPLOYEE SETTINGS (photo / profile)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_settings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  first_name   text,
  last_name    text,
  mobile       text,
  designation  text,
  photo        text,
  preferences  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_settings ADD COLUMN IF NOT EXISTS photo text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_settings TO authenticated;
GRANT ALL ON public.employee_settings TO service_role;

ALTER TABLE public.employee_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees manage their own settings" ON public.employee_settings;
CREATE POLICY "Employees manage their own settings" ON public.employee_settings
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_employee_settings_updated_at ON public.employee_settings;
CREATE TRIGGER trg_employee_settings_updated_at
  BEFORE UPDATE ON public.employee_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5.  OPERATIONS PROPOSALS / INWARDS  (allow Director read/update)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operations_proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operations_inwards   TO authenticated;
GRANT ALL ON public.operations_proposals TO service_role;
GRANT ALL ON public.operations_inwards   TO service_role;

ALTER PUBLICATION supabase_realtime ADD TABLE public.operations_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operations_inwards;

COMMIT;

-- ============================================================================
--  POST-PATCH VERIFICATION  (run individually)
-- ============================================================================
-- \d public.requirements
-- \d public.notices
-- \d public.purchase_quotes
-- \d public.employee_settings
-- SELECT id, title, status, why_needed, link_url, expected_cost FROM public.requirements ORDER BY created_at DESC LIMIT 5;
-- SELECT id, title, notice_type, is_global, recipient_employee_ids FROM public.notices  ORDER BY created_at DESC LIMIT 5;