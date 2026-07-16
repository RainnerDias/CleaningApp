---
name: project-e2e-patterns
description: Playwright e2e test patterns, known constraints, and fixture design decisions for the CleaningApp
metadata:
  type: project
---

The e2e test suite lives in `e2e/` and is structured around 8 spec files + 2 fixtures.

**Critical constraint — server-side auth**: Admin and user pages use `requireAdmin()` / `getCurrentUser()` from `@supabase/ssr` (cookie-based). `page.route()` only intercepts client-side fetches; server-side redirects happen before the browser receives HTML. Full e2e execution requires valid Supabase session cookies OR a test mode that bypasses auth.

**Why:** This is a Next.js App Router project where most data pages are server components. The fixture mocking `/api/auth/me` only helps client-side auth checks (e.g. role-based routing after login). It cannot bypass `requireAdmin()`.

**How to apply:** When writing or reviewing e2e tests for admin/user pages, note that they will redirect to `/login` without a real Supabase session. The tests compile and assert the right UI selectors — they are designed for a future environment with session setup (e.g. `storageState` seeded from a real login).

**Pre-existing TypeScript errors**: `MonthClient.tsx` has 3 type errors (FullCalendar `@fullcalendar/core` module resolution + `DateClickArg.date` missing). `tsc --noEmit` exits 2. Do NOT treat this as a regression from QA work — it predates the e2e suite.

**ESLint false-positive fix**: `react-hooks/rules-of-hooks` fires when Playwright's `use` fixture parameter is named `use` (matches the React hook pattern). Workaround: rename the parameter to `runFixture` in `e2e/fixtures/auth.fixture.ts`. Do not revert to `use` or the lint check will fail.

**Calendar page**: Currently an EmptyState stub. Tests TC-040 through TC-043 in `admin-calendar.spec.ts` target the intended FullCalendar UI and will not pass until the feature is implemented. This is intentional — the tests drive the future implementation.

**Selectors grounded in source**: All selectors were derived from actual component source (aria-labels, input ids, role attributes). Key ones:

- Login: `#email`, `#password`, button `"Sign in"`, heading `"Casa Limpa"`
- Rooms: button `"Nova Sala"`, `#room-name`, `#room-icon`, aria-label `"Editar sala {name}"`, `"Excluir sala {name}"`
- Today: heading `"Bom dia, {firstName}!"`, `role="progressbar"`, `role="status"` (celebration), `aria-label="Novo comentário"`, button `"Ignorar"`, text `"Tem certeza?"`
- Reports: `aria-label="Exportar como CSV/Excel/PDF"`, action badges with `bg-green-100` / `bg-red-100`
