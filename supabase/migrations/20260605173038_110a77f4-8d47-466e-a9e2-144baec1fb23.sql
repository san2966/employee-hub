
-- 1. employee_payments: add proper expense columns
ALTER TABLE public.employee_payments
  ADD COLUMN IF NOT EXISTS employee_name TEXT,
  ADD COLUMN IF NOT EXISTS from_location TEXT,
  ADD COLUMN IF NOT EXISTS to_location TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Backfill employee_name from the linked employees table so the Accounts module
-- stops showing "Unknown" for existing rows.
UPDATE public.employee_payments ep
SET    employee_name = e.name
FROM   public.employees e
WHERE  ep.employee_id = e.id
  AND  (ep.employee_name IS NULL OR ep.employee_name = '');

-- Backfill purpose from the legacy description column where possible.
UPDATE public.employee_payments
SET    purpose = description
WHERE  purpose IS NULL AND description IS NOT NULL;

-- 2. purchase_documents: add created_at so notification polling works
ALTER TABLE public.purchase_documents
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.purchase_documents
SET    created_at = uploaded_at
WHERE  uploaded_at IS NOT NULL;

-- 3. employee_settings: dedicated per-user settings table
CREATE TABLE IF NOT EXISTS public.employee_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  first_name  TEXT,
  last_name   TEXT,
  mobile      TEXT,
  designation TEXT,
  photo       TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_settings TO authenticated;
GRANT ALL ON public.employee_settings TO service_role;

ALTER TABLE public.employee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees manage their own settings"
  ON public.employee_settings
  FOR ALL
  TO authenticated
  USING (employee_id = public.get_employee_id(auth.uid())
         OR public.has_role(auth.uid(), 'hr')
         OR public.has_role(auth.uid(), 'admin')
         OR public.has_role(auth.uid(), 'director'))
  WITH CHECK (employee_id = public.get_employee_id(auth.uid())
         OR public.has_role(auth.uid(), 'hr')
         OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_employee_settings_updated_at
  BEFORE UPDATE ON public.employee_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reload PostgREST schema cache so new columns are visible immediately.
NOTIFY pgrst, 'reload schema';
