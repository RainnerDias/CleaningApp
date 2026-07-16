/**
 * Types shared between the reports feature's client components, hooks, and API contracts.
 * All date fields are ISO strings (serialized from JSON), matching the API response shape.
 */

// ---------------------------------------------------------------------------
// Report rows
// ---------------------------------------------------------------------------

export interface ReportRow {
  id: string
  /** ISO date string */
  date: string
  status: 'pending' | 'completed' | 'skipped'
  completedAt: string | null
  task: {
    id: string
    title: string
    estimatedMinutes: number
    room: { id: string; name: string }
  }
  user: { id: string; name: string }
}

export interface ReportSummary {
  total: number
  completed: number
  pending: number
  skipped: number
  completionRate: number
}

// ---------------------------------------------------------------------------
// Report API response
// ---------------------------------------------------------------------------

export interface ReportResponse {
  data: ReportRow[]
  total: number
  page: number
  totalPages: number
  summary: ReportSummary
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface ReportFilters {
  from: string
  to: string
  roomId?: string
  userId?: string
  status?: string
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export interface AuditLogRow {
  id: string
  action: string
  entityType: string
  entityId: string
  /** JSON blob captured before the change */
  oldValue: unknown
  /** JSON blob captured after the change */
  newValue: unknown
  /** ISO datetime string */
  createdAt: string
  user: { id: string; name: string }
}

export interface AuditLogsResponse {
  data: AuditLogRow[]
  total: number
  page: number
  totalPages: number
}

export interface AuditLogFilters {
  search?: string
  entityType?: string
  action?: string
  from?: string
  to?: string
}

// ---------------------------------------------------------------------------
// Dropdown option helpers (re-exported for convenience)
// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string
  label: string
}
