CREATE OR REPLACE FUNCTION public.hash_password(raw_password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT extensions.crypt(raw_password, extensions.gen_salt('bf'));
$$;