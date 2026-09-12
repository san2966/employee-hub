# Make VPS Deployments Reliably Sync

## Diagnosis

The supplied log contains continuous successful health checks and successful JavaScript/CSS downloads. It does not show an application crash. The VPS is serving a working frontend image, but there is no proof that it is the newest image.

The deployment currently publishes the container on port `8080`, while the production runbook contains an older reverse-proxy example using port `3000`. The workflow also applies no VPS database patches and verifies health without confirming the deployed commit. These gaps can leave an older frontend visible even after a successful workflow.

## Changes

1. **Add an identifiable release version**
   - Pass the Git commit SHA and build timestamp into the Docker build.
   - Expose them through a small static version file in the deployed frontend.
   - Keep secrets out of that file.

2. **Strengthen deployment verification**
   - After replacing the container, verify its exact image tag matches the workflow commit.
   - Verify the container reports healthy on `127.0.0.1:8080`.
   - Verify the public domain reports the same release SHA.
   - Fail deployment when the public domain still points to another/older container.

3. **Prevent stale page caching**
   - Set `index.html` and the version file to `no-store`/`no-cache`.
   - Keep one-year immutable caching only for fingerprinted assets.

4. **Align VPS instructions with the real deployment**
   - Correct the production runbook to use `http://127.0.0.1:8080` consistently.
   - Add commands to find duplicate old containers, validate the host proxy, compare direct/public versions, and recover safely.
   - Document that frontend deployment does not apply database patches automatically.

5. **Document the pending database update**
   - Include the exact command and verification query for `2026-09-05_business_multi_area.sql`.
   - Preserve production data by applying only the incremental patch, never the full schema.

## Validation

- Build the production image/assets successfully.
- Confirm the version marker contains the current commit.
- Confirm cache headers are correct for `/`, `/index.html`, `/version.json`, and `/assets/*`.
- Confirm deployment and smoke-test scripts remain valid.

## VPS recovery after merging

Run the updated GitHub workflow from `main`, then verify that the running `emp-cms` image, `http://127.0.0.1:8080/version.json`, and `https://emp-cms.in/version.json` all report the same commit. If they differ, fix the host reverse proxy or remove the obsolete frontend container before rerunning deployment.
