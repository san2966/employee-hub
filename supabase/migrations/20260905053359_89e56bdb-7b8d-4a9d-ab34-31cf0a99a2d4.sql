
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
           WHERE p.pronamespace='public'::regnamespace AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_portal_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_employee_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_account_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_directory_employees() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tender_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_portal_employee(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_head(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_designation_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_profile_id_of(uuid) TO authenticated;
