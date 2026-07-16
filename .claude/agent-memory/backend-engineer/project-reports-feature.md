---
name: project-reports-feature
description: Phase 5.2 — Admin Reports, Exports (PDF/Excel/CSV), and Audit Logs implementation details
metadata:
  type: project
---

Reports and Audit Logs feature was implemented in Phase 5.2.

**Why:** Admin visibility into task completion history and system change tracking.

**How to apply:** When extending or modifying the reports feature, refer to the established patterns below.

## Feature structure

- `src/features/reports/types/index.ts` — ReportRow, AuditLogRow, filters, response types
- `src/features/reports/services/pdfGenerator.tsx` — server-only PDF via @react-pdf/renderer (must be .tsx)
- `src/features/reports/hooks/useReports.ts` — useReports, useReportExportData, useAuditLogs
- `src/features/reports/components/ReportsClient.tsx` — admin reports UI
- `src/features/reports/components/AuditLogsClient.tsx` — audit logs UI

## API routes

- `GET /api/admin/reports` — paginated, returns summary + data + pagination
- `GET /api/admin/reports/export?format=xlsx|pdf` — full dataset file download
- `GET /api/admin/audit-logs` — paginated audit log entries with search

## Key implementation notes

- PDF uses @react-pdf/renderer; `renderToBuffer` returns `Buffer` (Node.js)
- To pass Buffer to `new Response(...)`: use `Uint8Array.from(buffer)` — this produces `Uint8Array<ArrayBuffer>` which TypeScript accepts as `BodyInit` (avoids ArrayBufferLike vs ArrayBuffer mismatch)
- ExcelJS `xlsx.writeBuffer()` returns `Buffer`; same pattern: `Uint8Array.from(buffer)`
- The `where` clause typing for Prisma uses `Prisma.ScheduleWhereInput` (import from @prisma/client)
- CSV export is client-side: fetches `/api/admin/reports?limit=9999` then generates CSV in browser
- Audit log search uses `{ OR: [...contains...] }` across action, entityType, entityId
- react-hooks/exhaustive-deps: avoid naming local fetch response variables `data` when a `data` state var exists in scope — ESLint falsely flags the collision. Use `rows`, `result`, or destructure with alias `{ data: rows }`.

## Packages added

- @react-pdf/renderer (PDF generation, server-only)
- exceljs (Excel .xlsx generation, server-only)
  Both installed with --legacy-peer-deps due to React 19 peer dep conflicts.
