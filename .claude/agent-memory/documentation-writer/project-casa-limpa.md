---
name: project-casa-limpa
description: Core project identity and tech stack for Casa Limpa — household cleaning management web app. Read before any documentation session.
metadata:
  type: project
---

Casa Limpa is a mobile-first household cleaning management web app. Admins define rooms, tasks, and frequency rules; a scheduling engine distributes tasks across household members.

**Why:** The project uses this framework as its AI-assisted development scaffold. Documentation must reflect the actual application, not the generic framework README that was the baseline before the first documentation session (2026-07-16).

**How to apply:** Always write documentation for the Casa Limpa product audience (household admins and members), not for framework contributors. The README, CONTRIBUTING.md, ARCHITECTURE.md, docs/API.md, and docs/USER_GUIDE.md are the five canonical docs.

## Stack summary

- Next.js (latest) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (New York, slate)
- Supabase Auth + Storage + Realtime
- Prisma 7 + @prisma/adapter-pg (WebAssembly — no binary engine)
- TanStack Query v5 + Zustand + React Hook Form + Zod
- Recharts + FullCalendar v6 + Framer Motion + Lucide React
- Vitest (128 unit tests) + Playwright (37 e2e tests)
- ESLint v10 flat config + Prettier + Husky + lint-staged
- Deployment: Vercel

## Prisma 7 gotchas (critical for dev setup docs)

- Datasource URL lives in `prisma.config.ts`, NOT `schema.prisma`
- `prisma.config.ts` manually reads `.env.local` (Prisma CLI doesn't auto-load it)
- Seed command configured in `migrations.seed` inside `prisma.config.ts`
- Env vars use non-standard names: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not ANON_KEY), `SUPABASE_SECRET_KEY` (not SERVICE_ROLE_KEY)

## Architecture

Clean Architecture + DDD, feature-based folders under `src/features/`. Ten RLS-enabled Supabase PostgreSQL tables. Two user roles: `admin` (full CRUD, schedule generation, exports, audit logs) and `user` (today view, task completion with photos/comments, history, profile).

## Doc files produced (2026-07-16 baseline)

- `README.md` — replaced framework README with Casa Limpa product README
- `ARCHITECTURE.md` — new, covers layers, data flow, scheduling engine, design decisions, security
- `docs/API.md` — new, all 26 routes documented
- `docs/USER_GUIDE.md` — new, admin guide + user guide + glossary
- `CONTRIBUTING.md` — replaced framework contributing guide with project-specific guide
