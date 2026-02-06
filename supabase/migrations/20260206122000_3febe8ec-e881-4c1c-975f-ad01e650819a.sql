-- Enable pgcrypto in extensions schema (Supabase standard)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create password verification function using extensions.crypt
CREATE OR REPLACE FUNCTION public.verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT stored_hash = extensions.crypt(input_password, stored_hash);
$$;