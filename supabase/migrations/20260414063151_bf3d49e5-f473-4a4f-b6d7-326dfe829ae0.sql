
-- Explicitly deny INSERT/UPDATE/DELETE on user_roles for authenticated users
-- Only service_role (edge functions) should write to this table
CREATE POLICY "user_roles_no_insert" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "user_roles_no_update" ON public.user_roles
FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "user_roles_no_delete" ON public.user_roles
FOR DELETE TO authenticated
USING (false);

-- Add missing UPDATE policy for operations-files storage bucket
CREATE POLICY "ops_files_update_auth"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'operations-files' AND has_role(auth.uid(), 'operations'::text));
