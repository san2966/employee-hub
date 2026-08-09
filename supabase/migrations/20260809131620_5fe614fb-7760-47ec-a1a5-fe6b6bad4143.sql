REVOKE EXECUTE ON FUNCTION public.business_designation_of(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_business_head(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.business_profile_id_of(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.business_designation_of(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_business_head(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_profile_id_of(uuid) TO authenticated, service_role;

CREATE POLICY "business_docs_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-docs' AND public.is_business_member(auth.uid()));
CREATE POLICY "business_docs_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-docs' AND public.is_business_member(auth.uid()));
CREATE POLICY "business_docs_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-docs' AND public.is_business_member(auth.uid()))
  WITH CHECK (bucket_id = 'business-docs' AND public.is_business_member(auth.uid()));
CREATE POLICY "business_docs_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'business-docs' AND public.is_business_head(auth.uid()));