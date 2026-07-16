---
name: project-stack
description: Technology stack for Casa Limpa (CleaningApp) — runtime, frameworks, tooling, and deployment platform
metadata:
  type: project
---

Casa Limpa is a household cleaning management app (Next.js fullstack).

Stack:

- Framework: Next.js (^16), React 19, TypeScript (6.0.3)
- Styling: Tailwind CSS v4
- ORM: Prisma 7 with `@prisma/adapter-pg` (PostgreSQL via `pg`)
- Auth/DB backend: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- State: Zustand, TanStack Query
- Forms: React Hook Form + Zod
- Package manager: npm
- Node version: 20
- Linter: ESLint v10 flat config (`eslint.config.js`)
- Formatter: Prettier
- Pre-commit: Husky + lint-staged
- Unit tests: Vitest
- E2E tests: Playwright (chromium + mobile/iPhone 12 projects, testDir: `./e2e`)
- Deployment: Vercel (auto-deploy on push to main via GitHub integration)
- Repo: RainnerDias/CleaningApp (GitHub)

**Why:** Recorded to calibrate infrastructure decisions — e.g., build env vars needed for Next.js static analysis without a live Supabase session.

**How to apply:** Any infrastructure change should respect the npm-only package manager, Node 20 runtime, and Vercel-as-deployment-platform constraint. No container/Kubernetes concerns exist currently.
