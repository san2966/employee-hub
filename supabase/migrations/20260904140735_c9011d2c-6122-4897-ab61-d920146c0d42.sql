CREATE TABLE public.device_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_key text NOT NULL,
  account_label text,
  device_name text,
  device_type text NOT NULL DEFAULT 'desktop',
  ip_address text,
  browser text,
  is_application boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'successful',
  login_time timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_login_history_account ON public.device_login_history (account_key, login_time DESC);

GRANT SELECT, INSERT, DELETE ON public.device_login_history TO anon;
GRANT SELECT, INSERT, DELETE ON public.device_login_history TO authenticated;
GRANT ALL ON public.device_login_history TO service_role;

ALTER TABLE public.device_login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portal can insert device history"
  ON public.device_login_history FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Portal can read device history"
  ON public.device_login_history FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Portal can prune device history"
  ON public.device_login_history FOR DELETE TO anon, authenticated
  USING (true);