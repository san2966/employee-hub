-- Restore EXECUTE for identity helpers referenced inside RLS policies:
-- policy expressions are evaluated as the invoking role, so authenticated needs EXECUTE.
GRANT EXECUTE ON FUNCTION public.current_account_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_employee_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_portal_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_designation_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.business_profile_id_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_head(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid) TO authenticated;
