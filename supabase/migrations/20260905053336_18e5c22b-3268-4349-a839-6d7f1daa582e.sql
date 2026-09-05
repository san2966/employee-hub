
CREATE OR REPLACE FUNCTION public.has_any_role(_uid uuid, _roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role::text = ANY(_roles));
$$;

CREATE OR REPLACE FUNCTION public.current_employee_name()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.name FROM public.employees e
  WHERE e.id = public.get_employee_id(auth.uid()) LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_account_keys()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(array_agg(DISTINCT k), ARRAY[]::text[])
  FROM (
    SELECT lower(r.role::text || ':' || v) AS k
    FROM public.user_roles r
    LEFT JOIN public.employees e ON e.id = r.employee_id
    CROSS JOIN LATERAL (VALUES (e.username), (e.email), (r.employee_id::text), (e.name)) AS t(v)
    WHERE r.user_id = auth.uid() AND v IS NOT NULL
    UNION ALL
    SELECT lower('tender:' || v)
    FROM public.user_roles r
    LEFT JOIN public.employees e ON e.id = r.employee_id
    CROSS JOIN LATERAL (VALUES (e.username), (e.email), (r.employee_id::text)) AS t(v)
    WHERE r.user_id = auth.uid() AND r.role::text LIKE 'tender%' AND v IS NOT NULL
    UNION ALL
    SELECT lower(r.role::text || ':' || pu.username)
    FROM public.user_roles r
    JOIN public.portal_users pu ON pu.role::text = r.role::text AND pu.employee_id IS NOT DISTINCT FROM r.employee_id
    WHERE r.user_id = auth.uid()
  ) s;
$$;

GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_employee_name() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_account_keys() TO authenticated, service_role;

DROP POLICY IF EXISTS "admin_task all" ON public.admin_task;
CREATE POLICY admin_task_select ON public.admin_task FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','hr','director'])
         OR employee_id = public.get_employee_id(auth.uid()));
CREATE POLICY admin_task_write ON public.admin_task FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','director']));
CREATE POLICY admin_task_update ON public.admin_task FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director'])
         OR employee_id = public.get_employee_id(auth.uid()))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','director'])
         OR employee_id = public.get_employee_id(auth.uid()));
CREATE POLICY admin_task_delete ON public.admin_task FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director']));

DROP POLICY IF EXISTS admin_employees_all ON public.admin_employees;
CREATE POLICY admin_employees_manage ON public.admin_employees FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','hr','director']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','hr','director']));

DROP POLICY IF EXISTS "Portal can read device history" ON public.device_login_history;
DROP POLICY IF EXISTS "Portal can prune device history" ON public.device_login_history;
CREATE POLICY device_history_select ON public.device_login_history FOR SELECT TO authenticated
  USING (account_key = ANY(public.current_account_keys())
         OR public.has_any_role(auth.uid(), ARRAY['admin','director','ithead']));
CREATE POLICY device_history_delete ON public.device_login_history FOR DELETE TO authenticated
  USING (account_key = ANY(public.current_account_keys())
         OR public.has_any_role(auth.uid(), ARRAY['admin','director','ithead']));

DROP POLICY IF EXISTS employee_payments_select ON public.employee_payments;
DROP POLICY IF EXISTS employee_payments_insert ON public.employee_payments;
DROP POLICY IF EXISTS employee_payments_update ON public.employee_payments;
DROP POLICY IF EXISTS employee_payments_delete ON public.employee_payments;
CREATE POLICY employee_payments_select ON public.employee_payments FOR SELECT TO authenticated
  USING (employee_id = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['hr','accounts','admin','director']));
CREATE POLICY employee_payments_insert ON public.employee_payments FOR INSERT TO authenticated
  WITH CHECK (employee_id = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['hr','accounts','admin','director']));
CREATE POLICY employee_payments_update ON public.employee_payments FOR UPDATE TO authenticated
  USING (employee_id = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['hr','accounts','admin','director']))
  WITH CHECK (employee_id = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['hr','accounts','admin','director']));
CREATE POLICY employee_payments_delete ON public.employee_payments FOR DELETE TO authenticated
  USING (employee_id = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['hr','accounts','admin','director']));

DROP POLICY IF EXISTS leave_requests_select ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_update ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_delete ON public.leave_requests;
CREATE POLICY leave_requests_select ON public.leave_requests FOR SELECT TO authenticated
  USING (employee_id = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['hr','admin','director']));
CREATE POLICY leave_requests_insert ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['hr','admin','director']));
CREATE POLICY leave_requests_update ON public.leave_requests FOR UPDATE TO authenticated
  USING (employee_id = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['hr','admin','director']))
  WITH CHECK (employee_id = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['hr','admin','director']));
CREATE POLICY leave_requests_delete ON public.leave_requests FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['hr','admin','director']));

DROP POLICY IF EXISTS purchase_quotes_select ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_insert ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_update ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_delete ON public.purchase_quotes;
CREATE POLICY purchase_quotes_select ON public.purchase_quotes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['purchase','director','admin','accounts']));
CREATE POLICY purchase_quotes_insert ON public.purchase_quotes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['purchase','director','admin']));
CREATE POLICY purchase_quotes_update ON public.purchase_quotes FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['purchase','director','admin']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['purchase','director','admin']));
CREATE POLICY purchase_quotes_delete ON public.purchase_quotes FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['purchase','director','admin']));

DROP POLICY IF EXISTS tender_tasks_select ON public.tender_tasks;
DROP POLICY IF EXISTS tender_tasks_insert ON public.tender_tasks;
DROP POLICY IF EXISTS tender_tasks_update ON public.tender_tasks;
DROP POLICY IF EXISTS tender_tasks_delete ON public.tender_tasks;
CREATE POLICY tender_tasks_select ON public.tender_tasks FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['tender_head','tender_executive','director','admin']));
CREATE POLICY tender_tasks_insert ON public.tender_tasks FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['tender_head','tender_executive','director','admin']));
CREATE POLICY tender_tasks_update ON public.tender_tasks FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['tender_head','tender_executive','director','admin']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['tender_head','tender_executive','director','admin']));
CREATE POLICY tender_tasks_delete ON public.tender_tasks FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['tender_head','director','admin']));

DROP POLICY IF EXISTS requirements_select ON public.requirements;
DROP POLICY IF EXISTS requirements_insert ON public.requirements;
DROP POLICY IF EXISTS requirements_update ON public.requirements;
DROP POLICY IF EXISTS requirements_delete ON public.requirements;
CREATE POLICY requirements_select ON public.requirements FOR SELECT TO authenticated
  USING (requested_by = public.get_employee_id(auth.uid())
         OR lower(coalesce(employee_name,'')) = lower(coalesce(public.current_employee_name(),'~none~'))
         OR public.has_any_role(auth.uid(), ARRAY['director','admin','hr','purchase','accounts']));
CREATE POLICY requirements_insert ON public.requirements FOR INSERT TO authenticated
  WITH CHECK (requested_by = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['director','admin','hr','purchase']));
CREATE POLICY requirements_update ON public.requirements FOR UPDATE TO authenticated
  USING (requested_by = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['director','admin','hr','purchase']))
  WITH CHECK (requested_by = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['director','admin','hr','purchase']));
CREATE POLICY requirements_delete ON public.requirements FOR DELETE TO authenticated
  USING (requested_by = public.get_employee_id(auth.uid())
         OR public.has_any_role(auth.uid(), ARRAY['director','admin']));

DROP POLICY IF EXISTS it_asset_assignments_all ON public.it_asset_assignments;
CREATE POLICY it_asset_assignments_all ON public.it_asset_assignments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ithead','admin','director']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ithead','admin']));

DROP POLICY IF EXISTS tickets_insert_public ON public.tickets;
CREATE POLICY tickets_insert_authenticated ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (status = 'Active' AND problem_cause IS NULL AND solution_provided IS NULL
              AND resolution_image_url IS NULL AND resolved_at IS NULL);

DROP POLICY IF EXISTS employee_payments_receipts_read ON storage.objects;
DROP POLICY IF EXISTS employee_payments_receipts_insert ON storage.objects;
DROP POLICY IF EXISTS employee_payments_receipts_update ON storage.objects;
DROP POLICY IF EXISTS employee_payments_receipts_delete ON storage.objects;
CREATE POLICY employee_payments_receipts_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-payments'
         AND ((storage.foldername(name))[1] = public.get_employee_id(auth.uid())::text
              OR public.has_any_role(auth.uid(), ARRAY['hr','accounts','admin','director'])));
CREATE POLICY employee_payments_receipts_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-payments'
         AND ((storage.foldername(name))[1] = public.get_employee_id(auth.uid())::text
              OR public.has_any_role(auth.uid(), ARRAY['hr','accounts','admin','director'])));
CREATE POLICY employee_payments_receipts_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'employee-payments'
         AND ((storage.foldername(name))[1] = public.get_employee_id(auth.uid())::text
              OR public.has_any_role(auth.uid(), ARRAY['hr','accounts','admin','director'])));
CREATE POLICY employee_payments_receipts_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'employee-payments'
         AND ((storage.foldername(name))[1] = public.get_employee_id(auth.uid())::text
              OR public.has_any_role(auth.uid(), ARRAY['hr','accounts','admin','director'])));

DROP POLICY IF EXISTS "Tender roles can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Tender roles can update files" ON storage.objects;
DROP POLICY IF EXISTS "Tender roles can delete files" ON storage.objects;

REVOKE EXECUTE ON FUNCTION public.hash_password(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_password(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_requirement_row() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_employee_leave_balance() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.resolve_portal_employee(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_directory_employees() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_tender_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_employee_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_portal_employee_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.hash_password(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
