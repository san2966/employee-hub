
-- Storage bucket for tender files (logos, PDFs, ATCs, work orders, images)
INSERT INTO storage.buckets (id, name, public) VALUES ('tender-files', 'tender-files', true);

CREATE POLICY "Tender users can upload files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tender-files' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

CREATE POLICY "Anyone authenticated can view tender files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tender-files');

CREATE POLICY "Tender users can update their files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tender-files' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('tender_head', 'tender_executive')
  ));

CREATE POLICY "Tender head can delete files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tender-files' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'tender_head'
  ));
