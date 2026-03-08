
-- Add 'operations' to portal_role enum
ALTER TYPE public.portal_role ADD VALUE IF NOT EXISTS 'operations';

-- Operations Proposals
CREATE TABLE public.operations_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id text NOT NULL,
  organization_name text NOT NULL,
  product_name text NOT NULL,
  subject text NOT NULL,
  to_sender text NOT NULL,
  file_url text,
  status text NOT NULL DEFAULT 'Pending',
  reason text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_proposals_select" ON public.operations_proposals FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'operations') OR has_role(auth.uid(), 'director'));
CREATE POLICY "ops_proposals_insert" ON public.operations_proposals FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'operations'));
CREATE POLICY "ops_proposals_update" ON public.operations_proposals FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'operations') OR has_role(auth.uid(), 'director'));
CREATE POLICY "ops_proposals_delete" ON public.operations_proposals FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'operations'));

-- Operations Brochures
CREATE TABLE public.operations_brochures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  description text,
  file_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_brochures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_brochures_all" ON public.operations_brochures FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'operations'))
  WITH CHECK (has_role(auth.uid(), 'operations'));

-- Operations Inwards
CREATE TABLE public.operations_inwards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  product_name text NOT NULL,
  organization_name text NOT NULL,
  subject text NOT NULL,
  e_office_number text,
  date date,
  file_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_inwards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_inwards_select" ON public.operations_inwards FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'operations') OR has_role(auth.uid(), 'director'));
CREATE POLICY "ops_inwards_insert" ON public.operations_inwards FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'operations'));
CREATE POLICY "ops_inwards_update" ON public.operations_inwards FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'operations'));
CREATE POLICY "ops_inwards_delete" ON public.operations_inwards FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'operations'));

-- Operations Presentations
CREATE TABLE public.operations_presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_presentations_all" ON public.operations_presentations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'operations'))
  WITH CHECK (has_role(auth.uid(), 'operations'));

-- Operations Media
CREATE TABLE public.operations_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type text NOT NULL,
  product_name text,
  description text,
  file_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_media_all" ON public.operations_media FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'operations'))
  WITH CHECK (has_role(auth.uid(), 'operations'));

-- Operations GR (Goods Receipt)
CREATE TABLE public.operations_gr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name text NOT NULL,
  title text NOT NULL,
  unique_code text NOT NULL,
  gr_date date NOT NULL,
  file_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_gr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_gr_all" ON public.operations_gr FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'operations'))
  WITH CHECK (has_role(auth.uid(), 'operations'));

-- Operations Reminders
CREATE TABLE public.operations_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date_time timestamptz NOT NULL,
  notified boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_reminders_all" ON public.operations_reminders FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'operations'))
  WITH CHECK (has_role(auth.uid(), 'operations'));

-- Operations Notes
CREATE TABLE public.operations_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_notes_all" ON public.operations_notes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'operations'))
  WITH CHECK (has_role(auth.uid(), 'operations'));

-- Operations Events (Calendar)
CREATE TABLE public.operations_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date,
  event_time time,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_events_all" ON public.operations_events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'operations'))
  WITH CHECK (has_role(auth.uid(), 'operations'));

-- Operations Settings
CREATE TABLE public.operations_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  first_name text,
  last_name text,
  mobile text,
  designation text,
  profile_photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.operations_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_settings_all" ON public.operations_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for operations files
INSERT INTO storage.buckets (id, name, public) VALUES ('operations-files', 'operations-files', false);

-- Storage policies for operations-files bucket
CREATE POLICY "ops_files_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'operations-files' AND (has_role(auth.uid(), 'operations') OR has_role(auth.uid(), 'director')));
CREATE POLICY "ops_files_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'operations-files' AND has_role(auth.uid(), 'operations'));
CREATE POLICY "ops_files_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'operations-files' AND has_role(auth.uid(), 'operations'));

-- Enable realtime for proposals (for Director sync)
ALTER PUBLICATION supabase_realtime ADD TABLE public.operations_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operations_inwards;
