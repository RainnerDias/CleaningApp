# Casa Limpa

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/)

**Household cleaning management, simplified.**

Casa Limpa is a mobile-first web application that helps households stay on top of their cleaning routines. Administrators define rooms, tasks, and frequency rules; the scheduling engine automatically assigns and distributes tasks across team members. Users see exactly what needs to be done today, mark tasks complete with photos and comments, and track their history over time.

---

## Screenshots

> Screenshots will be added after the first production deployment.

---

## Features

- **Admin dashboard** — at-a-glance summary of pending, completed, and overdue tasks with trend charts.
- **Scheduling engine** — auto-generates schedules from frequency rules (daily, weekly, biweekly, monthly, or custom), with round-robin assignment across users and idempotent batch upsert to avoid duplicates.
- **User today-view** — a focused list of tasks assigned to the logged-in user for the current day, sorted by room and priority.
- **Task completion** — users check off tasks with optional written comments and photo uploads; all completions are timestamped and attributed.
- **PDF, Excel, and CSV exports** — admins can export task history and performance reports in three formats for offline analysis or stakeholder sharing.
- **Audit logs** — every create, update, and delete action is recorded with actor identity, timestamp, and before/after values.
- **Row-Level Security (RLS)** — enforced at the database level via Supabase RLS policies; users can only read and write their own records, admins can access all records.
- **Calendar view** — full month and week calendar powered by FullCalendar v6, showing schedule status at a glance.
- **User management** — admins can invite, edit, and soft-disable users without deleting historical data.
- **Profile management** — users can update their display name, avatar, and password without admin involvement.

---

## Tech stack

| Layer        | Technology                                                           |
| ------------ | -------------------------------------------------------------------- |
| Framework    | Next.js (latest) with App Router                                     |
| UI library   | React 19, shadcn/ui (New York, slate), Tailwind CSS v4               |
| Icons        | Lucide React                                                         |
| Animations   | Framer Motion                                                        |
| Calendar     | FullCalendar v6                                                      |
| Charts       | Recharts                                                             |
| Forms        | React Hook Form + Zod                                                |
| Server state | TanStack Query v5                                                    |
| Client state | Zustand                                                              |
| Auth         | Supabase Auth (SSR)                                                  |
| Database     | Supabase PostgreSQL via Prisma 7 (`@prisma/adapter-pg`, WebAssembly) |
| Storage      | Supabase Storage                                                     |
| Exports      | `@react-pdf/renderer`, ExcelJS                                       |
| Unit tests   | Vitest + Testing Library                                             |
| E2E tests    | Playwright                                                           |
| Linting      | ESLint v10 flat config + Prettier                                    |
| Git hooks    | Husky + lint-staged                                                  |
| Deployment   | Vercel                                                               |

---

## Prerequisites

- **Node.js 20+** and **npm** — [nodejs.org](https://nodejs.org)
- A **Supabase** account and project — [supabase.com](https://supabase.com)
- A **Vercel** account (for deployment) — [vercel.com](https://vercel.com)

---

## Local development

### 1. Clone the repository

```bash
git clone https://github.com/your-org/casa-limpa.git
cd casa-limpa
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set each variable:

| Variable                               | Description                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Your Supabase project URL (e.g. `https://xyz.supabase.co`)                                                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (safe for the browser)                                                             |
| `SUPABASE_SECRET_KEY`                  | Supabase service-role key (server-side only — never expose to the browser)                                       |
| `DATABASE_URL`                         | PostgreSQL connection string in **transaction mode** (port 6543, append `?pgbouncer=true`) — used for migrations |
| `DIRECT_URL`                           | PostgreSQL **direct** connection string (port 5432) — used for Prisma migrations                                 |
| `SESSION_URL`                          | PostgreSQL **direct** connection string (port 5432) — used for the Prisma client singleton at runtime            |

> **Note on Prisma 7:** This project uses `@prisma/adapter-pg` (WebAssembly engine). The database URL is read from `prisma.config.ts`, not from `schema.prisma`. The config file manually loads `.env.local` because the Prisma CLI does not load it automatically.

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

### 5. Seed the database

```bash
npx prisma db seed
```

The seed command is configured in `prisma.config.ts` under `migrations.seed`.

### 6. Apply Row-Level Security policies

In the Supabase dashboard, open the **SQL Editor** and run the contents of:

```
supabase/rls-policies.sql
```

This applies all RLS policies that restrict data access by user role.

### 7. Create Supabase Storage buckets

In the Supabase dashboard, go to **Storage** and create two buckets:

| Bucket        | Access                   |
| ------------- | ------------------------ |
| `avatars`     | Authenticated users only |
| `task-photos` | Authenticated users only |

### 8. Start the development server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

---

## Running tests

| Command                    | What it runs                                |
| -------------------------- | ------------------------------------------- |
| `npm test`                 | Vitest unit test suite (128 tests)          |
| `npx playwright test`      | Playwright end-to-end test suite (37 tests) |
| `npx playwright test --ui` | Playwright in interactive UI mode           |
| `npm run type-check`       | TypeScript type check (no emit)             |
| `npm run lint`             | ESLint with zero warnings allowed           |
| `npm run format`           | Prettier formatter                          |

---

## Deployment

Casa Limpa is designed for deployment on **Vercel**.

1. Push the repository to GitHub (or another Git provider supported by Vercel).
2. Import the repository in the Vercel dashboard.
3. Add all environment variables from your `.env.local` under **Project Settings → Environment Variables**.
4. Vercel will automatically deploy every push to `main`.

> **Important:** Never commit `.env.local` or any file containing real secrets. The `.gitignore` already excludes it.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit conventions, the PR checklist, and code standards.
