
-- Admin Assets: add image + free-text assignee, drop strict FK on assigned_to
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS assigned_to_name text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS serial_number text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS condition text;
ALTER TABLE public.admin_assets DROP CONSTRAINT IF EXISTS admin_assets_assigned_to_fkey;
ALTER TABLE public.admin_assets ALTER COLUMN assigned_to TYPE text USING assigned_to::text;

-- Merged directory function so Admin sees HR + Admin employees regardless of RLS
CREATE OR REPLACE FUNCTION public.get_directory_employees()
RETURNS TABLE(
  id uuid, name text, designation text, phone text,
  alternate_phone text, address text, photo text,
  created_at timestamptz, source text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT e.id, e.name, e.designation, COALESCE(e.phone, e.mobile) AS phone,
         CASE WHEN e.mobile IS NOT NULL AND e.mobile <> COALESCE(e.phone,'') THEN e.mobile ELSE NULL END,
         e.address, e.photo, e.created_at, 'hr'::text
  FROM public.employees e
  WHERE COALESCE(e.is_active, true) = true
  UNION ALL
  SELECT ae.id, ae.name, ae.designation, ae.phone, ae.alternate_phone,
         ae.address, ae.photo, ae.created_at, 'admin'::text
  FROM public.admin_employees ae
  ORDER BY name;
$$;
GRANT EXECUTE ON FUNCTION public.get_directory_employees() TO anon, authenticated;

-- IT Assets: relax unique constraint to allow user-provided registration numbers freely
-- (already unique — kept). No schema change needed for New/Old flag.
