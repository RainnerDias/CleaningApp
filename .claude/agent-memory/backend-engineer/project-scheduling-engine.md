---
name: project-scheduling-engine
description: Scheduling engine conventions — date handling, frequency matching, round-robin, test patterns
metadata:
  type: project
---

Phase 3.1 scheduling engine is implemented at `src/features/scheduling/`.

**Key facts:**

- `doesDateMatchFrequency` is exported from `schedulingEngine.ts` to enable direct unit testing.
- Round-robin is per-task (each task has its own user cursor), not global.
- `skipDuplicates: true` in `createMany` is the idempotency mechanism (unique constraint: `[date, taskId, assignedTo]`).
- `Schedule.date` is `@db.Date` (PostgreSQL date, no time). The engine always passes `startOfDay(date)` to avoid timestamp noise.
- Only users with `role: 'user'` AND `active: true` are eligible for assignment. Admins are excluded.

**Timezone trap:** The host (Brazil, UTC-3) means UTC midnight of date X is local July (X-1) at 21:00. In tests:

- Use `new Date(year, month - 1, day)` (local midnight) as inputs to the engine — NOT ISO Z strings.
- Assert dateRange using `getFullYear/getMonth/getDate` (local getters) — NOT `toISOString().startsWith(...)`.
- `new Date('2026-07-13T00:00:00')` (with time, no Z) is local midnight — safe for `doesDateMatchFrequency` tests.

**API routes:**

- `POST /api/schedules/generate` — admin only; optional `{ from, to }` body (ISO date strings).
- `GET /api/schedules?from=&to=[&userId=]` — admin sees all, user sees own.
- `PATCH /api/schedules/[id]/status` — admin or assignedTo only; body `{ status }`.

**Why:** [[project-stack-versions]]
