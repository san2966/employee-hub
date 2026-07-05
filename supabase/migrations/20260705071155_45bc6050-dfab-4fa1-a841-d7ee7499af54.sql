
-- 1) contacts: added_by
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS added_by text;

-- 2) tasks: employee report on completion
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS report text;

-- 3) Operations Outward Management
CREATE TABLE IF NOT EXISTS public.operations_outwards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id text,
  type text NOT NULL,
  employee_name text NOT NULL,
  organization_name text NOT NULL,
  subject text NOT NULL,
  additional_documents text[] DEFAULT '{}',
  outward_date date,
  file_url text,
  status text NOT NULL DEFAULT 'Submitted',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operations_outwards TO authenticated;
GRANT ALL ON public.operations_outwards TO service_role;
ALTER TABLE public.operations_outwards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ops_outwards_all" ON public.operations_outwards;
CREATE POLICY "ops_outwards_all" ON public.operations_outwards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'operations') OR public.has_role(auth.uid(), 'director'))
  WITH CHECK (public.has_role(auth.uid(), 'operations') OR public.has_role(auth.uid(), 'director'));

DROP TRIGGER IF EXISTS trg_operations_outwards_updated ON public.operations_outwards;
CREATE TRIGGER trg_operations_outwards_updated
  BEFORE UPDATE ON public.operations_outwards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.operations_outwards;
