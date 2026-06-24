# VPS Patch — 2026-06-24: Full repair (Requirements, Quotes, Notices, Settings, Ops files)

Run on the VPS:

```bash
psql -h localhost -U postgres -d postgres \
  -f scripts/vps-patches/2026-06-24_full_repair_requirements_quotes_notices_settings.sql
```

Then rebuild the frontend and **hard-refresh** the browser (Ctrl+F5).

What it does:
1. **Requirements** — adds `why_needed / link_url / expected_cost / employee_name` columns, backfills legacy JSON blobs, ensures `approved`/`rejected` enum values exist, recreates the normalise trigger, opens RLS, adds realtime.
2. **Purchase Quotes** — adds `description`, opens RLS, adds realtime for Director ↔ Purchase sync.
3. **Notices vs Announcements** — adds `notice_type / recipient_employee_ids / is_global`; rewrites SELECT policy so each employee only sees their own targeted notices but everyone sees announcements.
4. **Employee Settings** — ensures `employee_settings` exists with `photo` column + permissive RLS so profile photo persists.
5. **Ops Proposals / Inwards** — grants Director read/update so Record Management preview & download work.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `column ... does not exist` | rerun the patch; all ALTERs are `IF NOT EXISTS` |
| `permission denied for table ...` | rerun the `GRANT` block for the named table |
| `relation ... already member of publication supabase_realtime` | safe to ignore |
| Employee sees others' notices | run `SELECT public.current_portal_employee_id();` — if NULL, redeploy the `authenticate` edge function and ask the user to re-login |
| Director Quotation buttons missing | hard-refresh; the Action column moved to the end |

---

# Historic patches

## 2026-06-20: Sync fixes

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

## Emergency force repair — `2026-06-21_force_repair_quotation_tender_tasks.sql`

Use this when the VPS still shows these two symptoms after code deployment:

1. Director → Quotation Manager has no **Accept** / **Reject** actions.
2. Tender Head → Task Manager records do not appear in Tender Executive → Assigned Tasks.

### Run on VPS

```bash
# 1. SSH into the VPS
ssh user@notify.emp-cms.in

# 2. Pull the latest repo, or copy this file to /tmp
cd /path/to/your/project
git pull origin main

# 3. Apply the force repair patch
psql -h localhost -U postgres -d postgres \
  -f scripts/vps-patches/2026-06-21_force_repair_quotation_tender_tasks.sql
```

### What this force patch does

- Makes `purchase_quotes` readable/updatable for logged-in portal users so Director can accept/reject even if `user_roles` links are broken.
- Makes `tender_tasks` readable/writable for logged-in portal users so Tender Head and Tender Executive see the same rows.
- Recreates `get_tender_users()` so the Assign Task dropdown uses real Tender login usernames.
- Enables realtime publication for `purchase_quotes` and `tender_tasks`.
- Converts old `purchase_quotes.status = 'Approved'` to `accepted`.
- Repairs old Tender Head tasks where `assigned_to` is not an email/login, mapping them to the first Tender Executive login.

### Verify immediately

```bash
psql -h localhost -U postgres -d postgres -c \
"SELECT id, quote_id, status FROM purchase_quotes ORDER BY created_at DESC LIMIT 5;
 SELECT id, assigned_by, assigned_to, task_title FROM tender_tasks ORDER BY created_at DESC LIMIT 5;
 SELECT username, role FROM get_tender_users();"
```

### If it still fails

| Symptom | Check | Fix |
|--------|-------|-----|
| Buttons still not visible | Browser hard refresh / clear cache; confirm latest code is deployed. | Re-run GitHub deploy pipeline, then Ctrl+F5. |
| Accept/Reject click fails | Browser Network tab must show `purchase_quotes` update returning 200/204. | Re-run this SQL patch and confirm grants/policies output has `purchase_quotes_update`. |
| Executive still cannot see assigned task | In DB, `assigned_to` must exactly equal the executive login email. | `UPDATE tender_tasks SET assigned_to='tender.executive@vmcc-india.com' WHERE id='<task id>';` |
| Dropdown has no executive | `SELECT username, role FROM get_tender_users();` must return tender users. | Check `portal_users.role` values are exactly `tender_head` / `tender_executive`. |

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

---

## Permanent repair — `2026-06-22_permanent_requirements_quotes_leave_repair.sql`

Use this when the VPS still shows these symptoms after older patches:

1. Employee → Requirements saves data as one JSON string and rows do not show for Employee/Director.
2. Director → Quotation Manager still does not show **Accept** / **Reject** actions.
3. Director approves an exchange leave, but Employee → Leave Manager → **Take Leave** still does not work.

### Run on VPS

```bash
# 1. SSH into the VPS
ssh user@notify.emp-cms.in

# 2. Go to the deployed project folder and pull latest code
cd /path/to/your/project
git pull origin main

# 3. Apply the permanent DB repair
psql -h localhost -U postgres -d postgres \
  -f scripts/vps-patches/2026-06-22_permanent_requirements_quotes_leave_repair.sql

# 4. Rebuild/restart the frontend container or rerun your deploy workflow
# 5. In browser: logout, login again, then hard refresh with Ctrl+F5
```

### What this patch does

- Adds/keeps real requirement columns: `why_needed`, `link_url`, `expected_cost`, `employee_name`.
- Adds a database trigger so even an old cached frontend sending JSON in `description` is automatically split into proper columns.
- Backfills old JSON requirement rows and links rows to employees where possible.
- Removes broken foreign-table joins from Director/Employee requirement reads in code.
- Forces `purchase_quotes` read/update access for logged-in portal users and moves Director action buttons to the second table column so they cannot be hidden off-screen.
- Adds a leave-balance database trigger and recalculates existing exchange leave balances from approved records.

### Verify immediately

```bash
psql -h localhost -U postgres -d postgres -c "
SELECT id, title, description, why_needed, link_url, expected_cost, requested_by, employee_name, status
FROM requirements ORDER BY created_at DESC LIMIT 10;

SELECT id, quote_id, status, description
FROM purchase_quotes ORDER BY created_at DESC LIMIT 10;

SELECT e.name, e.exchange_leave_balance,
       COUNT(l.*) FILTER (WHERE l.leave_type::text = 'exchange' AND l.status = 'approved' AND COALESCE(l.is_add_leave, false)) AS earned
FROM employees e
LEFT JOIN leave_requests l ON l.employee_id = e.id
GROUP BY e.id, e.name, e.exchange_leave_balance
ORDER BY e.name;"
```

### Troubleshooting

| Symptom | Check | Fix |
|--------|-------|-----|
| Requirement still stores JSON | Run `\d+ requirements` and confirm trigger `normalize_requirement_row_before_write` exists. | Re-run the permanent SQL patch, then hard-refresh browser. |
| Requirement saves but employee page empty | `requested_by` must equal employee id or `employee_name` must equal login username/name. | Logout/login again so `authUser.employee_id` is refreshed; confirm HR employee is linked in `portal_users.employee_id`. |
| Quotation buttons still missing | Confirm the deployed JS contains `Accept` by running `grep -R "Accept" dist/assets`. | Rebuild frontend image/container; browser Ctrl+F5. The DB patch cannot change stale frontend files. |
| Exchange Take Leave disabled after approval | Check `employees.exchange_leave_balance` for that employee is > 0. | Re-run the permanent SQL patch; it recalculates balances from approved exchange rows. |

---

## Employee requirements/leave + notice targeting repair — `2026-06-23_employee_requirements_leave_notice_quote_repair.sql`

Use this patch for the latest VPS symptoms:

1. Employee → Requirements shows **“Request Not Submitted: Please Try again”**.
2. Employee → Leave Manager shows **“Error: request failed”** for exchange leave, and leave rows/counts do not update.
3. Director notices are visible to all employees instead of only selected employees.
4. Director → Quotation Manager must keep **Actions** after **Status**.

### Run on VPS

```bash
# 1. SSH into the VPS
ssh user@notify.emp-cms.in

# 2. Go to the deployed project folder and pull latest code
cd /path/to/your/project
git pull origin main

# 3. Apply the DB repair
psql -h localhost -U postgres -d postgres \
  -f scripts/vps-patches/2026-06-23_employee_requirements_leave_notice_quote_repair.sql

# 4. Redeploy/restart the frontend container, then hard-refresh browser (Ctrl+F5)
```

### Root cause fixed

- Some `portal_users.employee_id` values pointed to deleted/missing employee rows. That caused `leave_requests_employee_id_fkey` failures and also made employee-specific requirements/notices invisible.
- Requirements now always store `description`, `why_needed`, `link_url`, and `expected_cost` separately; old JSON rows are cleaned.
- Notices now store `notice_type`, `recipient_employee_ids`, and `is_global`, so selected notices stay private and announcements remain global.

### Verify immediately

```bash
psql -h localhost -U postgres -d postgres -c "
SELECT pu.username, pu.employee_id, e.id AS employee_exists
FROM portal_users pu
LEFT JOIN employees e ON e.id = pu.employee_id
WHERE pu.role::text = 'employee';

SELECT title, description, why_needed, link_url, expected_cost, requested_by, employee_name, status
FROM requirements ORDER BY created_at DESC LIMIT 10;

SELECT e.name, e.paid_leave_balance, e.medical_leave_balance, e.exchange_leave_balance
FROM employees e ORDER BY e.name;

SELECT title, notice_type, is_global, recipient_employee_ids
FROM notices ORDER BY created_at DESC LIMIT 10;
"
```

### Troubleshooting

| Symptom | Check | Fix |
|--------|-------|-----|
| Requirement still fails | Browser Network tab must show `requirements` insert details; check `portal_users.employee_id` query above. | Re-run this patch, logout/login again, then Ctrl+F5. |
| Leave request still fails | Error must not mention `leave_requests_employee_id_fkey`. | If it does, the employee login is still linked to a missing employee; run the verification query and repair that username in HR. |
| Notice visible to wrong employee | `notice_type='notice'`, `is_global=false`, and employee id must be in `recipient_employee_ids`. | Recreate the notice after frontend redeploy; old notices default to announcement/global. |
| Quotation actions order unchanged | Deployed JS is stale. | Rebuild/restart frontend container and clear browser cache. |