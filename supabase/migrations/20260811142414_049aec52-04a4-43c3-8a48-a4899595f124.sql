ALTER TABLE public.business_rc_tracker ADD COLUMN IF NOT EXISTS rc_code text;

CREATE TABLE public.business_rc_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rc_id uuid NOT NULL REFERENCES public.business_rc_tracker(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Connected',
  craft_operational text,
  battery_run_time text,
  charging_socket text,
  proper_storage text,
  rescue_remote text,
  emergency_ready text,
  output text,
  caller_name text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_rc_calls TO authenticated;
GRANT ALL ON public.business_rc_calls TO service_role;

ALTER TABLE public.business_rc_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can view rc calls"
ON public.business_rc_calls FOR SELECT TO authenticated
USING (public.is_business_member(auth.uid()));

CREATE POLICY "Business members can add rc calls"
ON public.business_rc_calls FOR INSERT TO authenticated
WITH CHECK (public.is_business_member(auth.uid()));

CREATE POLICY "Business members can update rc calls"
ON public.business_rc_calls FOR UPDATE TO authenticated
USING (public.is_business_member(auth.uid()))
WITH CHECK (public.is_business_member(auth.uid()));

CREATE TRIGGER trg_business_rc_calls_updated
BEFORE UPDATE ON public.business_rc_calls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();