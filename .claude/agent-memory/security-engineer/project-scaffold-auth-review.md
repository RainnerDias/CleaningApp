---
name: project-scaffold-auth-review
description: Security review of CleaningApp scaffold — Supabase SSR middleware, client/server Supabase setup, Prisma singleton, and env var patterns
metadata:
  type: project
---

Initial security review of the CleaningApp scaffold (2026-07-15).

**Stack:** Next.js App Router, Supabase SSR (`@supabase/ssr`), Prisma ORM, TypeScript.

**Auth pattern:** Supabase email/password + (planned) OAuth. Session managed via HTTP-only cookies using `@supabase/ssr` cookie adapters.

**Findings from scaffold review:**

HIGH — Middleware whitelist only excludes `/login`. No `/auth/callback` exclusion exists. When OAuth or magic-link flows are added, the callback route will be blocked by the middleware before a session can be established, causing an infinite redirect loop. Fix before OAuth is implemented.

MEDIUM — `src/lib/prisma.ts` has no `import 'server-only'` guard. Accidental client-component import fails at runtime rather than build time.

MEDIUM — Middleware redirects API routes (`/api/...`) to `/login` as a 302 HTML response rather than returning 401 JSON. This breaks API clients.

LOW — Environment variables use TypeScript `!` non-null assertions. No runtime validation at startup — missing vars produce cryptic downstream errors instead of clear startup failures.

INFORMATIONAL — Correctly uses `getUser()` (server-validated) not `getSession()` (client-trusting) in middleware. No service role key leakage found. No NEXT_PUBLIC_ prefix on sensitive vars.

**Security Approval result:** FAIL (one HIGH finding unresolved).

**Why:** These decisions load into future reviews to avoid re-discovering the same issues.
**How to apply:** When reviewing new auth routes or OAuth additions, re-check the middleware whitelist and the API 401 vs redirect pattern.
