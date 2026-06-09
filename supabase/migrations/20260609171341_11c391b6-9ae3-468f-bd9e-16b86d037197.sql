
ALTER TABLE public.purchase_work_completions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.purchase_project_images ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE public.purchase_work_completions SET created_at = uploaded_at WHERE uploaded_at IS NOT NULL;
UPDATE public.purchase_project_images SET created_at = uploaded_at WHERE uploaded_at IS NOT NULL;
NOTIFY pgrst, 'reload schema';
