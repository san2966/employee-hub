
-- 1. Employees: profile fields for self-edit
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS mobile TEXT;

-- Allow each employee to update their own profile row
DROP POLICY IF EXISTS "Employees can update own profile" ON public.employees;
CREATE POLICY "Employees can update own profile"
ON public.employees FOR UPDATE TO authenticated
USING (id = public.get_employee_id(auth.uid()))
WITH CHECK (id = public.get_employee_id(auth.uid()));

-- 2. Vehicle assignments
CREATE TABLE IF NOT EXISTS public.vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_info TEXT,
  date DATE NOT NULL,
  employee_name TEXT NOT NULL,
  previous_km NUMERIC NOT NULL DEFAULT 0,
  current_km NUMERIC NOT NULL DEFAULT 0,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_assignments TO authenticated;
GRANT ALL ON public.vehicle_assignments TO service_role;
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS va_select ON public.vehicle_assignments;
CREATE POLICY va_select ON public.vehicle_assignments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
DROP POLICY IF EXISTS va_insert ON public.vehicle_assignments;
CREATE POLICY va_insert ON public.vehicle_assignments FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS va_update ON public.vehicle_assignments;
CREATE POLICY va_update ON public.vehicle_assignments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS va_delete ON public.vehicle_assignments;
CREATE POLICY va_delete ON public.vehicle_assignments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

-- 3. Fuel entries
CREATE TABLE IF NOT EXISTS public.fuel_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_info TEXT,
  date DATE NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_entries TO authenticated;
GRANT ALL ON public.fuel_entries TO service_role;
ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fe_select ON public.fuel_entries;
CREATE POLICY fe_select ON public.fuel_entries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'director'));
DROP POLICY IF EXISTS fe_insert ON public.fuel_entries;
CREATE POLICY fe_insert ON public.fuel_entries FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS fe_delete ON public.fuel_entries;
CREATE POLICY fe_delete ON public.fuel_entries FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fuel_entries;

NOTIFY pgrst, 'reload schema';
