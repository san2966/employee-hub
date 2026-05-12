# EMP CMS Production Setup Guide (Start to End)

This guide is written to avoid the confusion between **Local PC** and **VPS**.
Every step clearly says **WHERE TO RUN**.

---

# 0) Final decision and deployment order

## Recommended order
1. **Deploy and verify self-hosted Supabase first**
2. **Create database schema, auth, storage, secrets, and edge functions**
3. **Point domain + SSL to Supabase**
4. **Build and deploy frontend application**
5. **Connect frontend to production backend**
6. **Run full production validation**

## Why database first?
If you deploy the app first, the frontend will try to connect to a backend that is not ready yet.
That causes:
- blank page
- failed login
- 401 / 403 / 404 API errors
- edge function errors
- storage upload failures

So for your project, **database/backend must be deployed first**.

---

# 1) Root causes from your previous problems

Based on your earlier issues, the repeated root causes were:

1. **Frontend built with wrong env values**
   - Result: blank white page
   - Cause: production build still using old hosted URL/key or missing VITE values during Docker build

2. **Reverse proxy mismatch**
   - Result: 502 Bad Gateway / 401 confusion
   - Cause: Nginx not routing properly to frontend container or Supabase/Kong container

3. **JWT / keys mismatch**
   - Result: auth failures, edge function unauthorized errors
   - Cause: frontend anon key, backend JWT secret, and self-hosted generated keys not matching the same stack

4. **Edge functions deployed incompletely**
   - Result: login/email/password tools fail
   - Cause: functions not deployed to remote backend, missing secrets, or unstable dependency imports

5. **Production SMTP / email not fully wired**
   - Result: auth email or ticket email failure
   - Cause: missing runtime secrets, missing hook config, wrong sender identity

6. **Mixed local/server instructions**
   - Result: commands executed on wrong machine
   - Cause: no separation of Local PC vs VPS

---

# 2) Recommended VPS setup

## Best OS
**Ubuntu 22.04 LTS**

Why:
- stable
- easiest Docker documentation
- best compatibility with Nginx, Docker, Certbot, Supabase self-hosting
- simpler than panels for debugging

## Recommended approach
**Do NOT use a heavy control panel initially**.
Use:
- Ubuntu 22.04 LTS
- Docker Engine
- Docker Compose plugin
- Nginx on host machine
- Certbot for SSL

## Why not a control panel first?
Panels often add hidden Nginx/Apache rules and port conflicts. That is one of the most common reasons for:
- 502 Bad Gateway
- SSL conflicts
- wrong upstream target
- Docker port conflicts

If later you want easier management, use **Coolify** only after everything works manually.
For now, manual Docker + Nginx is safest.

---

# 3) Server sizing recommendation

For ~100 employees internal portal:

## Minimum
- 4 vCPU
- 8 GB RAM
- 120 GB SSD

## Better
- 6–8 vCPU
- 16 GB RAM
- 200 GB SSD

If frontend + self-hosted Supabase + storage + edge functions + email jobs all run on same VPS, **16 GB RAM is safer**.

---

# 4) Domain plan

You provided:
- Main app domain: `emp-cms.in`
- Backend domain: `supabase.emp-cms.in`

## Correct usage
- `emp-cms.in` → frontend React app
- `supabase.emp-cms.in` → self-hosted Supabase API gateway

Do **not** point both to same upstream.

---

# 5) Production architecture

## What will run on VPS
1. Nginx on host
2. Supabase self-hosted Docker stack
3. Frontend Docker container (Nginx serving Vite build)
4. Certbot SSL

## Suggested ports on VPS
- Frontend container: `127.0.0.1:3000 -> container:80`
- Supabase gateway / Kong: `127.0.0.1:8000 -> container:8000`
- Nginx host listens on `80` and `443`

This avoids public exposure of internal ports.

---

# 6) Full deployment steps

---

## STEP 1 — Prepare VPS

### WHERE TO RUN
**VPS**

## Commands
```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release git unzip jq nginx certbot python3-certbot-nginx ufw

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu   $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker
systemctl enable nginx
systemctl start nginx

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## Success check
```bash
docker --version
docker compose version
nginx -v
systemctl status docker --no-pager
systemctl status nginx --no-pager
```

## Common errors and fixes

### Error: `Unable to locate package docker-ce`
**Cause:** Docker repo not added correctly
**Fix:** Repeat Docker GPG + docker.list steps, then `apt update`

### Error: `UFW blocks site`
**Fix:**
```bash
ufw status
ufw allow 'Nginx Full'
ufw allow OpenSSH
```

---

## STEP 2 — Configure DNS before deployment

### WHERE TO RUN
**At your domain/DNS provider panel**

## Required DNS records
```text
A     emp-cms.in              187.127.142.127
A     www.emp-cms.in          187.127.142.127
A     supabase.emp-cms.in     187.127.142.127
```

## Verify from VPS
### WHERE TO RUN
**VPS**
```bash
apt install -y dnsutils
DIG1=$(dig +short emp-cms.in | tail -n 1)
DIG2=$(dig +short supabase.emp-cms.in | tail -n 1)
printf "emp-cms.in -> %s
supabase.emp-cms.in -> %s
" "$DIG1" "$DIG2"
```

## Expected
Both should resolve to `187.127.142.127`

## Common errors and fixes

### Error: domain resolves old IP
**Cause:** DNS not propagated or wrong record
**Fix:** correct A record and wait

### Error: SSL fails later
**Cause:** DNS not pointed before Certbot run
**Fix:** fix DNS first, then run Certbot again

---

## STEP 3 — Create project directories on VPS

### WHERE TO RUN
**VPS**
```bash
mkdir -p /opt/empcms
mkdir -p /opt/empcms/app
mkdir -p /opt/empcms/supabase
mkdir -p /opt/empcms/backups
```

---

## STEP 4 — Install self-hosted Supabase first

### WHERE TO RUN
**VPS**

## Clone official self-hosted stack
```bash
git clone https://github.com/supabase/supabase /opt/empcms/supabase/repo
cp -R /opt/empcms/supabase/repo/docker/* /opt/empcms/supabase/
cp /opt/empcms/supabase/.env.example /opt/empcms/supabase/.env
```

## Important
Your self-hosted backend must be ready **before** the app deployment.

---

## STEP 5 — Generate production backend secrets correctly

### WHERE TO RUN
**VPS**

You must use **one single JWT secret** and generate the anon/service keys from that same secret.
If these do not match, you get login issues and 401 errors.

## Generate values
```bash
openssl rand -base64 32
openssl rand -hex 32
openssl rand -hex 32
```

Use them for:
- `JWT_SECRET`
- `POSTGRES_PASSWORD`
- `DASHBOARD_PASSWORD` or other secure admin secrets

## Generate ANON_KEY and SERVICE_ROLE_KEY
Use the same `JWT_SECRET` with JWT payloads.

**Recommended:** generate on your Local PC with a JWT tool/script, then paste into VPS `.env`.

### WHERE TO RUN
**Local PC**

Use any trusted JWT generator with HS256 and your `JWT_SECRET`.

Payload for anon key:
```json
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 2080000000
}
```

Payload for service role key:
```json
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 2080000000
}
```

## Important
- Both must be signed with the same `JWT_SECRET`
- Frontend uses **anon/publishable key**
- Edge functions/admin tasks use **service role key**

---

## STEP 6 — Fill self-hosted Supabase environment

### WHERE TO RUN
**VPS**

Edit:
```bash
nano /opt/empcms/supabase/.env
```

## Minimum critical production values checklist
Replace the placeholders with your real production values.

```env
POSTGRES_PASSWORD=REPLACE_STRONG_DB_PASSWORD
JWT_SECRET=REPLACE_STRONG_JWT_SECRET
ANON_KEY=REPLACE_GENERATED_ANON_KEY
SERVICE_ROLE_KEY=REPLACE_GENERATED_SERVICE_ROLE_KEY
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=REPLACE_STRONG_DASHBOARD_PASSWORD
SECRET_KEY_BASE=REPLACE_LONG_RANDOM_SECRET
VAULT_ENC_KEY=REPLACE_32_CHAR_SECRET
POOLER_TENANT_ID=empcms
API_EXTERNAL_URL=https://supabase.emp-cms.in
SITE_URL=https://emp-cms.in
SUPABASE_PUBLIC_URL=https://supabase.emp-cms.in
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=noreply@emp-cms.in
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_ZT8TvAo1_4AExsKNc4y4s14cb2Uj3SSjX
SMTP_SENDER_NAME=Employee_Portal
```

## Important note
You asked for production-only values. So do **not** leave any sample/default values.

## Common errors and fixes

### Error: `401 Unauthorized` from API gateway
**Cause:** `ANON_KEY` and `SERVICE_ROLE_KEY` not generated from same `JWT_SECRET`
**Fix:** regenerate both keys using the exact same JWT secret

### Error: auth works partially but functions fail
**Cause:** service role key wrong or not updated in secrets
**Fix:** replace service role everywhere consistently

---

## STEP 7 — Start Supabase stack

### WHERE TO RUN
**VPS**
```bash
docker compose --env-file /opt/empcms/supabase/.env -f /opt/empcms/supabase/docker-compose.yml up -d
```

## Check containers
```bash
docker ps --format 'table {{.Names}}	{{.Status}}	{{.Ports}}'
```

## Check backend gateway from VPS
```bash
curl -I http://127.0.0.1:8000
```

## Expected
You may see `401 Unauthorized` on root request. That is **normal** for the backend gateway without API key.

## Common errors and fixes

### Error: containers restart continuously
**Fix:**
```bash
docker compose -f /opt/empcms/supabase/docker-compose.yml logs --tail=100
```
Common causes:
- bad `.env`
- missing required variables
- port collision
- low RAM

### Error: port already in use
**Fix:**
```bash
ss -tulpn | rg ':8000|:5432|:3000|:80|:443'
```
Stop conflicting service or change mapping

---

## STEP 8 — Configure VPS Nginx for backend + frontend domains

### WHERE TO RUN
**VPS**

Create Nginx file:
```bash
nano /etc/nginx/sites-available/empcms
```

Paste this exact config:

```nginx
server {
    listen 80;
    server_name emp-cms.in www.emp-cms.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name supabase.emp-cms.in;

    client_max_body_size 500m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:
```bash
ln -sf /etc/nginx/sites-available/empcms /etc/nginx/sites-enabled/empcms
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## Common errors and fixes

### Error: `502 Bad Gateway`
**Cause:** upstream container/port not running
**Check:**
```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8000
journalctl -u nginx -n 100 --no-pager
```

### Error: `host not found in upstream`
**Cause:** wrong proxy target
**Fix:** use `127.0.0.1:3000` and `127.0.0.1:8000`

---

## STEP 9 — Issue SSL certificates

### WHERE TO RUN
**VPS**
```bash
certbot --nginx -d emp-cms.in -d www.emp-cms.in -d supabase.emp-cms.in
```

## Verify auto-renew
```bash
systemctl status certbot.timer --no-pager
```

## Common errors and fixes

### Error: certificate request failed
**Cause:** DNS not pointed or port 80 blocked
**Fix:**
- confirm A record
- confirm `ufw allow 'Nginx Full'`
- confirm Nginx is reachable on 80

---

## STEP 10 — Prepare frontend project for production

### WHERE TO RUN
**Local PC**

Use these production frontend values when building:
- `VITE_SUPABASE_URL=https://supabase.emp-cms.in`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<your generated ANON_KEY>`
- `VITE_SUPABASE_PROJECT_ID=<your self-hosted project ref or chosen identifier>`

## Critical note
The blank page problem happened because frontend build used the wrong values.
This step must be correct.

---

## STEP 11 — Copy project to VPS

### WHERE TO RUN
**Local PC**

If your code is in Git:
```bash
git push
```

### WHERE TO RUN
**VPS**
```bash
git clone YOUR_REPO_URL /opt/empcms/app/repo
```

If already cloned:
```bash
cd /opt/empcms/app/repo && git pull
```

---

## STEP 12 — Build frontend Docker image with production build args

### WHERE TO RUN
**VPS**

From your project root:
```bash
cd /opt/empcms/app/repo

docker build   --build-arg VITE_SUPABASE_URL=https://supabase.emp-cms.in   --build-arg VITE_SUPABASE_PUBLISHABLE_KEY='REPLACE_WITH_PRODUCTION_ANON_KEY'   --build-arg VITE_SUPABASE_PROJECT_ID='empcms-prod'   -t empcms-frontend:latest .
```

## Why this matters
Your frontend is a Vite app. Vite injects env values at **build time**, not runtime.
If these are missing, you get the blank page issue.

---

## STEP 13 — Run frontend container

### WHERE TO RUN
**VPS**
```bash
docker rm -f empcms-frontend 2>/dev/null || true

docker run -d   --name empcms-frontend   --restart unless-stopped   -p 127.0.0.1:3000:80   empcms-frontend:latest
```

## Verify
```bash
curl -I http://127.0.0.1:3000
curl http://127.0.0.1:3000/health
```

## Common errors and fixes

### Error: container exits immediately
**Fix:**
```bash
docker logs empcms-frontend --tail=100
```

### Error: site opens blank page in browser
**Cause:** wrong build args
**Fix:** rebuild image with correct production `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## STEP 14 — Configure production secrets for edge functions

### WHERE TO RUN
**VPS with Supabase CLI** or **Local PC with Supabase CLI connected to the self-hosted backend**

You said edge function deployment is confusing. The easiest safe workflow is:
1. use Supabase CLI from your Local PC or VPS
2. link project to self-hosted backend
3. set secrets
4. deploy functions

## Required edge-function runtime secrets
- `SUPABASE_URL=https://supabase.emp-cms.in`
- `SUPABASE_ANON_KEY=<production anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<production service role key>`
- `RESEND_API_KEY=<your existing key>`
- `RESEND_FROM_EMAIL=noreply@emp-cms.in` (or your verified Resend sender)
- `IT_PASSWORD_ENCRYPTION_KEY=<strong random key>`
- `SEND_EMAIL_HOOK_SECRET=<strong random secret>`
- `CRON_SECRET=<strong random secret>`

## Common errors and fixes

### Error: function deploy succeeds but runtime fails
**Cause:** missing secrets
**Fix:** set all runtime secrets before testing

### Error: unauthorized in functions
**Cause:** wrong anon/service role keys
**Fix:** replace with production-generated keys from same JWT secret

---

## STEP 15 — Deploy edge functions

### WHERE TO RUN
**Local PC** or **VPS**

Install CLI if needed.

```bash
supabase login
```

Then inside project repo:
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy authenticate
supabase functions deploy encrypt-password
supabase functions deploy create-employee
supabase functions deploy auth-email-hook
supabase functions deploy process-email-queue
supabase functions deploy send-ticket-email
supabase functions deploy reset-yearly-leaves
```

## Important
I already hardened the code to reduce self-hosted failures:
- startup config error page instead of blank crash
- safer Docker build validation
- healthcheck for frontend container
- edge functions changed away from fragile remote imports for Supabase client
- ticket email no longer uses test fallback sender

## If you want me to deploy remotely
Yes, I can do it **if you give SSH root access or a temporary deploy user + password/key**.
In this chat I cannot directly SSH unless the environment can access your server and you provide working credentials. If you share them, I can attempt the remote steps.

---

## STEP 16 — Apply database schema, tables, storage, and auth setup

### WHERE TO RUN
**Local PC** with your project repo and Supabase CLI connected to your self-hosted project

You said schema/tables/storage are already created. If not, run your migrations now.

## Must exist for this app
- auth enabled
- `portal_users`
- `user_roles`
- `employees`
- IT module tables
- admin / HR / tender / purchase / operations tables
- storage buckets:
  - `tender-files`
  - `purchase-files`
  - `operations-files`
  - `tender-payments`
- functions:
  - `verify_password`
  - `hash_password`
  - `enqueue_email`
  - `read_email_batch`
  - `delete_email`
  - `move_to_dlq`

## Auth requirements
This project uses custom login through `authenticate` edge function and then creates/uses auth sessions.
So production must have:
- auth service running
- email login system operational
- correct `SITE_URL=https://emp-cms.in`
- correct backend public URL

---

## STEP 17 — Configure auth email hook and SMTP/email flow

### WHERE TO RUN
**Backend configuration interface / self-hosted auth config / CLI depending on your stack**

For your current approach:
- SMTP values are configured in backend env
- Auth emails are handled by `auth-email-hook`
- App emails and ticket emails use Resend runtime API key

## Your provided SMTP values
```text
SMTP_ADMIN_EMAIL=noreply@emp-cms.in
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_ZT8TvAo1_4AExsKNc4y4s14cb2Uj3SSjX
SMTP_SENDER_NAME=Employee_Portal
```

## Also ensure
`RESEND_FROM_EMAIL` must be a sender verified in Resend.
Best production choice:
```text
RESEND_FROM_EMAIL=Employee_Portal <noreply@emp-cms.in>
```

## Common email errors and fixes

### Error: `Email service not configured`
**Cause:** missing `RESEND_API_KEY` or `RESEND_FROM_EMAIL`
**Fix:** set both secrets for edge functions

### Error: SMTP auth failed
**Cause:** wrong SMTP password or unverified sender domain
**Fix:** verify sender/domain in Resend

### Error: email hook 401 invalid signature
**Cause:** wrong `SEND_EMAIL_HOOK_SECRET`
**Fix:** same secret must be configured in auth hook source and function runtime secret

---

## STEP 18 — Configure database cron / queued email processing

### WHERE TO RUN
**Database SQL console / psql connected to production database**

Your email queue function `process-email-queue` must run periodically.
If the queue exists but dispatcher never runs, emails stay pending forever.

You need:
- `pg_cron`
- `pg_net` (if using HTTP scheduler)
- periodic call to `process-email-queue`

## Common errors and fixes

### Error: emails logged but never sent
**Cause:** cron not running dispatcher
**Fix:** create/check cron job

### Error: repeated 401 from cron to function
**Cause:** wrong bearer token / service role in scheduled request
**Fix:** use current production service role key

---

## STEP 19 — Connect frontend and backend for production

### WHERE TO RUN
**VPS**

Connection is complete only when all below match:

1. Frontend build uses:
   - `https://supabase.emp-cms.in`
   - production anon key

2. Backend env uses:
   - same JWT secret family
   - same anon/service keys
   - `SITE_URL=https://emp-cms.in`

3. Nginx routes:
   - `emp-cms.in -> 127.0.0.1:3000`
   - `supabase.emp-cms.in -> 127.0.0.1:8000`

If one of these is wrong, production breaks.

---

## STEP 20 — Production validation checklist

### WHERE TO RUN
**Browser + VPS**

## A. Domain checks
**Browser**
- open `https://emp-cms.in`
- open `https://supabase.emp-cms.in`

**Expected**
- main domain shows app
- backend domain may show 401/JSON on direct open; that is normal

## B. Frontend health
### WHERE TO RUN
**VPS**
```bash
curl -I http://127.0.0.1:3000
curl http://127.0.0.1:3000/health
```

## C. Backend health
### WHERE TO RUN
**VPS**
```bash
curl -I http://127.0.0.1:8000
```
401 is acceptable here

## D. Login test
### WHERE TO RUN
**Browser**
Test each major role login page:
- Director
- HR
- Accounts
- Employee
- Admin
- IT Head
- Tender
- Purchase
- Operations

## E. Storage test
Upload one file in each module using storage bucket

## F. Edge function test
Test:
- authenticate
- encrypt-password
- create-employee
- send-ticket-email
- auth-email-hook (through auth flow)
- process-email-queue

## G. Database write test
Create/update real sample data from UI and confirm it persists after refresh

## H. Email test
- create one auth-related email test
- create one ticket email test
- check inbox/spam

## I. Security test
- verify service-role key is never exposed in frontend
- verify only anon key is used in frontend build
- verify storage buckets remain private
- verify login works only through intended flow

---

# 7) Troubleshooting matrix

## Problem: blank page
### Likely causes
- frontend built with wrong env
- missing VITE build args
- JS startup crash

### Fix
1. rebuild Docker image with correct build args
2. redeploy frontend container
3. clear browser cache

### Confirm
App now shows either:
- working login portal, or
- clear configuration error page instead of blank white screen

---

## Problem: 502 Bad Gateway
### Likely causes
- frontend container not running
- Supabase gateway container not running
- wrong Nginx upstream

### Fix
```bash
docker ps
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8000
nginx -t
journalctl -u nginx -n 100 --no-pager
```

---

## Problem: 401 Unauthorized from backend
### Likely causes
- request made without API key
- JWT/anon/service keys mismatch

### Fix
- direct open of backend root can return 401 normally
- if app calls fail, regenerate anon/service keys from same JWT secret

---

## Problem: edge functions not deploying
### Likely causes
- CLI not linked
- wrong project ref
- missing secrets
- runtime import/dependency issue

### Fix
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy authenticate
```
Then inspect logs.

---

## Problem: login fails after successful deployment
### Likely causes
- `portal_users` data missing
- `user_roles` mapping missing
- service role key wrong in edge function runtime
- backend URL mismatch

### Fix
- inspect `authenticate` function logs
- verify `portal_users` row exists
- verify matching `user_roles` row exists
- verify frontend build uses production backend URL

---

## Problem: emails not sending
### Likely causes
- missing `RESEND_API_KEY`
- missing `RESEND_FROM_EMAIL`
- sender not verified
- cron dispatcher not running

### Fix
- set runtime secrets
- verify sender/domain in Resend
- test queue dispatcher manually

---

# 8) Best practice: what to deploy first every time

## Correct sequence
1. VPS base setup
2. DNS
3. self-hosted Supabase
4. SSL
5. database schema / auth / storage / secrets
6. edge functions
7. frontend build and deploy
8. validation tests

## Never do this order
- frontend first
- then backend later

That is exactly how blank page and auth mismatch problems repeat.

---

# 9) What I already fixed in the codebase for production readiness

I already applied these fixes in your project:

1. **Startup error handling added**
   - app now shows a readable configuration error instead of silent blank page when production env is missing

2. **Docker build validation added**
   - image build now fails early if required frontend env vars are missing

3. **Docker healthcheck added**
   - easier detection of unhealthy frontend container

4. **Nginx app config hardened**
   - health endpoint
   - security headers
   - larger upload limit

5. **Edge-function dependency stability improved**
   - changed main self-hosted functions away from fragile remote Supabase client import style

6. **Production email safety improved**
   - removed test fallback sender from ticket email function

These reduce repeat deployment mistakes.

---

# 10) About remote deployment by root access

Yes, if you give working SSH access, I can attempt remote deployment steps.

## What I would need
- SSH host: `187.127.142.127`
- username: usually `root`
- password or SSH private key
- confirmation that firewall allows SSH

## Important
Without working SSH credentials inside this environment, I can only prepare exact commands and files.
If you provide access in a usable way here, I can try the remote steps.

---

# 11) Final foolproof checklist

Before calling deployment complete, all must be true:

- [ ] `emp-cms.in` opens app over HTTPS
- [ ] `supabase.emp-cms.in` resolves correctly over HTTPS
- [ ] frontend container running on 127.0.0.1:3000
- [ ] backend gateway running on 127.0.0.1:8000
- [ ] frontend built with production `VITE_SUPABASE_URL`
- [ ] frontend built with production anon/publishable key
- [ ] self-hosted backend env uses same JWT family for anon/service keys
- [ ] all required secrets set for functions
- [ ] all edge functions deployed
- [ ] login works for all 9 portal types
- [ ] storage uploads work
- [ ] DB create/update works
- [ ] auth email works
- [ ] ticket email works
- [ ] no service-role key exposed to frontend
- [ ] SSL active for both domains

If even one is false, deployment is **not** complete.

---

# 12) My final recommendation for you

For your case, the simplest and safest production path is:

- **Ubuntu 22.04 LTS**
- **Manual Docker + Nginx**
- **Self-hosted Supabase first**
- **Frontend second**
- **SSL after DNS**
- **Edge functions after secrets**
- **Full validation after both are connected**

This is the least confusing and lowest-risk setup for your internal company portal.
