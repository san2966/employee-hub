-- ============ ENUM ============
DO $$ BEGIN
  CREATE TYPE public.business_designation AS ENUM ('business_head','director','area_sales_manager','business_development_manager','rc_technical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ AREAS ============
CREATE TABLE public.business_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district text NOT NULL,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_areas TO authenticated;
GRANT ALL ON public.business_areas TO service_role;
ALTER TABLE public.business_areas ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES ============
CREATE TABLE public.business_profiles (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_profiles TO authenticated;
GRANT ALL ON public.business_profiles TO service_role;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.business_designation_of(_uid uuid)
RETURNS public.business_designation
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT designation FROM public.business_profiles WHERE user_id = _uid AND is_active LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.is_business_member(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.business_profiles WHERE user_id = _uid AND is_active) $$;

CREATE OR REPLACE FUNCTION public.is_business_head(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.business_profiles WHERE user_id = _uid AND is_active AND designation = 'business_head') $$;

CREATE OR REPLACE FUNCTION public.business_profile_id_of(_uid uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.business_profiles WHERE user_id = _uid LIMIT 1 $$;

-- Areas policies
CREATE POLICY "areas_select" ON public.business_areas FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
CREATE POLICY "areas_write" ON public.business_areas FOR ALL TO authenticated
  USING (public.is_business_head(auth.uid())) WITH CHECK (public.is_business_head(auth.uid()));

-- Profiles policies
CREATE POLICY "profiles_select" ON public.business_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_business_member(auth.uid()));
CREATE POLICY "profiles_self_update" ON public.business_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_head_write" ON public.business_profiles FOR ALL TO authenticated
  USING (public.is_business_head(auth.uid())) WITH CHECK (public.is_business_head(auth.uid()));

-- ============ TELEPHONIC FOLLOWUPS ============
CREATE TABLE public.business_followups (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_followups TO authenticated;
GRANT ALL ON public.business_followups TO service_role;
ALTER TABLE public.business_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followups_select" ON public.business_followups FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
CREATE POLICY "followups_insert" ON public.business_followups FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
CREATE POLICY "followups_update" ON public.business_followups FOR UPDATE TO authenticated
  USING (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director')
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
CREATE POLICY "followups_delete" ON public.business_followups FOR DELETE TO authenticated USING (public.is_business_head(auth.uid()));

-- ============ OPPORTUNITIES / LEADS ============
CREATE TABLE public.business_opportunities (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_opportunities TO authenticated;
GRANT ALL ON public.business_opportunities TO service_role;
ALTER TABLE public.business_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opps_select" ON public.business_opportunities FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
CREATE POLICY "opps_insert" ON public.business_opportunities FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
CREATE POLICY "opps_update" ON public.business_opportunities FOR UPDATE TO authenticated
  USING (public.is_business_head(auth.uid()) OR (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director' AND public.business_profile_id_of(auth.uid()) = ANY (assignee_ids)))
  WITH CHECK (public.is_business_head(auth.uid()) OR (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director' AND public.business_profile_id_of(auth.uid()) = ANY (assignee_ids)));
CREATE POLICY "opps_delete" ON public.business_opportunities FOR DELETE TO authenticated USING (public.is_business_head(auth.uid()));

-- ============ ACTIVITIES ============
CREATE TABLE public.business_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.business_opportunities(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'Follow-up',
  description text NOT NULL,
  scheduled_at timestamptz,
  actor_name text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_activities TO authenticated;
GRANT ALL ON public.business_activities TO service_role;
ALTER TABLE public.business_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acts_select" ON public.business_activities FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
CREATE POLICY "acts_insert" ON public.business_activities FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');
CREATE POLICY "acts_delete" ON public.business_activities FOR DELETE TO authenticated USING (public.is_business_head(auth.uid()));

-- ============ TASKS ============
CREATE TABLE public.business_tasks (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_tasks TO authenticated;
GRANT ALL ON public.business_tasks TO service_role;
ALTER TABLE public.business_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "btasks_select" ON public.business_tasks FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
CREATE POLICY "btasks_head_write" ON public.business_tasks FOR ALL TO authenticated
  USING (public.is_business_head(auth.uid())) WITH CHECK (public.is_business_head(auth.uid()));
CREATE POLICY "btasks_assignee_update" ON public.business_tasks FOR UPDATE TO authenticated
  USING (public.business_profile_id_of(auth.uid()) = ANY (assignee_ids))
  WITH CHECK (public.business_profile_id_of(auth.uid()) = ANY (assignee_ids));

CREATE TABLE public.business_task_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.business_tasks(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  reporter_name text,
  report text NOT NULL,
  status text NOT NULL DEFAULT 'Completed',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_task_reports TO authenticated;
GRANT ALL ON public.business_task_reports TO service_role;
ALTER TABLE public.business_task_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "btreports_select" ON public.business_task_reports FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
CREATE POLICY "btreports_insert" ON public.business_task_reports FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "btreports_update" ON public.business_task_reports FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- ============ WEEKLY PLAN ============
CREATE TABLE public.business_weekly_plans (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_weekly_plans TO authenticated;
GRANT ALL ON public.business_weekly_plans TO service_role;
ALTER TABLE public.business_weekly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wplans_select" ON public.business_weekly_plans FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
CREATE POLICY "wplans_head_write" ON public.business_weekly_plans FOR ALL TO authenticated
  USING (public.is_business_head(auth.uid())) WITH CHECK (public.is_business_head(auth.uid()));

CREATE TABLE public.business_employee_plans (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_employee_plans TO authenticated;
GRANT ALL ON public.business_employee_plans TO service_role;
ALTER TABLE public.business_employee_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eplans_select" ON public.business_employee_plans FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
CREATE POLICY "eplans_self_write" ON public.business_employee_plans FOR ALL TO authenticated
  USING (profile_id = public.business_profile_id_of(auth.uid()) OR public.is_business_head(auth.uid()))
  WITH CHECK (profile_id = public.business_profile_id_of(auth.uid()) OR public.is_business_head(auth.uid()));

-- ============ RC TRACKER ============
CREATE TABLE public.business_rc_tracker (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_rc_tracker TO authenticated;
GRANT ALL ON public.business_rc_tracker TO service_role;
ALTER TABLE public.business_rc_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rct_select" ON public.business_rc_tracker FOR SELECT TO authenticated USING (public.is_business_member(auth.uid()));
CREATE POLICY "rct_write" ON public.business_rc_tracker FOR ALL TO authenticated
  USING (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director')
  WITH CHECK (public.is_business_member(auth.uid()) AND public.business_designation_of(auth.uid()) <> 'director');

-- ============ TRIGGERS ============
CREATE TRIGGER trg_business_areas_updated BEFORE UPDATE ON public.business_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_business_profiles_updated BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_business_followups_updated BEFORE UPDATE ON public.business_followups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_business_opportunities_updated BEFORE UPDATE ON public.business_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_business_tasks_updated BEFORE UPDATE ON public.business_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_business_weekly_plans_updated BEFORE UPDATE ON public.business_weekly_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_business_employee_plans_updated BEFORE UPDATE ON public.business_employee_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_business_rc_updated BEFORE UPDATE ON public.business_rc_tracker FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INDEXES ============
CREATE INDEX idx_business_opps_lead ON public.business_opportunities (is_lead, created_at DESC);
CREATE INDEX idx_business_acts_opp ON public.business_activities (opportunity_id, created_at DESC);
CREATE INDEX idx_business_tasks_due ON public.business_tasks (due_date);
CREATE INDEX idx_business_wplans_week ON public.business_weekly_plans (week_start, plan_date);