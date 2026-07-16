---
name: project-stack
description: Tech stack and key conventions for the Household Cleaning Planner (Casa Limpa) Next.js app
metadata:
  type: project
---

This is a Next.js 16 (App Router, Turbopack) project called Casa Limpa — a Household Cleaning Planner.

**Stack:**

- Next.js 16 with App Router and Turbopack
- React 19
- TypeScript 7 (strict mode)
- TailwindCSS 4 with shadcn design tokens (oklch CSS variables)
- `@base-ui/react` as the component primitive library (Button uses `@base-ui/react/button`)
- `@supabase/ssr` for auth (browser + server clients)
- Prisma 7 with `PrismaPg` adapter (WebAssembly query engine requires a Driver Adapter)
- `react-hook-form` v7 + `@hookform/resolvers` v5 + Zod v4 for form validation
- `@tanstack/react-query` v5 for data fetching
- lucide-react v1 for icons
- FullCalendar 6 (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`, `@fullcalendar/core`) — already in `transpilePackages`
- Vitest for unit tests, Playwright for e2e

**Supabase env vars (new format — NOT anon key):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (NOT `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SECRET_KEY`

**Prisma connection:** uses `SESSION_URL` (port 5432 session-mode pooler), NOT `DATABASE_URL` (transaction pooler). PrismaPg requires session mode.

**Route groups:**

- `(auth)` — login page only
- `(admin)` — admin-protected pages with sidebar layout; routes are at root URL (`/dashboard`, `/calendar`, etc.)
- `(user)` — user-protected pages with bottom-nav layout; routes at root (`/today`, `/week`, etc.)

**Why:** Next.js 16 deprecated `middleware.ts` in favor of `proxy` — but the existing middleware file is kept as-is (architectural decision).

**How to apply:** Whenever adding a new Supabase reference, always use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never use `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Key ESLint rules to watch:**

- `react-hooks/set-state-in-effect`: calling `setState` synchronously inside `useEffect` is an error. Pattern to avoid: `useEffect(() => { setState(prop) }, [prop])`. Use derived initialisation (`useState(prop)`) instead.
- For "is client mounted" SSR guards (needed for Recharts, FullCalendar), use `useSyncExternalStore` — NOT `useState + useEffect`. Pattern:
  ```typescript
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  ```
  This returns `false` on server and `true` on client with no lint violations.

**FullCalendar type imports:**

- `DatesSetArg` → from `@fullcalendar/core`
- `DateClickArg` → from `@fullcalendar/interaction` (NOT from core)

**scheduleRepository pattern:**

- Filtering by related model field: `{ task: { roomId } }` works for many-to-one relations in Prisma v7
- Status filtering: pass `ScheduleStatus` enum value directly from `@prisma/client`

**Profile API routes:**

- Avatar bucket name: `avatars` (separate from `task-photos`)
- Use `createAdminClient()` (service role) for Storage uploads
- Use `createServerClient()` (session-aware) for `supabase.auth.updateUser()` (password changes)

**Data serialisation pattern:**
Server components always JSON round-trip Prisma results before passing to client components:

```typescript
const schedules = JSON.parse(JSON.stringify(rawSchedules)) as ScheduleWithDetails[]
```

**useSchedulesByWeek initialData pattern:**
Pass `initialData` only when the current week matches the server-fetched week (compare formatted Monday strings). This prevents injecting stale data into a different week's React Query cache key.
