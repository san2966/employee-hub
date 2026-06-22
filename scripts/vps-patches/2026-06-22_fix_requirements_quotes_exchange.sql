-- ============================================================================
--  VPS DB Patch — 2026-06-22
--  Fixes:
--   1) requirements: backfill legacy JSON-blob description into proper columns
--      so existing rows render correctly on Employee + Director pages.
--      (Code fix removes the broken PostgREST FK join that caused 400.)
--   3) purchase_quotes: confirm permissive RLS so Director can read & update.
--      (Buttons rendering fix is in the React code.)
--   2) leave_requests / exchange leaves: no DB change needed — balance is now
--      computed client-side from approved add-leaves minus taken leaves.
--
--  RUN ON VPS:
--    psql -h localhost -U postgres -d postgres \
--         -f scripts/vps-patches/2026-06-22_fix_requirements_quotes_exchange.sql
-- ============================================================================

BEGIN;

-- 1) Backfill legacy JSON-blob requirements --------------------------------
UPDATE public.requirements r
SET why_needed    = COALESCE(NULLIF(r.why_needed,''),   sub.j->>'whyNeeded'),
    link_url      = COALESCE(NULLIF(r.link_url,''),     sub.j->>'link'),
    expected_cost = COALESCE(r.expected_cost,           NULLIF(sub.j->>'expectedCost','')::numeric),
    description   = COALESCE(sub.j->>'description',     r.description)
FROM (
  SELECT id,
         CASE WHEN description ~ '^\s*\{.*\}\s*$'
              THEN description::jsonb ELSE NULL END AS j
  FROM public.requirements
) sub
WHERE sub.id = r.id AND sub.j IS NOT NULL;

-- 3) Make sure Director can read & update purchase_quotes ------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_quotes TO authenticated;
GRANT ALL                            ON public.purchase_quotes TO service_role;

DROP POLICY IF EXISTS purchase_quotes_select ON public.purchase_quotes;
DROP POLICY IF EXISTS purchase_quotes_update ON public.purchase_quotes;
CREATE POLICY purchase_quotes_select ON public.purchase_quotes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY purchase_quotes_update ON public.purchase_quotes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Also make sure requirements grants / select are wide open for authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirements TO authenticated;
GRANT ALL                            ON public.requirements TO service_role;

DROP POLICY IF EXISTS requirements_select ON public.requirements;
CREATE POLICY requirements_select ON public.requirements
  FOR SELECT TO authenticated USING (true);

COMMIT;

-- Verification
SELECT id, title, why_needed, link_url, expected_cost
  FROM public.requirements ORDER BY created_at DESC LIMIT 5;
SELECT id, quote_id, status FROM public.purchase_quotes ORDER BY created_at DESC LIMIT 5;
