-- Bucket A: Missing columns (idempotent)
ALTER TABLE public.tickets          ADD COLUMN IF NOT EXISTS resolution_image_url text;
ALTER TABLE public.tender_tasks     ADD COLUMN IF NOT EXISTS assigned_by text;
ALTER TABLE public.tender_tasks     ADD COLUMN IF NOT EXISTS report text;
ALTER TABLE public.tender_companies ADD COLUMN IF NOT EXISTS director_name text;
ALTER TABLE public.tender_documents ADD COLUMN IF NOT EXISTS bid_date date;
ALTER TABLE public.tender_products  ADD COLUMN IF NOT EXISTS specification text;
ALTER TABLE public.tender_payments  ADD COLUMN IF NOT EXISTS emd_type text;
ALTER TABLE public.tender_research  ADD COLUMN IF NOT EXISTS amount numeric;

-- Bucket B: attendance unique constraint for upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendance_employee_date_unique'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_employee_date_unique UNIQUE (employee_id, date);
  END IF;
END $$;

-- Bucket B: Realtime publications (safe to re-run)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'purchase_quotes','tender_research','tender_payments','tender_tasks',
    'tender_documents','tender_companies','tender_products',
    'tasks','director_tasks','daily_reports','visitors','vehicles',
    'employee_payments','requirements','contacts','it_assets','telephone_directory',
    'tender_reminders','tender_notes'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
      WHEN others THEN NULL;
    END;
  END LOOP;
END $$;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';