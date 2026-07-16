# Architecture

This document describes the architecture of Casa Limpa: the layered design, folder structure, key data flows, and the reasoning behind every significant technical decision.

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  React 19 · TanStack Query · Zustand · React Hook Form      │
└─────────────────────┬───────────────────────────────────────┘
                      │  HTTP / RSC streaming
┌─────────────────────▼───────────────────────────────────────┐
│               Next.js App Router (Vercel Edge)              │
│  Server Components · Route Handlers · Middleware            │
└──────────┬───────────────────────────────────┬──────────────┘
           │ Server Actions / Route Handlers    │ Supabase SSR
┌──────────▼──────────────┐         ┌──────────▼──────────────┐
│     Feature Services    │         │    Supabase Auth        │
│  (scheduleService, etc.)│         │  (session, JWT, RLS)    │
└──────────┬──────────────┘         └─────────────────────────┘
           │
┌──────────▼──────────────┐
│  Feature Repositories   │
│  (scheduleRepository,   │
│   taskRepository, etc.) │
└──────────┬──────────────┘
           │ Prisma 7 + @prisma/adapter-pg (WebAssembly)
┌──────────▼──────────────┐
│   Supabase PostgreSQL   │
│   (RLS on all tables)   │
└─────────────────────────┘
```

---

## Architecture principles

### Clean Architecture + Domain-Driven Design (DDD)

The codebase is organized into concentric layers. Each layer depends only on the layer below it — never the reverse.

| Layer              | Responsibility                             |
| ------------------ | ------------------------------------------ |
| **Presentation**   | React components, pages, client-side state |
| **Application**    | Use-case coordination, API route handlers  |
| **Domain**         | Business logic, services, domain types     |
| **Infrastructure** | Repositories, Prisma, Supabase clients     |

### Feature-based folder structure

Code is organized by business domain (feature), not by technical type. This means the schedule service, schedule repository, schedule types, schedule hooks, and schedule components all live in `src/features/scheduling/`. Moving or deleting a feature requires touching only one directory.

### Dependency inversion

Services depend on repository interfaces, not on Prisma directly. This makes services independently testable and keeps the ORM choice an infrastructure detail.

---

## Folder structure

```
src/
├── app/                         Next.js App Router pages and API routes
│   ├── (auth)/
│   │   └── login/               Public login page
│   ├── (admin)/                 Admin-only pages (layout applies auth guard)
│   │   ├── dashboard/
│   │   ├── rooms/
│   │   ├── tasks/
│   │   ├── categories/
│   │   ├── users/
│   │   ├── calendar/
│   │   ├── reports/
│   │   └── audit-logs/
│   ├── (user)/                  Regular user pages (layout applies auth guard)
│   │   ├── today/
│   │   ├── week/
│   │   ├── month/
│   │   ├── history/
│   │   └── profile/
│   └── api/                     26 API route handlers (Next.js Route Handlers)
│
├── features/                    One directory per business domain
│   ├── auth/                    getCurrentUser(), session utilities
│   ├── rooms/                   Room CRUD service + repository + types + hooks
│   ├── categories/              Category CRUD service + repository + types + hooks
│   ├── tasks/                   Task CRUD + frequency rules
│   ├── users/                   User management (admin operations)
│   ├── scheduling/              Schedule generation engine + status updates
│   ├── dashboard/               Aggregated metrics and chart data
│   └── reports/                 Export logic (PDF, Excel, CSV) + audit queries
│
├── components/
│   └── ui/                      shadcn/ui components (Button, Card, Dialog, etc.)
│
└── lib/
    ├── supabase/
    │   ├── client.ts            Browser Supabase client (public key)
    │   ├── server.ts            Server Supabase client (SSR cookies)
    │   ├── admin.ts             Supabase admin client (service-role key, server-only)
    │   └── storage.ts           Storage upload/download helpers
    └── prisma.ts                Prisma client singleton (SESSION_URL)
```

---

## Data flow — completing a task

This walkthrough traces a full request cycle from user interaction to database write.

```
1. User taps "Complete" on the Today page
   └── TodayClient.tsx calls useMutation (TanStack Query)
       └── PATCH /api/schedules/:id/status
           └── Route Handler: validates session via getCurrentUser()
               └── Parses body with Zod schema { status, comment?, photoUrl? }
                   └── Calls scheduleService.updateStatus(id, payload, userId)
                       └── Calls scheduleRepository.updateStatus(id, payload)
                           └── Prisma: UPDATE schedules SET status = ...
                               Supabase PostgreSQL (RLS checks user = auth.uid())
                                   └── Returns updated schedule row
                       └── scheduleService logs action to audit_logs table
           └── Returns 200 { data: updatedSchedule }
       └── TanStack Query invalidates ['schedules', 'today'] cache
           └── TodayClient re-renders with updated task status
```

---

## Authentication flow

Casa Limpa uses Supabase Auth with the `@supabase/ssr` package for cookie-based session management in Next.js.

```
1. User submits login form (email + password)
2. Client calls supabase.auth.signInWithPassword()
3. Supabase sets an HttpOnly session cookie
4. Next.js middleware (middleware.ts) reads the cookie on every request
5. Middleware calls supabase.auth.getUser() to validate the session
6. If the session is invalid, middleware redirects to /login
7. In API route handlers, getCurrentUser() reads the cookie via the server client
8. The authenticated user's ID (auth.uid()) is passed to RLS policies in PostgreSQL
9. RLS policies evaluate every query — users only see rows where user_id = auth.uid()
10. Admins bypass user-scoped RLS via a role check in policy definitions
```

The `admin.ts` Supabase client uses the service-role key and bypasses RLS entirely. It is marked `server-only` and used only for admin-triggered operations that legitimately need to read across all users (e.g., schedule generation, report exports).

---

## Scheduling engine

The scheduling engine lives in `src/features/scheduling/`. Its job is to take a set of tasks with frequency rules and produce a set of schedule records for a target date range.

### Frequency matching

Each task has a `frequencies` record that defines:

| Field          | Values                                              |
| -------------- | --------------------------------------------------- |
| `type`         | `daily`, `weekly`, `biweekly`, `monthly`, `custom`  |
| `days_of_week` | Array of weekday numbers (0 = Sunday, 6 = Saturday) |
| `interval`     | Numeric interval for `custom` type                  |

For a given target date, the engine evaluates whether the task's frequency rule fires on that date. For example, a `weekly` task with `days_of_week: [1, 4]` fires every Monday and Thursday.

### Round-robin assignment

When generating schedules, the engine distributes tasks across active users in a round-robin pattern to ensure even workload distribution. The assignment order is deterministic: users are sorted by ID before cycling begins, so re-running generation for the same date range produces the same assignments.

### Idempotency

Schedule generation uses a batch `upsert` (Prisma `createMany` with `skipDuplicates`, or an explicit ON CONFLICT DO NOTHING) keyed on `(task_id, scheduled_date, user_id)`. This means re-running generation for a date range that already has schedules is safe — existing records are not overwritten.

---

## Key design decisions

### Prisma 7 with WebAssembly adapter

**Decision:** Use `@prisma/adapter-pg` instead of the default binary engine.

**Rationale:** Vercel Edge and serverless environments have restrictions on binary file execution. The WebAssembly adapter removes this constraint and allows Prisma to run in any JavaScript runtime. The trade-off is a slightly larger cold-start bundle; the benefit is zero binary-compatibility issues across deployment targets.

**Consequence:** The datasource URL is configured in `prisma.config.ts` (not `schema.prisma`). The config file manually reads `.env.local` because the Prisma CLI does not auto-load it. Developers must be aware that changing the database URL requires editing `prisma.config.ts`, not `.env`.

### Feature-based folder structure

**Decision:** Group files by domain feature, not by technical type.

**Rationale:** Technical grouping (`components/`, `services/`, `repositories/`) causes high friction when working on a single feature because related files are scattered across the tree. Feature grouping keeps everything for one domain in one place, reduces cognitive overhead, and makes ownership clear.

### TanStack Query + Zustand (not Redux)

**Decision:** Use TanStack Query for server state and Zustand for UI state, rather than a unified Redux store.

**Rationale:** Most "state" in this app is remote data (tasks, schedules, users). TanStack Query handles caching, background refetching, loading/error states, and cache invalidation better than a manual Redux approach. Zustand covers the small amount of local UI state (modal open/close, selected filters) with minimal boilerplate.

### Supabase Auth over custom authentication

**Decision:** Use Supabase Auth rather than building a custom JWT system.

**Rationale:** Supabase Auth provides secure session management, password hashing, email verification, and SSR-compatible cookie handling out of the box. Building equivalent infrastructure is significant work with high security risk. The Supabase Auth JWT is also automatically recognized by Supabase RLS policies, eliminating a translation layer.

---

## Security

### Row-Level Security (RLS)

All 10 database tables have RLS enabled. Policies are defined in `supabase/rls-policies.sql` and must be applied manually via the Supabase SQL editor during setup.

Policy summary:

- `users` table: each user can read and update only their own row. Admins can read all rows.
- `rooms`, `categories`, `tasks`, `frequencies`: admins have full CRUD; regular users have read-only access.
- `schedules`: users can read and update (status only) schedules assigned to them. Admins can read all.
- `task_comments`, `task_photos`: users can create and read records linked to their own schedules.
- `audit_logs`, `settings`: admins only.

### `server-only` guard

Files that import the Supabase service-role key or the Prisma singleton are marked with `import 'server-only'`. This causes a build-time error if any of these files are accidentally imported into a Client Component, preventing secrets from leaking to the browser bundle.

### Service-role isolation

The `admin.ts` Supabase client (which uses the `SUPABASE_SECRET_KEY` and bypasses RLS) is only imported in server-side contexts: API route handlers and server-side utilities. It is never used in Client Components or shared utility files.
