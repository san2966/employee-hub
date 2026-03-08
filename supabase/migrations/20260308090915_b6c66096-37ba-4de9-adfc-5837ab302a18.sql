
-- purchase_projects
CREATE TABLE public.purchase_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_name text NOT NULL,
  product_name text NOT NULL,
  vendor_discussion boolean DEFAULT false,
  quotes_final boolean DEFAULT false,
  proforma_invoice boolean DEFAULT false,
  purchase_order boolean DEFAULT false,
  supply_done boolean DEFAULT false,
  installation_done boolean DEFAULT false,
  dc_report_done boolean DEFAULT false,
  training_done boolean DEFAULT false,
  progress integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'Pending',
  report text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id text NOT NULL,
  subject text NOT NULL,
  type text NOT NULL,
  file_url text,
  status text DEFAULT 'Pending',
  description text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model text NOT NULL,
  manufacturer text NOT NULL,
  image_url text,
  tech_specs_url text,
  price numeric,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_details text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  designation text,
  department text,
  organization text,
  email text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_no text NOT NULL,
  organization_name text NOT NULL,
  transporter_name text NOT NULL,
  eway_bill_no text,
  eway_bill_url text,
  vehicle_no text,
  dispatched_date date NOT NULL,
  expected_date date,
  delivered_date date,
  status text DEFAULT 'Pending',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  custom_type text,
  file_url text,
  created_by uuid,
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_work_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project_name text NOT NULL,
  organization_name text NOT NULL,
  work_order_no text NOT NULL,
  file_url text,
  created_by uuid,
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  organization_name text NOT NULL,
  work_order text,
  file_url text,
  created_by uuid,
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL,
  work_order_no text NOT NULL,
  amc boolean DEFAULT false,
  amc_start date,
  amc_end date,
  warranty_till date,
  hardware_install boolean DEFAULT false,
  software_install boolean DEFAULT false,
  product_inspection boolean DEFAULT false,
  training_done boolean DEFAULT false,
  progress integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  issue text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'Medium',
  status text DEFAULT 'Pending',
  report text,
  modified boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.purchase_settings (
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

CREATE TABLE public.purchase_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.purchase_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_work_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "purchase_projects_all" ON public.purchase_projects FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_tasks_all" ON public.purchase_tasks FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_quotes_select" ON public.purchase_quotes FOR SELECT USING (has_role(auth.uid(), 'purchase') OR has_role(auth.uid(), 'director'));
CREATE POLICY "purchase_quotes_insert" ON public.purchase_quotes FOR INSERT WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_quotes_update" ON public.purchase_quotes FOR UPDATE USING (has_role(auth.uid(), 'purchase') OR has_role(auth.uid(), 'director'));
CREATE POLICY "purchase_quotes_delete" ON public.purchase_quotes FOR DELETE USING (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_products_all" ON public.purchase_products FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_vendors_all" ON public.purchase_vendors FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_contacts_all" ON public.purchase_contacts FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_dispatches_all" ON public.purchase_dispatches FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_documents_all" ON public.purchase_documents FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_work_completions_all" ON public.purchase_work_completions FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_project_images_all" ON public.purchase_project_images FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_installations_all" ON public.purchase_installations FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_support_tickets_all" ON public.purchase_support_tickets FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));
CREATE POLICY "purchase_settings_all" ON public.purchase_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "purchase_events_all" ON public.purchase_events FOR ALL USING (has_role(auth.uid(), 'purchase')) WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('purchase-files', 'purchase-files', true);

-- Storage policies
CREATE POLICY "Purchase can view files" ON storage.objects FOR SELECT USING (bucket_id = 'purchase-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "Purchase can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'purchase-files' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('purchase', 'director')));
CREATE POLICY "Purchase can update files" ON storage.objects FOR UPDATE USING (bucket_id = 'purchase-files' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'purchase'));
CREATE POLICY "Purchase can delete files" ON storage.objects FOR DELETE USING (bucket_id = 'purchase-files' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'purchase'));

-- Portal user for CPO
INSERT INTO public.portal_users (username, password_hash, role, is_active) VALUES ('cpo@vmcc-india.com', extensions.crypt('Cpo@#100', extensions.gen_salt('bf')), 'purchase', true);

-- Enable realtime for quotes
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_quotes;
