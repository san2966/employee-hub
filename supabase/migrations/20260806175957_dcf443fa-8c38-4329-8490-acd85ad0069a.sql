ALTER TABLE public.employee_payments
  ADD COLUMN IF NOT EXISTS expense_type text,
  ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'Cash',
  ADD COLUMN IF NOT EXISTS hr_status text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS accounts_status text NOT NULL DEFAULT 'Pending';

UPDATE public.employee_payments SET expense_type = COALESCE(expense_type, CASE WHEN category IN ('travel','traveling') THEN 'Travel' ELSE 'Other' END);