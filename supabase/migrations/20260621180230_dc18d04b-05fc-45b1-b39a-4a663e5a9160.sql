GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_quotes TO authenticated;
GRANT ALL ON public.purchase_quotes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tender_tasks TO authenticated;
GRANT ALL ON public.tender_tasks TO service_role;

DROP POLICY IF EXISTS purchase_quotes_all ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_select ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_insert ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_update ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_delete ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_all" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_select" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_insert" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_update" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_delete" ON public.purchase_quotes;

CREATE POLICY purchase_quotes_select ON public.purchase_quotes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_quotes_insert ON public.purchase_quotes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY purchase_quotes_update ON public.purchase_quotes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY purchase_quotes_delete ON public.purchase_quotes
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS tender_tasks_all ON public.tender_tasks;
DROP POLICY IF EXISTS tender_tasks_select ON public.tender_tasks;
DROP POLICY IF EXISTS tender_tasks_insert ON public.tender_tasks;
DROP POLICY IF EXISTS tender_tasks_update ON public.tender_tasks;
DROP POLICY IF EXISTS tender_tasks_delete ON public.tender_tasks;
DROP POLICY IF EXISTS "Tender roles can manage tasks" ON public.tender_tasks;
DROP POLICY IF EXISTS "Tender roles can view tasks" ON public.tender_tasks;

CREATE POLICY tender_tasks_select ON public.tender_tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY tender_tasks_insert ON public.tender_tasks
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY tender_tasks_update ON public.tender_tasks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY tender_tasks_delete ON public.tender_tasks
  FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.get_tender_users()
RETURNS TABLE(username text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT portal_users.username, portal_users.role::text
  FROM public.portal_users
  WHERE portal_users.role::text IN ('tender_head','tender_executive')
  ORDER BY portal_users.role::text, portal_users.username;
$$;

GRANT EXECUTE ON FUNCTION public.get_tender_users() TO authenticated;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_quotes;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_tasks;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
  END;
END $$;

UPDATE public.purchase_quotes
SET status = 'pending'
WHERE status IS NULL OR btrim(status) = '';

UPDATE public.purchase_quotes
SET status = 'accepted'
WHERE lower(status) = 'approved';

WITH first_exec AS (
  SELECT username
  FROM public.portal_users
  WHERE role::text = 'tender_executive'
  ORDER BY username
  LIMIT 1
), tender_heads AS (
  SELECT username
  FROM public.portal_users
  WHERE role::text = 'tender_head'
)
UPDATE public.tender_tasks t
SET assigned_to = first_exec.username
FROM first_exec, tender_heads
WHERE lower(t.assigned_by) = lower(tender_heads.username)
  AND t.assigned_to !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$';

NOTIFY pgrst, 'reload schema';