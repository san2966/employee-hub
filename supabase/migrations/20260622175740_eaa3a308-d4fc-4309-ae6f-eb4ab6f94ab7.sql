ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'rejected';

ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS why_needed text,
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS expected_cost numeric,
  ADD COLUMN IF NOT EXISTS employee_name text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirements TO authenticated;
GRANT ALL ON public.requirements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_quotes TO authenticated;
GRANT ALL ON public.purchase_quotes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
GRANT SELECT, UPDATE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

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

DROP POLICY IF EXISTS requirements_select ON public.requirements;
DROP POLICY IF EXISTS requirements_insert ON public.requirements;
DROP POLICY IF EXISTS requirements_update ON public.requirements;
DROP POLICY IF EXISTS requirements_delete ON public.requirements;
DROP POLICY IF EXISTS "requirements_select" ON public.requirements;
DROP POLICY IF EXISTS "requirements_insert" ON public.requirements;
DROP POLICY IF EXISTS "requirements_update" ON public.requirements;
DROP POLICY IF EXISTS "requirements_delete" ON public.requirements;

CREATE POLICY requirements_select ON public.requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY requirements_insert ON public.requirements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY requirements_update ON public.requirements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY requirements_delete ON public.requirements FOR DELETE TO authenticated USING (true);

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

CREATE POLICY purchase_quotes_select ON public.purchase_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_quotes_insert ON public.purchase_quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY purchase_quotes_update ON public.purchase_quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY purchase_quotes_delete ON public.purchase_quotes FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS leave_requests_select ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_update ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_delete ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_select" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_update" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete" ON public.leave_requests;

CREATE POLICY leave_requests_select ON public.leave_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY leave_requests_insert ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY leave_requests_update ON public.leave_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY leave_requests_delete ON public.leave_requests FOR DELETE TO authenticated USING (true);

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

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.requirements; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_quotes; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.employees; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
END $$;

NOTIFY pgrst, 'reload schema';