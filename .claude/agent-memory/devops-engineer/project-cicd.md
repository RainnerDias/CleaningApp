---
name: project-cicd
description: CI/CD pipeline design for Casa Limpa (CleaningApp) — GitHub Actions workflow structure, Vercel deployment, and key constraints
metadata:
  type: project
---

CI/CD pipeline established via `.github/workflows/ci.yml` with four jobs: `quality` (lint + typecheck), `unit-tests` (depends on quality), `e2e-tests` (depends on quality, push to main only), and `security-scan` (independent, non-blocking).

**Why:** Vercel handles deployment automatically via its GitHub integration — no deploy step exists in the workflow. E2E job is intentionally gated to pushes on main to save PR CI time.

**How to apply:** Do not add a deploy step to the workflow. E2E tests use placeholder env vars for the Next.js build (no live DB needed at build time). Some E2E tests are expected to fail without a real Supabase session — this is documented and accepted.

Key constraints:

- Runner: `ubuntu-latest` for all jobs
- Action versions pinned: `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`
- Node version: 20
- Package manager: npm (npm ci everywhere)
- `npm audit --audit-level=high` uses `continue-on-error: true` — reports findings, never blocks merges
- Vercel cron: POST `/api/schedules/generate` at `0 9 * * *` (09:00 UTC = 06:00 BRT)

[[project-stack]]
