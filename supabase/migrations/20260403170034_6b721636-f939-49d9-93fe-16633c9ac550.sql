
-- Fix tender-files storage SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view tender files" ON storage.objects;
CREATE POLICY "Tender roles can view tender files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'tender-files' AND (
    has_role(auth.uid(), 'tender_head') OR
    has_role(auth.uid(), 'tender_executive') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'accounts')
  )
);

-- Fix purchase-files storage SELECT policy
DROP POLICY IF EXISTS "Purchase can view files" ON storage.objects;
CREATE POLICY "Purchase roles can view files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'purchase-files' AND (
    has_role(auth.uid(), 'purchase') OR
    has_role(auth.uid(), 'director')
  )
);

-- Fix purchase_contacts: public -> authenticated
DROP POLICY IF EXISTS "purchase_contacts_all" ON public.purchase_contacts;
CREATE POLICY "purchase_contacts_all" ON public.purchase_contacts
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_dispatches
DROP POLICY IF EXISTS "purchase_dispatches_all" ON public.purchase_dispatches;
CREATE POLICY "purchase_dispatches_all" ON public.purchase_dispatches
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_documents
DROP POLICY IF EXISTS "purchase_documents_all" ON public.purchase_documents;
CREATE POLICY "purchase_documents_all" ON public.purchase_documents
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_events
DROP POLICY IF EXISTS "purchase_events_all" ON public.purchase_events;
CREATE POLICY "purchase_events_all" ON public.purchase_events
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_installations
DROP POLICY IF EXISTS "purchase_installations_all" ON public.purchase_installations;
CREATE POLICY "purchase_installations_all" ON public.purchase_installations
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_products
DROP POLICY IF EXISTS "purchase_products_all" ON public.purchase_products;
CREATE POLICY "purchase_products_all" ON public.purchase_products
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_project_images
DROP POLICY IF EXISTS "purchase_project_images_all" ON public.purchase_project_images;
CREATE POLICY "purchase_project_images_all" ON public.purchase_project_images
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_projects
DROP POLICY IF EXISTS "purchase_projects_all" ON public.purchase_projects;
CREATE POLICY "purchase_projects_all" ON public.purchase_projects
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_quotes (has separate policies)
DROP POLICY IF EXISTS "purchase_quotes_delete" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_insert" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_select" ON public.purchase_quotes;
DROP POLICY IF EXISTS "purchase_quotes_update" ON public.purchase_quotes;
CREATE POLICY "purchase_quotes_all" ON public.purchase_quotes
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_settings
DROP POLICY IF EXISTS "purchase_settings_all" ON public.purchase_settings;
CREATE POLICY "purchase_settings_all" ON public.purchase_settings
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix purchase_support_tickets
DROP POLICY IF EXISTS "purchase_support_tickets_all" ON public.purchase_support_tickets;
CREATE POLICY "purchase_support_tickets_all" ON public.purchase_support_tickets
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_tasks
DROP POLICY IF EXISTS "purchase_tasks_all" ON public.purchase_tasks;
CREATE POLICY "purchase_tasks_all" ON public.purchase_tasks
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_vendors
DROP POLICY IF EXISTS "purchase_vendors_all" ON public.purchase_vendors;
CREATE POLICY "purchase_vendors_all" ON public.purchase_vendors
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));

-- Fix purchase_work_completions
DROP POLICY IF EXISTS "purchase_work_completions_all" ON public.purchase_work_completions;
CREATE POLICY "purchase_work_completions_all" ON public.purchase_work_completions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'purchase'))
WITH CHECK (has_role(auth.uid(), 'purchase'));
