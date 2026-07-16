import { requireAdmin } from '@/features/auth/services/authService'
import { AuditLogsClient } from '@/features/reports/components/AuditLogsClient'

/**
 * Admin Audit Logs page — server component.
 *
 * Validates admin access then renders the client shell.
 * No initial data is pre-fetched here — the client component loads data via
 * TanStack Query so the page opens instantly and filters trigger on-demand.
 */
export default async function AuditLogsPage() {
  await requireAdmin()
  return <AuditLogsClient />
}
