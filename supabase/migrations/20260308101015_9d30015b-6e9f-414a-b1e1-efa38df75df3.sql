-- Drop the old restrictive CHECK constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Add updated CHECK constraint with all roles
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role = ANY (ARRAY['director'::text, 'hr'::text, 'accounts'::text, 'admin'::text, 'ithead'::text, 'employee'::text, 'tender_head'::text, 'tender_executive'::text, 'purchase'::text, 'operations'::text]));
