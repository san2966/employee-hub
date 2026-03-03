
-- Add INSERT policy for tender-files storage
CREATE POLICY "Tender roles can upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tender-files'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('tender_head', 'tender_executive')
  )
);

-- Add UPDATE policy for tender-files storage
CREATE POLICY "Tender roles can update files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'tender-files'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('tender_head', 'tender_executive')
  )
);

-- Add DELETE policy for tender-files storage
CREATE POLICY "Tender roles can delete files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'tender-files'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('tender_head', 'tender_executive')
  )
);
