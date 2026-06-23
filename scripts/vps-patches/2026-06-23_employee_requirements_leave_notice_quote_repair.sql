-- ============================================================================
-- VPS DB Patch — 2026-06-23 Employee Requirements/Leave + Notice Targeting
-- Fixes:
--  1) Employee > Requirements: "Request Not Submitted" and JSON data storage.
--  2) Employee > Leave Manager: exchange/paid/medical requests failing or hidden.
--  3) Director > Notices: notices only for selected employees; announcements for all.
--  4) Director > Quotation Manager: confirms purchase_quotes access for actions.
--
-- RUN ON VPS
--   psql -h localhost -U postgres -d postgres \
--     -f scripts/vps-patches/2026-06-23_employee_requirements_leave_notice_quote_repair.sql
-- ============================================================================

BEGIN;

-- A) Repair broken employee login links. This is the root cause of leave FK
-- failures: portal_users.employee_id points to an employee row that no longer
-- exists, so leave_requests.employee_id violates leave_requests_employee_id_fkey.
DO $$
DECLARE
  pu record;
  matched_employee uuid;
  fallback_email text;
  fallback_name text;
BEGIN
  FOR pu IN
    SELECT id, username, employee_id
    FROM public.portal_users
    WHERE role::text = 'employee'
      AND is_active IS TRUE
      AND (
        employee_id IS NULL
        OR NOT EXISTS (SELECT 1 FROM public.employees e WHERE e.id = portal_users.employee_id)
      )
  LOOP
    SELECT e.id INTO matched_employee
    FROM public.employees e
    WHERE lower(e.username) = lower(pu.username)
       OR lower(e.email) = lower(pu.username)
    LIMIT 1;

    IF matched_employee IS NULL THEN
      fallback_email := CASE WHEN pu.username LIKE '%@%' THEN pu.username ELSE pu.username || '@portal.local' END;
      fallback_name := CASE WHEN pu.username LIKE '%@%' THEN split_part(pu.username, '@', 1) ELSE pu.username END;

      INSERT INTO public.employees (
        name, address, phone, email, aadhaar_number, pan_number, blood_group,
        father_name, mother_name, highest_education, degree_name,
        school_college, board_university, year_of_passing, passed_or_appearing,
        date_of_joining, designation, responsibilities, username,
        paid_leave_balance, medical_leave_balance, exchange_leave_balance, is_active
      ) VALUES (
        fallback_name, 'Pending HR update', 'Pending', fallback_email, 'Pending', 'Pending', 'Pending',
        'Pending', 'Pending', 'Pending', 'Pending',
        'Pending', 'Pending', 'Pending', 'passed',
        CURRENT_DATE, 'Employee', 'Pending HR update', pu.username,
        12, 6, 0, true
      )
      RETURNING id INTO matched_employee;
    END IF;

    UPDATE public.portal_users
    SET employee_id = matched_employee
    WHERE id = pu.id;

    UPDATE public.user_roles ur
    SET employee_id = matched_employee
    WHERE ur.employee_id = pu.employee_id
       OR (ur.role = 'employee' AND ur.employee_id IS NULL);
  END LOOP;
END $$;

UPDATE public.user_roles ur
SET employee_id = pu.employee_id
FROM public.portal_users pu
JOIN auth.users au ON au.email = pu.id::text || '@portal.internal'
WHERE ur.user_id = au.id
  AND pu.role::text = 'employee'
  AND pu.employee_id IS NOT NULL;

-- B) Requirements: permanent real columns and old JSON cleanup.
ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS why_needed text,
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS expected_cost numeric,
  ADD COLUMN IF NOT EXISTS employee_name text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirements TO authenticated;
GRANT ALL ON public.requirements TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_portal_employee(_username text DEFAULT NULL)
RETURNS TABLE(employee_id uuid, employee_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_username text := lower(btrim(coalesce(_username, '')));
  jwt_claims jsonb;
  claim_text text;
BEGIN
  RETURN QUERY
  SELECT e.id, COALESCE(e.name, e.username, e.email)
  FROM public.user_roles ur
  JOIN public.employees e ON e.id = ur.employee_id
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  BEGIN
    jwt_claims := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb;
  EXCEPTION WHEN OTHERS THEN
    jwt_claims := NULL;
  END;

  claim_text := COALESCE(jwt_claims #>> '{user_metadata,employee_id}', jwt_claims ->> 'employee_id');
  IF claim_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY SELECT e.id, COALESCE(e.name, e.username, e.email) FROM public.employees e WHERE e.id = claim_text::uuid LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  claim_text := jwt_claims #>> '{user_metadata,portal_user_id}';
  IF claim_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY SELECT e.id, COALESCE(e.name, e.username, e.email) FROM public.portal_users pu JOIN public.employees e ON e.id = pu.employee_id WHERE pu.id = claim_text::uuid LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  IF clean_username <> '' THEN
    RETURN QUERY SELECT e.id, COALESCE(e.name, e.username, e.email) FROM public.portal_users pu JOIN public.employees e ON e.id = pu.employee_id WHERE lower(pu.username) = clean_username LIMIT 1;
    IF FOUND THEN RETURN; END IF;
    RETURN QUERY SELECT e.id, COALESCE(e.name, e.username, e.email) FROM public.employees e WHERE lower(e.username) = clean_username OR lower(e.email) = clean_username LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_portal_employee(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.current_portal_employee_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_id uuid;
BEGIN
  SELECT r.employee_id INTO result_id FROM public.resolve_portal_employee(NULL) r LIMIT 1;
  RETURN result_id;
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
    BEGIN payload := NEW.description::jsonb; EXCEPTION WHEN OTHERS THEN payload := NULL; END;
    IF payload IS NOT NULL AND jsonb_typeof(payload) = 'object' THEN
      NEW.description := COALESCE(NULLIF(payload->>'description', ''), NEW.description);
      NEW.why_needed := COALESCE(NULLIF(NEW.why_needed, ''), NULLIF(payload->>'whyNeeded', ''));
      NEW.link_url := COALESCE(NULLIF(NEW.link_url, ''), NULLIF(payload->>'link', ''));
      IF NEW.expected_cost IS NULL AND NULLIF(payload->>'expectedCost', '') IS NOT NULL THEN
        BEGIN NEW.expected_cost := (payload->>'expectedCost')::numeric; EXCEPTION WHEN OTHERS THEN NEW.expected_cost := NULL; END;
      END IF;
    END IF;
  END IF;

  IF NEW.requested_by IS NULL THEN
    NEW.requested_by := public.current_portal_employee_id();
  END IF;

  IF NULLIF(NEW.employee_name, '') IS NULL AND NEW.requested_by IS NOT NULL THEN
    SELECT COALESCE(e.name, e.username, e.email) INTO employee_label FROM public.employees e WHERE e.id = NEW.requested_by LIMIT 1;
    NEW.employee_name := employee_label;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_requirement_row_before_write ON public.requirements;
CREATE TRIGGER normalize_requirement_row_before_write
BEFORE INSERT OR UPDATE ON public.requirements
FOR EACH ROW EXECUTE FUNCTION public.normalize_requirement_row();

DO $$
DECLARE rec record; payload jsonb;
BEGIN
  FOR rec IN SELECT id, description FROM public.requirements LOOP
    payload := NULL;
    IF rec.description IS NOT NULL AND btrim(rec.description) ~ '^\{.*\}$' THEN
      BEGIN payload := rec.description::jsonb; EXCEPTION WHEN OTHERS THEN payload := NULL; END;
    END IF;
    IF payload IS NOT NULL AND jsonb_typeof(payload) = 'object' THEN
      UPDATE public.requirements r
      SET description = COALESCE(NULLIF(payload->>'description', ''), r.description),
          why_needed = COALESCE(NULLIF(r.why_needed, ''), NULLIF(payload->>'whyNeeded', '')),
          link_url = COALESCE(NULLIF(r.link_url, ''), NULLIF(payload->>'link', '')),
          expected_cost = COALESCE(r.expected_cost, CASE WHEN NULLIF(payload->>'expectedCost', '') ~ '^\d+(\.\d+)?$' THEN (payload->>'expectedCost')::numeric ELSE NULL END)
      WHERE r.id = rec.id;
    END IF;
  END LOOP;
END $$;

-- C) Leave requests: access and database-side balance recalculation.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
GRANT SELECT, UPDATE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

CREATE OR REPLACE FUNCTION public.sync_employee_leave_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status::text = 'approved' THEN
    IF OLD.leave_type::text = 'paid' THEN UPDATE public.employees SET paid_leave_balance = COALESCE(paid_leave_balance, 12) + 1 WHERE id = OLD.employee_id;
    ELSIF OLD.leave_type::text = 'medical' THEN UPDATE public.employees SET medical_leave_balance = COALESCE(medical_leave_balance, 6) + 1 WHERE id = OLD.employee_id;
    ELSIF OLD.leave_type::text = 'exchange' AND COALESCE(OLD.is_add_leave, false) THEN UPDATE public.employees SET exchange_leave_balance = GREATEST(0, COALESCE(exchange_leave_balance, 0) - 1) WHERE id = OLD.employee_id;
    ELSIF OLD.leave_type::text = 'exchange' THEN UPDATE public.employees SET exchange_leave_balance = COALESCE(exchange_leave_balance, 0) + 1 WHERE id = OLD.employee_id;
    END IF;
  END IF;

  IF NEW.status::text = 'approved' THEN
    IF NEW.leave_type::text = 'paid' THEN UPDATE public.employees SET paid_leave_balance = GREATEST(0, COALESCE(paid_leave_balance, 12) - 1) WHERE id = NEW.employee_id;
    ELSIF NEW.leave_type::text = 'medical' THEN UPDATE public.employees SET medical_leave_balance = GREATEST(0, COALESCE(medical_leave_balance, 6) - 1) WHERE id = NEW.employee_id;
    ELSIF NEW.leave_type::text = 'exchange' AND COALESCE(NEW.is_add_leave, false) THEN UPDATE public.employees SET exchange_leave_balance = COALESCE(exchange_leave_balance, 0) + 1 WHERE id = NEW.employee_id;
    ELSIF NEW.leave_type::text = 'exchange' THEN UPDATE public.employees SET exchange_leave_balance = GREATEST(0, COALESCE(exchange_leave_balance, 0) - 1) WHERE id = NEW.employee_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_employee_leave_balance_after_write ON public.leave_requests;
CREATE TRIGGER sync_employee_leave_balance_after_write
AFTER INSERT OR UPDATE OF status, leave_type, is_add_leave, employee_id ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_employee_leave_balance();

WITH stats AS (
  SELECT e.id,
    GREATEST(0, 12 - COUNT(l.*) FILTER (WHERE l.leave_type::text = 'paid' AND l.status::text = 'approved'))::int AS paid_balance,
    GREATEST(0, 6 - COUNT(l.*) FILTER (WHERE l.leave_type::text = 'medical' AND l.status::text = 'approved'))::int AS medical_balance,
    GREATEST(0,
      COUNT(l.*) FILTER (WHERE l.leave_type::text = 'exchange' AND l.status::text = 'approved' AND COALESCE(l.is_add_leave, false))
      - COUNT(l.*) FILTER (WHERE l.leave_type::text = 'exchange' AND l.status::text <> 'rejected' AND NOT COALESCE(l.is_add_leave, false))
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

-- D) Notices: selected employee notices vs global announcements.
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS notice_type text NOT NULL DEFAULT 'announcement',
  ADD COLUMN IF NOT EXISTS recipient_employee_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;

UPDATE public.notices
SET notice_type = COALESCE(NULLIF(notice_type, ''), 'announcement'),
    recipient_employee_ids = COALESCE(recipient_employee_ids, '{}'),
    is_global = CASE WHEN COALESCE(notice_type, 'announcement') = 'announcement' THEN true ELSE COALESCE(is_global, false) END;

-- E) Access policies for the affected tables.
DROP POLICY IF EXISTS requirements_select ON public.requirements;
DROP POLICY IF EXISTS requirements_insert ON public.requirements;
DROP POLICY IF EXISTS requirements_update ON public.requirements;
DROP POLICY IF EXISTS requirements_delete ON public.requirements;
CREATE POLICY requirements_select ON public.requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY requirements_insert ON public.requirements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY requirements_update ON public.requirements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY requirements_delete ON public.requirements FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS leave_requests_select ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_update ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_delete ON public.leave_requests;
CREATE POLICY leave_requests_select ON public.leave_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY leave_requests_insert ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY leave_requests_update ON public.leave_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY leave_requests_delete ON public.leave_requests FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS notices_select ON public.notices;
DROP POLICY IF EXISTS notices_insert ON public.notices;
DROP POLICY IF EXISTS notices_update ON public.notices;
DROP POLICY IF EXISTS notices_delete ON public.notices;
DROP POLICY IF EXISTS "notices_select" ON public.notices;
DROP POLICY IF EXISTS "notices_insert" ON public.notices;
DROP POLICY IF EXISTS "notices_update" ON public.notices;
DROP POLICY IF EXISTS "notices_delete" ON public.notices;
CREATE POLICY notices_select ON public.notices FOR SELECT TO authenticated USING (
  is_active IS TRUE AND (
    COALESCE(is_global, false) IS TRUE
    OR COALESCE(notice_type, 'announcement') = 'announcement'
    OR public.current_portal_employee_id() = ANY(COALESCE(recipient_employee_ids, '{}'))
    OR public.has_role(auth.uid(), 'director')
    OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY notices_insert ON public.notices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY notices_update ON public.notices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY notices_delete ON public.notices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_quotes TO authenticated;
GRANT ALL ON public.purchase_quotes TO service_role;

DROP POLICY IF EXISTS purchase_quotes_select ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_insert ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_update ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_delete ON public.purchase_quotes;
CREATE POLICY purchase_quotes_select ON public.purchase_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_quotes_insert ON public.purchase_quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY purchase_quotes_update ON public.purchase_quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY purchase_quotes_delete ON public.purchase_quotes FOR DELETE TO authenticated USING (true);

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.requirements; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.employees; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notices; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_quotes; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Verification queries:
SELECT pu.username, pu.employee_id, e.id AS employee_exists
FROM public.portal_users pu
LEFT JOIN public.employees e ON e.id = pu.employee_id
WHERE pu.role::text = 'employee'
ORDER BY pu.username;

SELECT id, title, description, why_needed, link_url, expected_cost, requested_by, employee_name, status
FROM public.requirements
ORDER BY created_at DESC
LIMIT 10;

SELECT e.name, e.paid_leave_balance, e.medical_leave_balance, e.exchange_leave_balance
FROM public.employees e
ORDER BY e.name;

SELECT id, title, notice_type, is_global, recipient_employee_ids, is_active
FROM public.notices
ORDER BY created_at DESC
LIMIT 10;

SELECT id, quote_id, status, description
FROM public.purchase_quotes
ORDER BY created_at DESC
LIMIT 10;