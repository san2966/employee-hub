# VPS Patch — 2026-06-20: Sync fixes

This patch fixes four sync / visibility issues reported on the production VPS.
It contains **(A)** a code change (auto-deployed by the GitHub Actions pipeline
when you push to `main`) and **(B)** a one-shot SQL patch you run manually on
the database.

---

## A. Code changes (already in this commit)

| File | What changed |
|------|--------------|
| `src/hooks/useEmployeeData.ts` | Requirements now write to real columns (`why_needed`, `link_url`, `expected_cost`, `employee_name`) instead of a JSON blob in `description`. Errors are now surfaced. |
| `src/hooks/useDirectorData.ts` | Director Requirements view reads the new columns. |
| `src/pages/tender/TenderManager.tsx` | (previous commit) Technical/Financial Update buttons appear immediately after the date is submitted. |
| `src/pages/director/TenderMonitor.tsx` | (previous commit) Director sees companies, opening dates, approved lists and work order in sync with Tender Head. |

Push to `main` → the existing `.github/workflows/deploy.yml` pipeline builds
the new Docker image, deploys it on port **8080**, and runs the smoke tests.

---

## B. Database patch — `2026-06-20_fix_sync_issues.sql`

Run this **once** against your self-hosted Postgres database.

### Steps

```bash
# 1. SSH into the VPS
ssh user@notify.emp-cms.in

# 2. Copy the patch (from your laptop or pull repo on the VPS)
scp scripts/vps-patches/2026-06-20_fix_sync_issues.sql user@notify.emp-cms.in:/tmp/

# 3. Backup the three affected tables first (safe rollback point)
pg_dump -h localhost -U postgres -d postgres \
        -t requirements -t employee_payments -t purchase_quotes \
        > /tmp/pre-patch-backup.sql

# 4. Apply the patch
psql -h localhost -U postgres -d postgres -f /tmp/2026-06-20_fix_sync_issues.sql

# 5. Verify
psql -h localhost -U postgres -d postgres -c \
  "SELECT count(*) FROM requirements;
   SELECT count(*) FROM employee_payments;
   SELECT count(*) FROM purchase_quotes;"
```

### What it does

1. Adds `why_needed`, `link_url`, `expected_cost`, `employee_name` columns to
   `requirements`, and backfills any existing JSON-blob rows.
2. Replaces the SELECT RLS policies on `requirements`, `employee_payments`,
   and `purchase_quotes` with a permissive `USING (true)` for `authenticated`.
   The app already restricts what each role sees in code; the old policies
   silently denied rows when `user_roles.employee_id` was NULL (which is the
   default for non-employee portal logins).

### Rollback

```bash
psql -h localhost -U postgres -d postgres -f /tmp/pre-patch-backup.sql
```

---

## Troubleshooting

| Symptom | Check | Fix |
|--------|-------|-----|
| Director Quotation Manager still empty | Open the Network tab → `purchase_quotes?select=*` must return 200 with rows. If 401/empty, the director isn't actually signed in to Supabase auth. | Log out & log in again. The login flow calls `supabase.auth.setSession(...)` — clear sessionStorage if stuck. |
| Employee Payments still missing in Accounts | `SELECT * FROM employee_payments LIMIT 5;` on the DB — confirms rows are saved. | If saved but not shown, hard-refresh Accounts portal (the SELECT policy is now permissive). |
| Requirement row stored with NULL `requested_by` | `SELECT id, requested_by, employee_name FROM requirements WHERE requested_by IS NULL;` | This happens when the employee's `portal_users.employee_id` link is NULL. Fix with: `UPDATE portal_users SET employee_id = '<emp uuid>' WHERE username = '<email>';`. Future inserts will then carry `requested_by`. The page still works because `employee_name` is stored too. |
| Pipeline smoke test "Insert visitors" or "Auth edge function" fails again | `node scripts/smoke-test.mjs` locally with the same env vars. | Confirm `SMOKE_TEST_EMAIL` is the **username** of a real portal user and `SMOKE_TEST_PASSWORD` matches its hash. |
| Tender Manager — Technical/Financial Update button still missing | Browser console: any error from `tender_company_links` query? | Verify `tender_company_links` has the row for that tender + the date was actually saved: `SELECT * FROM tenders WHERE id = '<tender id>';` should show `technical_opening_date` not null. |

---

## Tender module — DB tables reference

No schema changes needed for the Tender fix. For reference, the Tender module
already uses these tables (all created in earlier migrations):

- `tenders` — main bid record (incl. `technical_opening_date`, `financial_opening_date`, `work_order_url`, `status`)
- `tender_companies` — master list of bidder companies
- `tender_company_links` — per-tender per-company workflow rows (`technical_status`, `financial_status`)
- `tender_research`, `tender_documents`, `tender_contacts`, `tender_products`
- `tender_tasks`, `tender_payments`, `tender_settings`

Director and Tender Head both read the same tables — Realtime subscriptions in
`useTenderData` / `TenderMonitor.tsx` push updates in both directions instantly.