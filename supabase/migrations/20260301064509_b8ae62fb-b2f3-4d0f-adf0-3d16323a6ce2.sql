
-- =============================================
-- TENDER MODULE - Phase 1: Database Schema
-- =============================================

-- 1. Tender Companies (Company Manager)
CREATE TABLE public.tender_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  director_name TEXT NOT NULL,
  address TEXT NOT NULL,
  gst_number TEXT NOT NULL,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tender roles can view companies"
  ON public.tender_companies FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive', 'director')
  ));

CREATE POLICY "Tender head can manage companies"
  ON public.tender_companies FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'tender_head'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'tender_head'
  ));

-- 2. Tender Products (Product Manager)
CREATE TABLE public.tender_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  image_url TEXT,
  specification TEXT,
  atc_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tender roles can view products"
  ON public.tender_products FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive', 'director')
  ));

CREATE POLICY "Tender roles can manage products"
  ON public.tender_products FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

-- 3. Tender Documents (Bids / Documents Manager)
CREATE TABLE public.tender_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_number TEXT NOT NULL,
  bid_date DATE NOT NULL,
  organization TEXT NOT NULL,
  product TEXT NOT NULL,
  description TEXT NOT NULL,
  pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tender roles can view documents"
  ON public.tender_documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive', 'director')
  ));

CREATE POLICY "Tender head can manage documents"
  ON public.tender_documents FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'tender_head'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'tender_head'
  ));

-- 4. Tenders (Tender Manager - main entity)
CREATE TABLE public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.tender_documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','technical_pending','technical_done','financial_pending','financial_done','completed','cancelled')),
  technical_opening_date DATE,
  financial_opening_date DATE,
  emd BOOLEAN DEFAULT false,
  bg BOOLEAN DEFAULT false,
  dd BOOLEAN DEFAULT false,
  epbg BOOLEAN DEFAULT false,
  gras BOOLEAN DEFAULT false,
  emd_doc_url TEXT,
  bg_doc_url TEXT,
  dd_doc_url TEXT,
  epbg_doc_url TEXT,
  gras_doc_url TEXT,
  work_order_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tender roles can view tenders"
  ON public.tenders FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive', 'director')
  ));

CREATE POLICY "Tender head can manage tenders"
  ON public.tenders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'tender_head'
  ));

CREATE POLICY "Tender roles can update tenders"
  ON public.tenders FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

CREATE POLICY "Tender head can delete tenders"
  ON public.tenders FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'tender_head'
  ));

-- 5. Tender-Company junction (companies participating in a tender)
CREATE TABLE public.tender_company_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.tender_companies(id) ON DELETE CASCADE,
  technical_status TEXT DEFAULT 'pending' CHECK (technical_status IN ('pending','accepted','rejected')),
  financial_status TEXT DEFAULT 'pending' CHECK (financial_status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tender_id, company_id)
);

ALTER TABLE public.tender_company_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tender roles can view links"
  ON public.tender_company_links FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive', 'director')
  ));

CREATE POLICY "Tender roles can manage links"
  ON public.tender_company_links FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

-- 6. Tender Tasks
CREATE TABLE public.tender_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_by TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  task_title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  report TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tender roles can view tasks"
  ON public.tender_tasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

CREATE POLICY "Tender roles can manage tasks"
  ON public.tender_tasks FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

-- 7. Tender Research & Analysis
CREATE TABLE public.tender_research (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  tender_id_ref TEXT NOT NULL,
  tender_number TEXT NOT NULL,
  organization TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2),
  open_date DATE,
  close_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tender roles can view research"
  ON public.tender_research FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

CREATE POLICY "Tender roles can manage research"
  ON public.tender_research FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

-- 8. Tender Contacts
CREATE TABLE public.tender_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  designation TEXT,
  department TEXT,
  organization TEXT,
  email TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tender roles can view contacts"
  ON public.tender_contacts FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

CREATE POLICY "Tender roles can manage contacts"
  ON public.tender_contacts FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

-- 9. Tender Reminders (Dashboard)
CREATE TABLE public.tender_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
  ON public.tender_reminders FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 10. Tender Notes (Dashboard sticky notes)
CREATE TABLE public.tender_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
  ON public.tender_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. Tender Settings (per-user profile)
CREATE TABLE public.tender_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  mobile TEXT,
  designation TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.tender_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update timestamp triggers
CREATE TRIGGER update_tender_companies_updated_at BEFORE UPDATE ON public.tender_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tender_products_updated_at BEFORE UPDATE ON public.tender_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tender_documents_updated_at BEFORE UPDATE ON public.tender_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON public.tenders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tender_tasks_updated_at BEFORE UPDATE ON public.tender_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tender_contacts_updated_at BEFORE UPDATE ON public.tender_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tender_settings_updated_at BEFORE UPDATE ON public.tender_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_documents;
