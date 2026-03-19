
-- Create director_tasks table
CREATE TABLE public.director_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  department text NOT NULL,
  task text NOT NULL,
  expected_days integer NOT NULL DEFAULT 7,
  status text NOT NULL DEFAULT 'Pending',
  report text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.director_tasks ENABLE ROW LEVEL SECURITY;

-- Director: full CRUD
CREATE POLICY "director_tasks_select" ON public.director_tasks
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'director') OR
    (has_role(auth.uid(), 'admin') AND department = 'Admin') OR
    (has_role(auth.uid(), 'hr') AND department = 'HR') OR
    (has_role(auth.uid(), 'tender') AND department = 'Tender') OR
    (has_role(auth.uid(), 'operations') AND department = 'Operations') OR
    (has_role(auth.uid(), 'purchase') AND department = 'Purchase') OR
    (has_role(auth.uid(), 'ithead') AND department = 'IT') OR
    (has_role(auth.uid(), 'accounts') AND department = 'Accounts')
  );

CREATE POLICY "director_tasks_insert" ON public.director_tasks
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'director'));

CREATE POLICY "director_tasks_update" ON public.director_tasks
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'director') OR
    (has_role(auth.uid(), 'admin') AND department = 'Admin') OR
    (has_role(auth.uid(), 'hr') AND department = 'HR') OR
    (has_role(auth.uid(), 'tender') AND department = 'Tender') OR
    (has_role(auth.uid(), 'operations') AND department = 'Operations') OR
    (has_role(auth.uid(), 'purchase') AND department = 'Purchase') OR
    (has_role(auth.uid(), 'ithead') AND department = 'IT') OR
    (has_role(auth.uid(), 'accounts') AND department = 'Accounts')
  );

CREATE POLICY "director_tasks_delete" ON public.director_tasks
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'director'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.director_tasks;
