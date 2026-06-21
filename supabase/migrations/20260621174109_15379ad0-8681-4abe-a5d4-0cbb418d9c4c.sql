CREATE OR REPLACE FUNCTION public.get_tender_users()
RETURNS TABLE(username text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username, role::text
  FROM public.portal_users
  WHERE role::text IN ('tender_head','tender_executive');
$$;

GRANT EXECUTE ON FUNCTION public.get_tender_users() TO authenticated;