-- 1) Directory RPC: mask sensitive personal data unless caller is HR/Admin/Director
CREATE OR REPLACE FUNCTION public.get_directory_employees()
RETURNS TABLE(id uuid, name text, designation text, phone text, alternate_phone text, address text, photo text, created_at timestamptz, source text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  WITH priv AS (
    SELECT auth.uid() IS NOT NULL
       AND public.has_any_role(auth.uid(), ARRAY['hr','admin','director']) AS ok
  ), rows AS (
    SELECT e.id, e.name, e.designation, COALESCE(e.phone, e.mobile) AS phone,
           CASE WHEN e.mobile IS NOT NULL AND e.mobile <> COALESCE(e.phone,'') THEN e.mobile ELSE NULL END AS alternate_phone,
           e.address, e.photo, e.created_at, 'hr'::text AS source
    FROM public.employees e
    WHERE COALESCE(e.is_active, true) = true
    UNION ALL
    SELECT ae.id, ae.name, ae.designation, ae.phone, ae.alternate_phone,
           ae.address, ae.photo, ae.created_at, 'admin'::text
    FROM public.admin_employees ae
  )
  SELECT r.id, r.name, r.designation,
         CASE WHEN p.ok THEN r.phone END,
         CASE WHEN p.ok THEN r.alternate_phone END,
         CASE WHEN p.ok THEN r.address END,
         CASE WHEN p.ok THEN r.photo END,
         r.created_at, r.source
  FROM rows r CROSS JOIN priv p
  WHERE auth.uid() IS NOT NULL
  ORDER BY r.name;
$fn$;

-- 2) Tender users RPC: only tender/management roles
CREATE OR REPLACE FUNCTION public.get_tender_users()
RETURNS TABLE(username text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  SELECT pu.username, pu.role::text
  FROM public.portal_users pu
  WHERE pu.role::text IN ('tender_head','tender_executive')
    AND public.has_any_role(auth.uid(), ARRAY['tender_head','tender_executive','director','admin','hr'])
  ORDER BY pu.role::text, pu.username;
$fn$;

-- 3) Identity lookups limited to the calling user
CREATE OR REPLACE FUNCTION public.get_employee_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  SELECT employee_id FROM public.user_roles
  WHERE user_id = user_uuid
    AND (user_uuid = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['hr','admin','director']))
  LIMIT 1;
$fn$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  SELECT role FROM public.user_roles
  WHERE user_id = user_uuid
    AND (user_uuid = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['hr','admin','director']))
  LIMIT 1;
$fn$;

-- 4) Remove signed-in execute rights from definer functions the client never calls
REVOKE EXECUTE ON FUNCTION public.current_account_keys() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_employee_name() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_portal_employee_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.business_designation_of(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.business_profile_id_of(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_business_head(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.resolve_portal_employee(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_directory_employees() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_tender_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_employee_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_directory_employees() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tender_users() TO authenticated;
