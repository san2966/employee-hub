-- VPS Patch: 2026-07-02
-- Apply on the VPS Supabase DB:
--   psql "$SUPABASE_DB_URL" -f 2026-07-02_admin_it_assets_directory.sql
--
-- Fixes:
-- 1) Admin User Management: HR-added employees now visible via
--    get_directory_employees() SECURITY DEFINER RPC.
-- 2) Admin Asset Management: image, brand, serial_number, invoice_number,
--    condition, and free-text assigned_to_name columns added. FK to employees
--    dropped so any HR or Admin person can be assigned.
-- 3) IT Head Asset Management: no schema change needed — client now sends an
--    explicit registration_number when the asset is marked "Old".

BEGIN;

-- 1) Admin Assets extended columns + relaxed assignee link
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS assigned_to_name text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS serial_number text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.admin_assets ADD COLUMN IF NOT EXISTS condition text;
ALTER TABLE public.admin_assets DROP CONSTRAINT IF EXISTS admin_assets_assigned_to_fkey;
ALTER TABLE public.admin_assets ALTER COLUMN assigned_to TYPE text USING assigned_to::text;

-- 2) Merged directory function (HR + Admin employees) — bypasses RLS
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

-- 3) Ensure realtime is enabled on the affected tables
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_assets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_employees; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.employees; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.it_assets; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

COMMIT;