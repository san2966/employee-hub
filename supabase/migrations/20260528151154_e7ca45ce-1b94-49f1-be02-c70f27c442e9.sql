
-- Allow anonymous visitors to submit tickets from the public Contact page
GRANT INSERT ON public.tickets TO anon;

DROP POLICY IF EXISTS "tickets_insert" ON public.tickets;

CREATE POLICY "tickets_insert_public"
ON public.tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'Active'
  AND problem_cause IS NULL
  AND solution_provided IS NULL
  AND resolution_image_url IS NULL
  AND resolved_at IS NULL
);

-- Force PostgREST to refresh its schema cache (fixes self-hosted "table not found"
-- and stale-policy errors after manual schema edits)
NOTIFY pgrst, 'reload schema';
