-- =====================================================================
-- Business module repair patch (idempotent, safe to re-run)
-- Fixes: ERROR 42883 function public.is_business_member(uuid) does not exist
-- Cause: helper functions were never created (client split the $$ blocks),
--        so every business_* RLS policy referencing them failed.
-- Run:  psql -U postgres -d postgres -f 2026-08-20_business_helpers_repair.sql
-- =====================================================================
BEGIN;

-- 1) ENUM ---------------------------------------------------------------
DO $enum$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_designation') THEN
    CREATE TYPE public.business_designation AS ENUM
      ('business_head','director','area_sales_manager','business_development_manager','rc_technical');
  END IF;
END
$enum$;

-- 2) BASE TABLES the helpers depend on ----------------------------------
CREATE TABLE IF NOT EXISTS public.business_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district text NOT NULL,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  designation public.business_designation NOT NULL,
  area_id uuid REFERENCES public.business_areas(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) HELPER FUNCTIONS ---------------------------------------------------
-- Some older VPS installations created user_id/created_by/assignee_ids as
-- text.  Compare identifiers as text at the RLS boundary so this repair can
-- run safely against both the legacy schema and the current UUID schema.
CREATE OR REPLACE FUNCTION public.business_designation_of(_uid uuid)
RETURNS public.business_designation
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn_desig$
  SELECT designation::text::public.business_designation
  FROM public.business_profiles
  WHERE user_id::text = _uid::text AND is_active
  LIMIT 1
$fn_desig$;

CREATE OR REPLACE FUNCTION public.is_business_member(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn_member$
  SELECT EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE user_id::text = _uid::text AND is_active
  )
$fn_member$;

CREATE OR REPLACE FUNCTION public.is_business_head(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn_head$
  SELECT EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE user_id::text = _uid::text
      AND is_active
      AND designation::text = 'business_head'
  )
$fn_head$;

CREATE OR REPLACE FUNCTION public.business_profile_id_of(_uid uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn_pid$
  SELECT id::text::uuid
  FROM public.business_profiles
  WHERE user_id::text = _uid::text
  LIMIT 1
$fn_pid$;

GRANT EXECUTE ON FUNCTION public.business_designation_of(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid)      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_business_head(uuid)        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.business_profile_id_of(uuid)  TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.business_designation_of(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_business_head(uuid)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.business_profile_id_of(uuid)  FROM PUBLIC, anon;

-- 4) REMAINING TABLES ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_name text NOT NULL,
  organization text NOT NULL,
  contact text NOT NULL,
  customer_type text NOT NULL DEFAULT 'New',
  called_on date NOT NULL DEFAULT CURRENT_DATE,
  outcome text NOT NULL DEFAULT 'Connected',
  is_opportunity boolean NOT NULL DEFAULT false,
  review_status text NOT NULL DEFAULT 'Pending',
  review_note text,
  caller_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  caller_name text,
  next_action_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  organization_name text NOT NULL,
  officer_name text NOT NULL,
  organization_type text,
  phone text,
  email text,
  source text NOT NULL DEFAULT 'Call',
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'New',
  assignee_ids uuid[] NOT NULL DEFAULT '{}',
  description text,
  next_followup_at timestamptz,
  is_lead boolean NOT NULL DEFAULT false,
  converted_at timestamptz,
  conversion_doc_url text,
  created_by uuid,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.business_opportunities(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'Follow-up',
  description text NOT NULL,
  scheduled_at timestamptz,
  actor_name text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  opportunity_id uuid REFERENCES public.business_opportunities(id) ON DELETE SET NULL,
  assignee_ids uuid[] NOT NULL DEFAULT '{}',
  due_date date,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Pending',
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_task_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.business_tasks(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  reporter_name text,
  report text NOT NULL,
  status text NOT NULL DEFAULT 'Completed',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_weekly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  plan_date date NOT NULL,
  visit_plan text NOT NULL,
  plan_status text NOT NULL DEFAULT 'Tentative',
  assignee_ids uuid[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_employee_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  submitted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, week_start)
);

CREATE TABLE IF NOT EXISTS public.business_rc_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL,
  location_name text NOT NULL,
  operator_name text,
  contact text,
  last_contacted date,
  status text NOT NULL DEFAULT 'Pending',
  remarks text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_rc_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id uuid REFERENCES public.business_rc_tracker(id) ON DELETE CASCADE,
  organization_name text,
  location_name text,
  operator_name text,
  contact text,
  called_on date NOT NULL DEFAULT CURRENT_DATE,
  outcome text NOT NULL DEFAULT 'Connected',
  remarks text,
  next_action_at timestamptz,
  caller_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  caller_name text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) GRANTS + RLS -------------------------------------------------------
DO $grants$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'business_areas','business_profiles','business_followups','business_opportunities',
    'business_activities','business_tasks','business_task_reports','business_weekly_plans',
    'business_employee_plans','business_rc_tracker','business_rc_calls'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$grants$;

-- Reconnect an existing Business Head profile to the matching Auth user.
-- This repairs the common state where seed_head previously saw the email and
-- returned early even though business_profiles.user_id held an old user UUID.
DO $repair_head$
DECLARE
  user_id_type text;
BEGIN
  SELECT c.udt_name INTO user_id_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'business_profiles'
    AND c.column_name = 'user_id';

  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = 'business-head@vmcc-india.com'
  ) THEN
    IF user_id_type = 'uuid' THEN
      UPDATE public.business_profiles bp
      SET user_id = au.id,
          is_active = true,
          must_change_password = false,
          updated_at = now()
      FROM auth.users au
      WHERE lower(bp.email) = 'business-head@vmcc-india.com'
        AND lower(au.email) = 'business-head@vmcc-india.com';
    ELSE
      UPDATE public.business_profiles bp
      SET user_id = au.id::text,
          is_active = true,
          must_change_password = false,
          updated_at = now()
      FROM auth.users au
      WHERE lower(bp.email) = 'business-head@vmcc-india.com'
        AND lower(au.email) = 'business-head@vmcc-india.com';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE lower(email) = 'business-head@vmcc-india.com'
    ) THEN
      IF user_id_type = 'uuid' THEN
        INSERT INTO public.business_profiles
          (user_id, name, email, designation, is_active, must_change_password)
        SELECT id, 'Business Head', 'business-head@vmcc-india.com',
               'business_head', true, false
        FROM auth.users
        WHERE lower(email) = 'business-head@vmcc-india.com'
        LIMIT 1;
      ELSE
        INSERT INTO public.business_profiles
          (user_id, name, email, designation, is_active, must_change_password)
        SELECT id::text, 'Business Head', 'business-head@vmcc-india.com',
               'business_head', true, false
        FROM auth.users
        WHERE lower(email) = 'business-head@vmcc-india.com'
        LIMIT 1;
      END IF;
    END IF;
  END IF;
END
$repair_head$;

-- 6) POLICIES (drop-then-create so re-runs are clean) -------------------
DROP POLICY IF EXISTS "areas_select" ON public.business_areas;
CREATE POLICY "areas_select" ON public.business_areas FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "areas_write" ON public.business_areas;
CREATE POLICY "areas_write" ON public.business_areas FOR ALL TO authenticated
  USING (public.is_business_head(auth.uid())) WITH CHECK (public.is_business_head(auth.uid()));

DROP POLICY IF EXISTS "profiles_select" ON public.business_profiles;
CREATE POLICY "profiles_select" ON public.business_profiles FOR SELECT TO authenticated
  USING (user_id::text = auth.uid()::text OR public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "profiles_self_update" ON public.business_profiles;
CREATE POLICY "profiles_self_update" ON public.business_profiles FOR UPDATE TO authenticated
  USING (user_id::text = auth.uid()::text) WITH CHECK (user_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "profiles_head_write" ON public.business_profiles;
CREATE POLICY "profiles_head_write" ON public.business_profiles FOR ALL TO authenticated
  USING (public.is_business_head(auth.uid())) WITH CHECK (public.is_business_head(auth.uid()));

DROP POLICY IF EXISTS "followups_select" ON public.business_followups;
CREATE POLICY "followups_select" ON public.business_followups FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "followups_insert" ON public.business_followups;
CREATE POLICY "followups_insert" ON public.business_followups FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
DROP POLICY IF EXISTS "followups_update" ON public.business_followups;
CREATE POLICY "followups_update" ON public.business_followups FOR UPDATE TO authenticated
  USING (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director')
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
DROP POLICY IF EXISTS "followups_delete" ON public.business_followups;
CREATE POLICY "followups_delete" ON public.business_followups FOR DELETE TO authenticated USING (public.is_business_head(auth.uid()));

DROP POLICY IF EXISTS "opps_select" ON public.business_opportunities;
CREATE POLICY "opps_select" ON public.business_opportunities FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "opps_insert" ON public.business_opportunities;
CREATE POLICY "opps_insert" ON public.business_opportunities FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
DROP POLICY IF EXISTS "opps_update" ON public.business_opportunities;
CREATE POLICY "opps_update" ON public.business_opportunities FOR UPDATE TO authenticated
  USING (public.is_business_head(auth.uid()) OR (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director' AND EXISTS (SELECT 1 FROM unnest(assignee_ids) assigned_id WHERE assigned_id::text = public.business_profile_id_of(auth.uid())::text)))
  WITH CHECK (public.is_business_head(auth.uid()) OR (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director' AND EXISTS (SELECT 1 FROM unnest(assignee_ids) assigned_id WHERE assigned_id::text = public.business_profile_id_of(auth.uid())::text)));
DROP POLICY IF EXISTS "opps_delete" ON public.business_opportunities;
CREATE POLICY "opps_delete" ON public.business_opportunities FOR DELETE TO authenticated USING (public.is_business_head(auth.uid()));

DROP POLICY IF EXISTS "acts_select" ON public.business_activities;
CREATE POLICY "acts_select" ON public.business_activities FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "acts_insert" ON public.business_activities;
CREATE POLICY "acts_insert" ON public.business_activities FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
DROP POLICY IF EXISTS "acts_delete" ON public.business_activities;
CREATE POLICY "acts_delete" ON public.business_activities FOR DELETE TO authenticated USING (public.is_business_head(auth.uid()));

DROP POLICY IF EXISTS "btasks_select" ON public.business_tasks;
CREATE POLICY "btasks_select" ON public.business_tasks FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "btasks_head_write" ON public.business_tasks;
CREATE POLICY "btasks_head_write" ON public.business_tasks FOR ALL TO authenticated
  USING (public.is_business_head(auth.uid())) WITH CHECK (public.is_business_head(auth.uid()));
DROP POLICY IF EXISTS "btasks_assignee_update" ON public.business_tasks;
CREATE POLICY "btasks_assignee_update" ON public.business_tasks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM unnest(assignee_ids) assigned_id WHERE assigned_id::text = public.business_profile_id_of(auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM unnest(assignee_ids) assigned_id WHERE assigned_id::text = public.business_profile_id_of(auth.uid())::text));
DROP POLICY IF EXISTS "btasks_member_insert" ON public.business_tasks;
CREATE POLICY "btasks_member_insert" ON public.business_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
DROP POLICY IF EXISTS "btasks_owner_delete" ON public.business_tasks;
CREATE POLICY "btasks_owner_delete" ON public.business_tasks FOR DELETE TO authenticated
  USING (created_by::text = auth.uid()::text OR public.is_business_head(auth.uid()));

DROP POLICY IF EXISTS "btreports_select" ON public.business_task_reports;
CREATE POLICY "btreports_select" ON public.business_task_reports FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "btreports_insert" ON public.business_task_reports;
CREATE POLICY "btreports_insert" ON public.business_task_reports FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND created_by::text = auth.uid()::text);
DROP POLICY IF EXISTS "btreports_update" ON public.business_task_reports;
CREATE POLICY "btreports_update" ON public.business_task_reports FOR UPDATE TO authenticated
  USING (created_by::text = auth.uid()::text) WITH CHECK (created_by::text = auth.uid()::text);

DROP POLICY IF EXISTS "wplans_select" ON public.business_weekly_plans;
CREATE POLICY "wplans_select" ON public.business_weekly_plans FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "wplans_head_write" ON public.business_weekly_plans;
CREATE POLICY "wplans_head_write" ON public.business_weekly_plans FOR ALL TO authenticated
  USING (public.is_business_head(auth.uid())) WITH CHECK (public.is_business_head(auth.uid()));

DROP POLICY IF EXISTS "eplans_select" ON public.business_employee_plans;
CREATE POLICY "eplans_select" ON public.business_employee_plans FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "eplans_self_write" ON public.business_employee_plans;
CREATE POLICY "eplans_self_write" ON public.business_employee_plans FOR ALL TO authenticated
  USING (profile_id::text = public.business_profile_id_of(auth.uid())::text OR public.is_business_head(auth.uid()))
  WITH CHECK (profile_id::text = public.business_profile_id_of(auth.uid())::text OR public.is_business_head(auth.uid()));

DROP POLICY IF EXISTS "rct_select" ON public.business_rc_tracker;
CREATE POLICY "rct_select" ON public.business_rc_tracker FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "rct_write" ON public.business_rc_tracker;
CREATE POLICY "rct_write" ON public.business_rc_tracker FOR ALL TO authenticated
  USING (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director')
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');

DROP POLICY IF EXISTS "rccalls_select" ON public.business_rc_calls;
CREATE POLICY "rccalls_select" ON public.business_rc_calls FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
DROP POLICY IF EXISTS "rccalls_insert" ON public.business_rc_calls;
CREATE POLICY "rccalls_insert" ON public.business_rc_calls FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
DROP POLICY IF EXISTS "rccalls_update" ON public.business_rc_calls;
CREATE POLICY "rccalls_update" ON public.business_rc_calls FOR UPDATE TO authenticated
  USING (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director')
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');

-- 7) TRIGGERS + INDEXES -------------------------------------------------
DO $trg$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'business_areas','business_profiles','business_followups','business_opportunities',
    'business_tasks','business_weekly_plans','business_employee_plans','business_rc_tracker','business_rc_calls'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END
$trg$;

CREATE INDEX IF NOT EXISTS idx_business_opps_lead   ON public.business_opportunities (is_lead, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_acts_opp    ON public.business_activities (opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_tasks_due   ON public.business_tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_business_wplans_week ON public.business_weekly_plans (week_start, plan_date);

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Verification output: all values should be true and the UUIDs should match.
SELECT
  to_regprocedure('public.is_business_member(uuid)') IS NOT NULL AS member_helper_exists,
  to_regprocedure('public.is_business_head(uuid)') IS NOT NULL AS head_helper_exists,
  has_table_privilege('authenticated', 'public.business_profiles', 'SELECT') AS profile_select_granted;

SELECT
  au.id AS auth_user_id,
  bp.user_id::text AS profile_user_id,
  bp.is_active,
  bp.designation::text AS designation,
  (bp.user_id::text = au.id::text) AS mapping_matches
FROM auth.users au
LEFT JOIN public.business_profiles bp
  ON lower(bp.email) = lower(au.email)
WHERE lower(au.email) = 'business-head@vmcc-india.com';
