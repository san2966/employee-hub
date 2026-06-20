
-- 1) Add proper columns to requirements
ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS why_needed     text,
  ADD COLUMN IF NOT EXISTS link_url       text,
  ADD COLUMN IF NOT EXISTS expected_cost  numeric,
  ADD COLUMN IF NOT EXISTS employee_name  text;

-- 2) Backfill rows that stored JSON inside description
UPDATE public.requirements r
SET why_needed   = COALESCE(r.why_needed,   sub.j->>'whyNeeded'),
    link_url     = COALESCE(r.link_url,     sub.j->>'link'),
    expected_cost = COALESCE(r.expected_cost, NULLIF(sub.j->>'expectedCost','')::numeric),
    description  = COALESCE(sub.j->>'description', r.description)
FROM (
  SELECT id,
    CASE WHEN description ~ '^\s*\{.*\}\s*$' THEN description::jsonb ELSE NULL END AS j
  FROM public.requirements
) sub
WHERE sub.id = r.id AND sub.j IS NOT NULL;

-- 3) Loosen SELECT policies so authenticated users can read (app filters in code).
--    This fixes the "data not visible in director / approver view" symptom that was caused
--    by auth.uid() -> user_roles.employee_id mapping not being set for some portal users.

DROP POLICY IF EXISTS requirements_select ON public.requirements;
CREATE POLICY requirements_select ON public.requirements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS employee_payments_select ON public.employee_payments;
CREATE POLICY employee_payments_select ON public.employee_payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS purchase_quotes_select ON public.purchase_quotes;
CREATE POLICY purchase_quotes_select ON public.purchase_quotes
  FOR SELECT TO authenticated USING (true);
