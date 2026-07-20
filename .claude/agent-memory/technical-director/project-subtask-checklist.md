---
name: project-subtask-checklist
description: Subtask/checklist system implementation decisions — TaskItem model, auto-completion logic, seed data mapping
metadata:
  type: project
---

TaskItem and ScheduleItemCompletion tables were added via `prisma db push` (not migrate dev) because the DB predates migration history — standard for this Supabase project.

All 68 task items were seeded via `prisma/seed-task-items.ts` (separate from `prisma/seed.ts`). The seed is idempotent — skips tasks that already have items.

**Why:** User requested per-room subtask checklists; schedule auto-completes only when all active items are checked.

**How to apply:** Any future expansion of task items (new rooms, new subtasks) should use `prisma/seed-task-items.ts` pattern — check for existing items, then insert with displayOrder starting at 0.

Room → task mapping used for seed:

- Cozinha → Limpeza da Cozinha (11 items)
- Despensa → Limpeza da Despensa (7 items)
- Sala → Limpeza da Sala (9 items)
- Garagem → Limpeza da Garagem (3 items)
- Corredor e Escada → Limpeza do Corredor e Escada (3 items, includes both escada and corredor items)
- Suíte → Limpeza da Suíte (21 items — banheiro + quarto combined into one task)
- Banheiros → Limpeza dos Banheiros (7 items — banheiro crianças)
- Escritório → Limpeza do Escritório (7 items)

Key architectural decisions:

- `scheduleInclude` was extended once to include `task.items` + `itemCompletions` — all schedule endpoints now carry this data, avoiding additional client fetches
- `toggleItemCompletion` runs inside a single Prisma `$transaction` — completion upsert + schedule status update are atomic
- Main task checkbox in TodayClient is `disabled` when checklist items exist; completion is driven solely by all items being checked
- SubtaskEditor in TaskDialog only renders for existing tasks (isEditing === true) — new tasks require save first

[[project-prisma7-ts7-ecosystem]]
