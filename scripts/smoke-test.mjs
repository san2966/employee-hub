#!/usr/bin/env node
// Post-deploy smoke tests:
//  1) HTTP health check against the deployed site
//  2) Supabase CRUD on key tables (insert -> read -> delete)
//  3) Auth edge function ping with a known test user
//
// Required env vars (set as GitHub Actions secrets):
//   HEALTH_URL                         e.g. https://emp-cms.in/health
//   SUPABASE_URL                       e.g. https://notify.emp-cms.in
//   SUPABASE_SERVICE_ROLE_KEY          service role JWT (for CRUD)
//   SUPABASE_ANON_KEY                  anon JWT (for edge function call)
//   SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD   credentials for /authenticate

const required = [
  "HEALTH_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "SMOKE_TEST_EMAIL",
  "SMOKE_TEST_PASSWORD",
];
for (const k of required) {
  if (!process.env[k]) {
    console.error(`Missing required env var: ${k}`);
    process.exit(1);
  }
}

const {
  HEALTH_URL,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
  SMOKE_TEST_EMAIL,
  SMOKE_TEST_PASSWORD,
} = process.env;

const TAG = `ci-smoke-${Date.now()}`;
const results = [];
let failed = false;

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failed = true;
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

async function rest(path, init = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`);
  return body;
}

// 1) Health check
try {
  const r = await fetch(HEALTH_URL);
  record("HTTP health check", r.ok, `status=${r.status}`);
} catch (e) {
  record("HTTP health check", false, e.message);
}

// 2) Supabase CRUD across key tables
const ids = {};
try {
  const dt = await rest("/director_tasks", {
    method: "POST",
    body: JSON.stringify({
      department: "CI",
      task: TAG,
      expected_days: 1,
      status: "Pending",
    }),
  });
  ids.director_tasks = dt[0].id;
  record("Insert director_tasks", true, `id=${ids.director_tasks}`);
} catch (e) { record("Insert director_tasks", false, e.message); }

try {
  const t = await rest("/tenders", {
    method: "POST",
    body: JSON.stringify({ title: TAG, status: "Active" }),
  });
  ids.tenders = t[0].id;
  record("Insert tenders", true, `id=${ids.tenders}`);
} catch (e) { record("Insert tenders", false, e.message); }

try {
  const v = await rest("/visitors", {
    method: "POST",
    body: JSON.stringify({
      name: TAG, phone: "0000000000", purpose: "smoke",
      visit_date: new Date().toISOString().slice(0, 10),
    }),
  });
  ids.visitors = v[0].id;
  record("Insert visitors", true, `id=${ids.visitors}`);
} catch (e) { record("Insert visitors", false, e.message); }

try {
  const vh = await rest("/vehicles", {
    method: "POST",
    body: JSON.stringify({ vehicle_number: TAG, vehicle_type: "Smoke" }),
  });
  ids.vehicles = vh[0].id;
  record("Insert vehicles", true, `id=${ids.vehicles}`);
} catch (e) { record("Insert vehicles", false, e.message); }

// Read back
for (const [table, id] of Object.entries(ids)) {
  try {
    const rows = await rest(`/${table}?id=eq.${id}&select=id`);
    record(`Read ${table}`, Array.isArray(rows) && rows.length === 1);
  } catch (e) { record(`Read ${table}`, false, e.message); }
}

// 3) Auth edge function ping
try {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      email: SMOKE_TEST_EMAIL,
      password: SMOKE_TEST_PASSWORD,
    }),
  });
  const body = await r.json().catch(() => ({}));
  record(
    "Auth edge function",
    r.ok && !!(body.user || body.authUser || body.id || body.success),
    `status=${r.status}`,
  );
} catch (e) { record("Auth edge function", false, e.message); }

// Cleanup — always attempt
for (const [table, id] of Object.entries(ids)) {
  try {
    await rest(`/${table}?id=eq.${id}`, { method: "DELETE" });
    record(`Cleanup ${table}`, true);
  } catch (e) { record(`Cleanup ${table}`, false, e.message); }
}

console.log("\nSummary:");
for (const r of results) {
  console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}`);
}
process.exit(failed ? 1 : 0);