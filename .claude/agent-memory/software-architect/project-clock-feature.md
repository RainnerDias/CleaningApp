---
name: project-clock-feature
description: Clock in/out feature design decisions for Casa Limpa scheduling feature
metadata:
  type: project
---

Architecture proposal delivered for the clock in/clock out feature (Phase 1 & 2).

**Key decisions:**

- New POST /api/schedules/[id]/clock endpoint with body { action: "in" | "out" }
- Two new nullable DB columns: started_at TIMESTAMPTZ, stopped_at TIMESTAMPTZ
- Atomic updateMany pattern in repository for idempotent clock writes (avoids TOCTOU race)
- Clock actions authorized to schedule owner ONLY (not admin — differs from updateStatus)
- Auto-stop on completion handled in service layer using data already read for auth check
- stoppedAt cleared (set null) when status reverts to pending; startedAt is preserved
- Dashboard adds avgActualMinutes + timedTaskCount KPIs (query 12 in parallel batch)
- ScheduleWithDetails extended with startedAt/stoppedAt (ISO strings | null)
- No-op (idempotent) returns 200 with current state; clock-out before clock-in returns 409

**Resolved decisions applied:**

- OQ-007: stoppedAt cleared on pending revert; startedAt preserved (timer resumes)
- OQ-002: Floor to nearest minute (EXTRACT EPOCH / 60)::int
- OQ-003: Hidden UI controls (not disabled)
- OQ-005: Aggregate KPI only — avgActualMinutes + timedTaskCount in DashboardData

**Why:** Feature requested to measure actual task duration vs. estimated for operational insights.
**How to apply:** Backend engineer implements from this spec. All future dashboard KPI changes should follow the parallel-query batch pattern in dashboardService.ts.
