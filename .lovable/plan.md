# Fix All 20 Portal Issues

I audited the database schema against the codebase. The 20 issues fall into 4 buckets. Note: your live system runs on **self-hosted Supabase** (supabase.emp-cms.in), so I will produce one consolidated SQL migration that you re-run on your VPS DB plus the code fixes inside the project.

## Bucket A — PostgREST schema-cache errors (issues 8, 12, 13, 14, 15, 16, 17)

Columns like `resolution_image_url`, `assigned_by`, `director_name`, `bid_date`, `specification`, `emd_type`, `amount` already exist in the Lovable-managed schema. On your self-hosted DB they're missing or PostgREST hasn't reloaded.

**Fix:** Single migration that adds every missing column (idempotent `ADD COLUMN IF NOT EXISTS`) for tickets, tender_tasks, tender_companies, tender_documents, tender_products, tender_payments, tender_research, then `NOTIFY pgrst, 'reload schema'`.

## Bucket B — Missing unique/realtime constraints (issues 4, 18, 20)

- `attendance` has no `UNIQUE(employee_id, date)` → ON CONFLICT fails. Add it.
- `purchase_quotes` not in `supabase_realtime` publication → Director/Purchase quotation pages don't sync. Add it.
- `tender_research` / `tender_payments` not in realtime publication → Director Tender Monitor doesn't sync. Add them.

## Bucket C — RLS/visibility (issues 5, 6, 7, 11)

- `visitors`, `vehicles` — confirm SELECT policy allows admin role, and writes use admin role.
- `tender_reminders`, `tender_notes` — confirm RLS policies allow `tender_head` & `tender_executive` for ALL ops (currently may scope by user_id only).
- `employee_payments` join in Accounts uses `employees(name)` — currently hook returns "Unknown". Switch to explicit FK alias or separate fetch + map.

## Bucket D — Frontend code bugs (issues 1, 2, 3, 7-vouchers, 9, 10, 19)

- `useDirectorData.ts` – `addTask` writes to `tasks` but `useEmployeeData`/director task list reads from `director_tasks`. Unify on `tasks` for inter-employee + `director_tasks` for departmental.
- `useSupabaseReports.ts` – join uses `employees(name)` which may return null; switch to manual join via `employee_id` lookup.
- Employee Settings / Contacts / Requirements pages – currently use `localStorage`. Wire to Supabase tables (`employees`, `contacts`, `requirements`).
- Admin Visitor & Vehicle pages – hook does `addVisitor` to Supabase but `fetch` runs once; add refetch after mutation + realtime channel.
- Accounts Vouchers – filter `employee_payments` by `category='travel'` for the Vouchers tab.
- IT Assets / Telephone Directory hooks – await refetch after insert; fix `useITHeadData` stock bug (`|| 0 + qty` precedence).
- Purchase Documents – fetch missing `await refetch` after upload.

## Technical Details

**One migration file** containing:
```sql
-- Add missing columns (idempotent)
ALTER TABLE public.tickets        ADD COLUMN IF NOT EXISTS resolution_image_url text;
ALTER TABLE public.tender_tasks   ADD COLUMN IF NOT EXISTS assigned_by text, ADD COLUMN IF NOT EXISTS report text;
ALTER TABLE public.tender_companies   ADD COLUMN IF NOT EXISTS director_name text;
ALTER TABLE public.tender_documents   ADD COLUMN IF NOT EXISTS bid_date date;
ALTER TABLE public.tender_products    ADD COLUMN IF NOT EXISTS specification text;
ALTER TABLE public.tender_payments    ADD COLUMN IF NOT EXISTS emd_type text;
ALTER TABLE public.tender_research    ADD COLUMN IF NOT EXISTS amount numeric;

-- Unique constraint for attendance upserts
ALTER TABLE public.attendance ADD CONSTRAINT attendance_employee_date_unique UNIQUE (employee_id, date);

-- Realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_research;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.director_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_reports;

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
```

**Code edits** (~12 files): src/hooks/useDirectorData.ts, useSupabaseReports.ts, useEmployeeData.ts, useAdminData.ts, useSupabaseVisitors.ts, useSupabaseVehicles.ts, useAccountsData.ts, useITHeadData.ts, useSupabaseITHead.ts, useSupabaseRequirements.ts, useSupabaseContacts.ts (settings page wire-up), and Accounts Vouchers page filter.

## What you do after this lands

1. Approve the migration. Lovable will run it on Lovable Cloud automatically.
2. On your VPS, run the same SQL block against your self-hosted DB:
   ```bash
   docker compose exec db psql -U postgres -d postgres -f /path/to/migration.sql
   ```
3. Restart the API gateway so PostgREST picks up changes:
   ```bash
   docker compose restart rest kong
   ```
4. Re-test each module. Any remaining failures → share the new error and I'll fix in one more pass.
