ALTER TABLE public.employee_payments
  ADD COLUMN IF NOT EXISTS month integer,
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS sheet_url text;

ALTER TABLE public.employee_payments ALTER COLUMN amount DROP NOT NULL;
ALTER TABLE public.employee_payments ALTER COLUMN amount SET DEFAULT 0;
ALTER TABLE public.employee_payments ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.employee_payments ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.employee_payments ALTER COLUMN date DROP NOT NULL;

UPDATE public.employee_payments
SET month = COALESCE(month, EXTRACT(MONTH FROM date)::int),
    year = COALESCE(year, EXTRACT(YEAR FROM date)::int)
WHERE date IS NOT NULL AND (month IS NULL OR year IS NULL);