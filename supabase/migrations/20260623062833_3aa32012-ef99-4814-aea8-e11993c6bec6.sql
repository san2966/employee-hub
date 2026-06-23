ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS notice_type text NOT NULL DEFAULT 'announcement',
  ADD COLUMN IF NOT EXISTS recipient_employee_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirements TO authenticated;
GRANT ALL ON public.requirements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
GRANT SELECT, UPDATE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_quotes TO authenticated;
GRANT ALL ON public.purchase_quotes TO service_role;

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
    RETURN QUERY
    SELECT e.id, COALESCE(e.name, e.username, e.email)
    FROM public.employees e
    WHERE e.id = claim_text::uuid
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  claim_text := jwt_claims #>> '{user_metadata,portal_user_id}';
  IF claim_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY
    SELECT e.id, COALESCE(e.name, e.username, e.email)
    FROM public.portal_users pu
    JOIN public.employees e ON e.id = pu.employee_id
    WHERE pu.id = claim_text::uuid
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  IF clean_username <> '' THEN
    RETURN QUERY
    SELECT e.id, COALESCE(e.name, e.username, e.email)
    FROM public.portal_users pu
    JOIN public.employees e ON e.id = pu.employee_id
    WHERE lower(pu.username) = clean_username
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    RETURN QUERY
    SELECT e.id, COALESCE(e.name, e.username, e.email)
    FROM public.employees e
    WHERE lower(e.username) = clean_username OR lower(e.email) = clean_username
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_portal_employee(text) TO authenticated;

DROP POLICY IF EXISTS notices_select ON public.notices;
DROP POLICY IF EXISTS notices_insert ON public.notices;
DROP POLICY IF EXISTS notices_update ON public.notices;
DROP POLICY IF EXISTS notices_delete ON public.notices;
DROP POLICY IF EXISTS "notices_select" ON public.notices;
DROP POLICY IF EXISTS "notices_insert" ON public.notices;
DROP POLICY IF EXISTS "notices_update" ON public.notices;
DROP POLICY IF EXISTS "notices_delete" ON public.notices;

CREATE POLICY notices_select ON public.notices
  FOR SELECT TO authenticated USING (
    is_active IS TRUE
    AND (
      COALESCE(is_global, false) IS TRUE
      OR COALESCE(notice_type, 'announcement') = 'announcement'
      OR public.current_portal_employee_id() = ANY(COALESCE(recipient_employee_ids, '{}'))
      OR public.has_role(auth.uid(), 'director')
      OR public.has_role(auth.uid(), 'admin')
    )
  );
CREATE POLICY notices_insert ON public.notices
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY notices_update ON public.notices
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY notices_delete ON public.notices
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));

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

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notices; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.requirements; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.employees; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_quotes; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
END $$;

NOTIFY pgrst, 'reload schema';