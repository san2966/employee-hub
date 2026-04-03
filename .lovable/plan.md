## Production Readiness Plan

### 🔴 Critical Security Fixes
1. **Storage bucket policies** — Tender files and purchase files are readable by ALL authenticated users. Will restrict to proper roles only.
2. **Purchase table RLS policies** — 14 purchase tables have policies scoped to `{public}` instead of `{authenticated}`. Will fix all.

### 🟡 Security Warnings  
3. **Enable leaked password protection** — Currently disabled, will enable HIBP check.
4. **Extension in public schema** — pgcrypto is in the public schema (low risk, noted but won't move as it could break existing functions).

### ⚠️ Known Limitation (Cannot Fix)
5. **Realtime channel subscriptions** — The `realtime.messages` table is in a reserved Supabase schema. We cannot add RLS policies to it. This is a platform-level limitation.

### 🧹 Code Quality
6. **91 console.log statements** — Will clean up unnecessary ones for production.
7. **No build errors** — Build is clean ✅

Shall I proceed with fixes 1-4 and 6?