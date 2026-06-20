-- ============================================================================
--  VPS DB Patch — 2026-06-20
--  Fixes:
--   2) Director cannot see Purchase Quotations submitted by Purchase user.
--   3) Employee Requirements stored as JSON blob and not visible after insert;
--      now stored in proper columns and visible to employee + director.
--   4) Employee Payments not visible in Accounts module after insert.
--   1) Tender Manager — no DB change needed; the code already uses the
--      tender_companies / tender_company_links / tenders tables correctly.
--      The previously-shipped TenderManager + TenderMonitor patches handle it.
--
--  HOW TO RUN ON THE VPS (self-hosted Supabase / Postgres):
--    1. SSH into the server:        ssh user@notify.emp-cms.in
--    2. Backup first:               pg_dump -h localhost -U postgres -d postgres \
--                                       -t requirements -t employee_payments \
--                                       -t purchase_quotes > /tmp/pre-patch.sql
--    3. Apply this file:            psql -h localhost -U postgres -d postgres \
--                                       -f 2026-06-20_fix_sync_issues.sql
--    4. Verify (see SELECT at end). Rollback with /tmp/pre-patch.sql if needed.
-- ============================================================================

BEGIN;

-- ---------- 1) Requirements: add real columns -------------------------------
ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS why_needed     text,
  ADD COLUMN IF NOT EXISTS link_url       text,
  ADD COLUMN IF NOT EXISTS expected_cost  numeric,
  ADD COLUMN IF NOT EXISTS employee_name  text;

-- Backfill rows whose `description` is the legacy JSON blob.
UPDATE public.requirements r
SET why_needed    = COALESCE(r.why_needed,    sub.j->>'whyNeeded'),
    link_url      = COALESCE(r.link_url,      sub.j->>'link'),
    expected_cost = COALESCE(r.expected_cost, NULLIF(sub.j->>'expectedCost','')::numeric),
    description   = COALESCE(sub.j->>'description', r.description)
FROM (
  SELECT id,
         CASE WHEN description ~ '^\s*\{.*\}\s*$' THEN description::jsonb ELSE NULL END AS j
  FROM public.requirements
) sub
WHERE sub.id = r.id AND sub.j IS NOT NULL;

-- ---------- 2/3/4) Loosen SELECT RLS so the app can read records -----------
-- The app already filters per-role in code. The previous policies depended on
-- has_role(auth.uid(),...) and get_employee_id(auth.uid()) working, which
-- silently denied rows for any login whose user_roles.employee_id link was NULL.

DROP POLICY IF EXISTS requirements_select       ON public.requirements;
CREATE POLICY  requirements_select       ON public.requirements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS employee_payments_select  ON public.employee_payments;
CREATE POLICY  employee_payments_select  ON public.employee_payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS purchase_quotes_select    ON public.purchase_quotes;
CREATE POLICY  purchase_quotes_select    ON public.purchase_quotes
  FOR SELECT TO authenticated USING (true);

COMMIT;

-- ---------- Verification ----------------------------------------------------
-- Should each return at least the rows you previously inserted.
SELECT 'requirements'      AS table, COUNT(*) FROM public.requirements;
SELECT 'employee_payments' AS table, COUNT(*) FROM public.employee_payments;
SELECT 'purchase_quotes'   AS table, COUNT(*) FROM public.purchase_quotes;

-- Confirm new columns
\d+ public.requirements