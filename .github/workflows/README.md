# CI/CD: Build → Deploy to VPS → Smoke Test

Workflow: `.github/workflows/deploy.yml`. Triggers on push to `main` and via manual dispatch.

## Pipeline stages

1. **build-and-push** — builds the Docker image with Vite build args and pushes to GHCR:
   - `ghcr.io/<owner>/<repo>:<sha7>`
   - `ghcr.io/<owner>/<repo>:latest`
2. **deploy** — creates a remote docker context over SSH (`ssh://USER@HOST`), pulls the image on the VPS, replaces the running container, and waits for the Dockerfile `HEALTHCHECK` to report healthy.
3. **smoke-test** — runs `scripts/smoke-test.mjs`:
   - GETs `HEALTH_URL` and expects 2xx
   - Inserts → reads → deletes test rows in `director_tasks`, `tenders`, `visitors`, `vehicles` via PostgREST using the service role key
   - POSTs to the `authenticate` edge function with `SMOKE_TEST_EMAIL` / `SMOKE_TEST_PASSWORD`
   - Always cleans up inserted rows; exits non-zero on any failure

## Required GitHub repository secrets

Settings → Secrets and variables → Actions → New repository secret.

| Secret | Purpose |
|---|---|
| `VPS_SSH_HOST` | VPS hostname or IP (e.g. `vps.emp-cms.in`) |
| `VPS_SSH_USER` | SSH user with docker access (e.g. `root` or `deploy`) |
| `VPS_SSH_PRIVATE_KEY` | Full private key (OpenSSH format, include header/footer) |
| `VITE_SUPABASE_URL` | Same value as local `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same value as local `.env` |
| `VITE_SUPABASE_PROJECT_ID` | Same value as local `.env` |
| `HEALTH_URL` | Public URL hit by smoke test (e.g. `https://emp-cms.in/health`) |
| `SMOKE_SUPABASE_URL` | Self-hosted Supabase base URL (e.g. `https://notify.emp-cms.in`) |
| `SMOKE_SUPABASE_SERVICE_ROLE_KEY` | Service role JWT — used for CRUD smoke tests |
| `SMOKE_SUPABASE_ANON_KEY` | Anon JWT — used for edge function call |
| `SMOKE_TEST_EMAIL` | Email of a dedicated CI test user |
| `SMOKE_TEST_PASSWORD` | Password for that user |

`GITHUB_TOKEN` is provided automatically and grants push access to GHCR.

## One-time VPS setup

On the VPS as the SSH user:

```bash
# 1. Allow this user to run docker without sudo
sudo usermod -aG docker $USER

# 2. Authenticate to GHCR so pulls work (use a PAT with read:packages)
echo <GHCR_PAT> | docker login ghcr.io -u <github-username> --password-stdin

# 3. Add the workflow's public key to ~/.ssh/authorized_keys
```

If the VPS image is currently managed by Dokploy, disable Dokploy's auto-deploy for this app so the two systems don't fight over the container.

## Tweaks

- Container name / host port: edit `CONTAINER_NAME` and `HOST_PORT` in `deploy.yml`.
- Add more tables to the CRUD test: extend `scripts/smoke-test.mjs`.
- To deploy only on tagged releases, change the `on:` trigger to `push: tags: ['v*']`.