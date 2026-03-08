
-- Fix 1: Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('tender-files', 'purchase-files');

-- Fix 2: Fix tickets INSERT policy to require authentication
DROP POLICY IF EXISTS "tickets_insert" ON public.tickets;
CREATE POLICY "tickets_insert" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
