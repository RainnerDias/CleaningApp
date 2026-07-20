---
name: project-casa-limpa
description: Casa Limpa is a household cleaning management web app — core domain, personas, and feature backlog context
metadata:
  type: project
---

Casa Limpa is a household cleaning management web app. Two primary personas: **Cleaners** (task executors who see their daily assigned tasks and mark them complete) and **Admins** (who monitor analytics via a dashboard).

**Why:** The product exists to coordinate cleaning operations, track task completion, and surface operational metrics to admins.

**How to apply:** All user stories and acceptance criteria must be framed around these two personas. Feature decisions must preserve the simplicity of the cleaner experience — they are field workers, likely on mobile, interacting with the app briefly per task.

## Active Backlog Context

### Clock In / Clock Out (Phase 1 Discovery — 2026-07-15)

Optional time-tracking feature. Cleaners can tap "Iniciar" (clock in) to record `startedAt` and "Encerrar" (clock out) to record `stoppedAt`. The existing task completion checkbox is unaffected. Admins see actual vs. estimated time metrics on the dashboard.

Key design constraint: the feature is strictly optional — zero regression to the existing completion flow is a hard requirement.

**How to apply:** Any future feature touching the task card or admin dashboard must account for the presence of `startedAt` / `stoppedAt` fields and the optional time display.
