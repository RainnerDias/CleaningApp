---
name: cleaning-app-security-posture
description: Security posture, confirmed findings, and accepted risks for the Household Cleaning Planner app — updated after Phase 6.2 full audit
metadata:
  type: project
---

Security review completed 2026-07-16 (Phase 6.2). Verdict: CONDITIONAL PASS.

## Stack

- Next.js 16, TypeScript, Prisma 7 (pg driver), Supabase SSR auth + Storage, Zod validation, Tailwind/shadcn UI

## Auth Architecture

- Supabase SSR cookies for session; middleware calls `supabase.auth.getUser()` on every request
- `getCurrentUser()` in `authService.ts` cross-checks Supabase session against Prisma `users` table; also checks `active` flag
- Role is fetched from DB (not from JWT claims) — correct pattern
- Admin access gated by `requireAdmin()` which throws; callers catch and return 401

## Known HIGH Findings (must fix before production)

1. **Open redirect in /auth/callback** — `next` param used without path validation in `src/app/auth/callback/route.ts` line 8 (CWE-601)
2. **Password change without current-password re-auth** — `POST /api/profile/password` in `src/app/api/profile/password/route.ts` (CWE-620, ASVS 2.1.7)
3. **No rate limiting on any endpoint** — no `@upstash/ratelimit` or similar; auth-adjacent endpoints are fully exposed to brute force

## Known MEDIUM Findings

4. **File upload MIME-only validation** — `file.type.startsWith('image/')` is client-supplied; SVG upload is possible; no magic byte check (CWE-434)
5. **Missing HTTP security headers** — no CSP, HSTS, X-Frame-Options in `next.config.ts`
6. **Settings API no key allowlist** — `/api/settings?key=X` returns any setting key to any authenticated user
7. **Audit log RLS INSERT policy too broad** — any authenticated user can INSERT via direct Supabase client
8. **ENV var name mismatch** — code uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`; `.env.local.example` shows `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
9. **No CSRF tokens** — state-mutating API routes lack explicit CSRF protection (partially mitigated by SameSite=Lax)
10. **Internal error messages leaked** — `err.message` pattern in multiple API 500 handlers

## Positive Controls (confirmed working)

- Prisma ORM used exclusively for DB = no SQL injection risk
- Zod validation on all inputs, server-side
- `server-only` imports correctly used on admin/server modules
- Admin client isolated with null-checks for env vars
- File path sanitization in photo upload (replaces non-alphanum chars)
- User-ID scoping enforced in user-facing schedule endpoints
- RLS policies applied to all 10 tables
- `.gitignore` excludes `.env*` files
- No hardcoded secrets found in source code
- `active` flag prevents deactivated users
- Role verified against DB, not JWT

**Why:** Full audit result. These findings should shape future development decisions.
**How to apply:** When modifying auth, upload, or admin routes, verify fixes for items 1–10 are present. Don't introduce patterns that contradict the positive controls.
