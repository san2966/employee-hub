-- ============================================================================
-- VPS DB Patch — 2026-06-22 Permanent Repair
-- Fixes still reported on VPS:
--  1) Employee Requirements rows not visible and structured data still being
--     saved as one JSON string in description.
--  2) Director > Quotation Manager action buttons/data access still unreliable.
--  3) Exchange Leave approved but Employee > Leave Manager > Take Leave not
--     becoming usable.
--
-- RUN ON VPS
--   1) SSH into VPS and pull/copy latest project files.
--   2) Apply this patch:
--      psql -h localhost -U postgres -d postgres \
--        -f scripts/vps-patches/2026-06-22_permanent_requirements_quotes_leave_repair.sql
--   3) Rebuild/restart frontend container, then hard-refresh browser (Ctrl+F5).
-- ============================================================================

BEGIN;

ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'rejected';

-- --------------------------------------------------------------------------
-- A) Requirements: keep proper columns forever, even if an old cached frontend
--    still sends JSON inside description.
-- --------------------------------------------------------------------------
ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS why_needed     text,
  ADD COLUMN IF NOT EXISTS link_url       text,
  ADD COLUMN IF NOT EXISTS expected_cost  numeric,
  ADD COLUMN IF NOT EXISTS employee_name  text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirements TO authenticated;
GRANT ALL ON public.requirements TO service_role;

CREATE OR REPLACE FUNCTION public.current_portal_employee_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_id uuid;
  claims jsonb;
  claim_text text;
BEGIN
  SELECT ur.employee_id INTO result_id
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.employee_id IS NOT NULL
  LIMIT 1;

  IF result_id IS NOT NULL THEN
    RETURN result_id;
  END IF;

  BEGIN
    claims := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb;
  EXCEPTION WHEN OTHERS THEN
    claims := NULL;
  END;

  claim_text := COALESCE(
    claims #>> '{user_metadata,employee_id}',
    claims ->> 'employee_id'
  );

  IF claim_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN claim_text::uuid;
  END IF;

  claim_text := claims #>> '{user_metadata,portal_user_id}';
  IF claim_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT pu.employee_id INTO result_id
    FROM public.portal_users pu
    WHERE pu.id = claim_text::uuid
    LIMIT 1;
    RETURN result_id;
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_portal_employee_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.normalize_requirement_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  employee_label text;
BEGIN
  IF NEW.description IS NOT NULL AND btrim(NEW.description) ~ '^\{.*\}$' THEN
    BEGIN
      payload := NEW.description::jsonb;
    EXCEPTION WHEN OTHERS THEN
      payload := NULL;
    END;

    IF payload IS NOT NULL AND jsonb_typeof(payload) = 'object' THEN
      NEW.description := COALESCE(NULLIF(payload->>'description', ''), NEW.description);
      NEW.why_needed := COALESCE(NULLIF(NEW.why_needed, ''), NULLIF(payload->>'whyNeeded', ''));
      NEW.link_url := COALESCE(NULLIF(NEW.link_url, ''), NULLIF(payload->>'link', ''));
      IF NEW.expected_cost IS NULL AND NULLIF(payload->>'expectedCost', '') IS NOT NULL THEN
        BEGIN
          NEW.expected_cost := (payload->>'expectedCost')::numeric;
        EXCEPTION WHEN OTHERS THEN
          NEW.expected_cost := NULL;
        END;
      END IF;
    END IF;
  END IF;

  IF NEW.requested_by IS NULL THEN
    NEW.requested_by := public.current_portal_employee_id();
  END IF;

  IF NULLIF(NEW.employee_name, '') IS NULL AND NEW.requested_by IS NOT NULL THEN
    SELECT COALESCE(e.name, e.username, e.email) INTO employee_label
    FROM public.employees e
    WHERE e.id = NEW.requested_by
    LIMIT 1;
    NEW.employee_name := employee_label;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_requirement_row_before_write ON public.requirements;
CREATE TRIGGER normalize_requirement_row_before_write
BEFORE INSERT OR UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.normalize_requirement_row();

-- Backfill existing JSON rows safely.
DO $$
DECLARE
  rec record;
  payload jsonb;
BEGIN
  FOR rec IN SELECT id, description FROM public.requirements LOOP
    payload := NULL;
    IF rec.description IS NOT NULL AND btrim(rec.description) ~ '^\{.*\}$' THEN
      BEGIN
        payload := rec.description::jsonb;
      EXCEPTION WHEN OTHERS THEN
        payload := NULL;
      END;
    END IF;

    IF payload IS NOT NULL AND jsonb_typeof(payload) = 'object' THEN
      UPDATE public.requirements r
      SET description   = COALESCE(NULLIF(payload->>'description', ''), r.description),
          why_needed    = COALESCE(NULLIF(r.why_needed, ''), NULLIF(payload->>'whyNeeded', '')),
          link_url      = COALESCE(NULLIF(r.link_url, ''), NULLIF(payload->>'link', '')),
          expected_cost = COALESCE(
            r.expected_cost,
            CASE WHEN NULLIF(payload->>'expectedCost', '') ~ '^\d+(\.\d+)?$'
              THEN (payload->>'expectedCost')::numeric
              ELSE NULL
            END
          )
      WHERE r.id = rec.id;
    END IF;
  END LOOP;
END $$;

UPDATE public.requirements r
SET requested_by = e.id
FROM public.employees e
WHERE r.requested_by IS NULL
  AND NULLIF(r.employee_name, '') IS NOT NULL
  AND lower(r.employee_name) IN (lower(e.name), lower(e.username), lower(e.email));

UPDATE public.requirements r
SET employee_name = COALESCE(e.name, e.username, e.email)
FROM public.employees e
WHERE r.requested_by = e.id
  AND NULLIF(r.employee_name, '') IS NULL;

DROP POLICY IF EXISTS requirements_select ON public.requirements;
DROP POLICY IF EXISTS requirements_insert ON public.requirements;
DROP POLICY IF EXISTS requirements_update ON public.requirements;
DROP POLICY IF EXISTS requirements_delete ON public.requirements;
DROP POLICY IF EXISTS "requirements_select" ON public.requirements;
DROP POLICY IF EXISTS "requirements_insert" ON public.requirements;
DROP POLICY IF EXISTS "requirements_update" ON public.requirements;
DROP POLICY IF EXISTS "requirements_delete" ON public.requirements;

CREATE POLICY requirements_select ON public.requirements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY requirements_insert ON public.requirements
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY requirements_update ON public.requirements
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY requirements_delete ON public.requirements
  FOR DELETE TO authenticated USING (true);

-- --------------------------------------------------------------------------
-- B) Purchase quotes: force Data API access for Director/Purchase portal users.
-- --------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_quotes TO authenticated;
GRANT ALL ON public.purchase_quotes TO service_role;

DROP POLICY IF EXISTS purchase_quotes_select ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_insert ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_update ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_delete ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_select" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_insert" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_update" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_delete" ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_all ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_all" ON public.purchase_quotes;

CREATE POLICY purchase_quotes_select ON public.purchase_quotes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_quotes_insert ON public.purchase_quotes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY purchase_quotes_update ON public.purchase_quotes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY purchase_quotes_delete ON public.purchase_quotes
  FOR DELETE TO authenticated USING (true);

UPDATE public.purchase_quotes
SET status = 'pending'
WHERE status IS NULL OR btrim(status) = '';

UPDATE public.purchase_quotes
SET status = 'accepted'
WHERE lower(status) = 'approved';

-- --------------------------------------------------------------------------
-- C) Leave requests: allow reliable employee/director reads/writes and maintain
--    balances in the database when Director approves/rejects.
-- --------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
GRANT SELECT, UPDATE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

DROP POLICY IF EXISTS leave_requests_select ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_update ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_delete ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_select" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_update" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete" ON public.leave_requests;

CREATE POLICY leave_requests_select ON public.leave_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY leave_requests_insert ON public.leave_requests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY leave_requests_update ON public.leave_requests
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY leave_requests_delete ON public.leave_requests
  FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_employee_leave_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN
    IF OLD.leave_type::text = 'paid' THEN
      UPDATE public.employees SET paid_leave_balance = COALESCE(paid_leave_balance, 12) + 1 WHERE id = OLD.employee_id;
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
      UPDATE public.employees SET paid_leave_balance = GREATEST(0, COALESCE(paid_leave_balance, 12) - 1) WHERE id = NEW.employee_id;
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

DROP TRIGGER IF EXISTS sync_employee_leave_balance_after_write ON public.leave_requests;
CREATE TRIGGER sync_employee_leave_balance_after_write
AFTER INSERT OR UPDATE OF status, leave_type, is_add_leave, employee_id ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_employee_leave_balance();

-- Recalculate current balances once, so old approvals become immediately usable.
WITH stats AS (
  SELECT
    e.id,
    GREATEST(0, 12 - COUNT(l.*) FILTER (WHERE l.leave_type::text = 'paid' AND l.status = 'approved'))::int AS paid_balance,
    GREATEST(0, 6 - COUNT(l.*) FILTER (WHERE l.leave_type::text = 'medical' AND l.status = 'approved'))::int AS medical_balance,
    GREATEST(0,
      COUNT(l.*) FILTER (WHERE l.leave_type::text = 'exchange' AND l.status = 'approved' AND COALESCE(l.is_add_leave, false))
      - COUNT(l.*) FILTER (WHERE l.leave_type::text = 'exchange' AND l.status = 'approved' AND NOT COALESCE(l.is_add_leave, false))
    )::int AS exchange_balance
  FROM public.employees e
  LEFT JOIN public.leave_requests l ON l.employee_id = e.id
  GROUP BY e.id
)
UPDATE public.employees e
SET paid_leave_balance = stats.paid_balance,
    medical_leave_balance = stats.medical_balance,
    exchange_leave_balance = stats.exchange_balance
FROM stats
WHERE stats.id = e.id;

-- Realtime publication (ignore if already present / unavailable).
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.requirements; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_quotes; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.employees; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Verification after patch:
SELECT id, title, description, why_needed, link_url, expected_cost, requested_by, employee_name, status
FROM public.requirements
ORDER BY created_at DESC
LIMIT 10;

SELECT id, quote_id, status, description
FROM public.purchase_quotes
ORDER BY created_at DESC
LIMIT 10;

SELECT e.name, e.exchange_leave_balance,
       COUNT(l.*) FILTER (WHERE l.leave_type::text = 'exchange' AND l.status = 'approved' AND COALESCE(l.is_add_leave, false)) AS approved_exchange_earned,
       COUNT(l.*) FILTER (WHERE l.leave_type::text = 'exchange' AND l.status <> 'rejected' AND NOT COALESCE(l.is_add_leave, false)) AS exchange_taken_or_pending
FROM public.employees e
LEFT JOIN public.leave_requests l ON l.employee_id = e.id
GROUP BY e.id, e.name, e.exchange_leave_balance
ORDER BY e.name;