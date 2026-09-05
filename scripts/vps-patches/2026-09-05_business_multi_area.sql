-- Business Employees: multi-area support
-- Run on the VPS database (e.g. via the SQL editor or psql).

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS area_ids uuid[] NOT NULL DEFAULT '{}';

-- Copy existing single-area values into the new list.
UPDATE public.business_profiles
SET area_ids = ARRAY[area_id]
WHERE area_id IS NOT NULL AND (area_ids IS NULL OR area_ids = '{}');
