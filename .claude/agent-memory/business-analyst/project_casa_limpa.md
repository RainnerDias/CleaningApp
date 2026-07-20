---
name: project-casa-limpa
description: Casa Limpa cleaning app — project context, domain terminology, and active feature work
metadata:
  type: project
---

Casa Limpa is a cleaning services management application with a Next.js 16 App Router frontend, Supabase Auth, Prisma ORM on PostgreSQL, TanStack Query, and shadcn/ui.

**Domain terminology:**

- Iniciar = clock in ("start" button, Portuguese)
- Encerrar = clock out ("end" button, Portuguese)
- Limpador/Limpadora = Cleaner (the field worker role)
- Administrador = Admin (the supervisory/scheduling role)
- Previsto = Estimated (duration label)
- Tempo = Actual time spent (duration label)

**Core data models (as of Phase 1):**

- `Schedule`: id, date, taskId, assignedTo, status (pending/completed/skipped), completedAt, createdAt, updatedAt
- `Task`: estimatedMinutes (the estimated duration reference field)
- Authorization: `scheduleService.updateStatus` — admins can update any schedule; users can only update their own

**Active feature (as of 2026-07-15):** Clock in/clock out for task time tracking (Phase 2 Requirements Analysis delivered). Schema additions: `startedAt` and `stoppedAt` nullable timestamps on `Schedule`.

**PM resolved decision:** When status → completed AND startedAt IS NOT NULL AND stoppedAt IS NULL, auto-set stoppedAt = now(). This is a hard rule.

**Why:** Admin needs actual vs estimated time on the dashboard to adjust scheduling accuracy.

**How to apply:** All requirements and architecture decisions for this feature should treat the auto-set rule as non-negotiable. Open questions around admin time correction and task reversal (completed → pending) are still unresolved.

[[project-feature-clock-in-out]]
