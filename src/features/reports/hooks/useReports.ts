'use client'

import { useQuery } from '@tanstack/react-query'
import type { ReportFilters, ReportResponse, AuditLogFilters, AuditLogsResponse } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { error?: { message?: string } }).error?.message ??
        `Request failed with status ${res.status}`
    )
  }
  return res.json() as Promise<T>
}

function buildReportParams(filters: ReportFilters, page: number, limit: number): URLSearchParams {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    page: String(page),
    limit: String(limit),
  })
  if (filters.roomId) params.set('roomId', filters.roomId)
  if (filters.userId) params.set('userId', filters.userId)
  if (filters.status) params.set('status', filters.status)
  return params
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const reportKeys = {
  all: ['reports'] as const,
  list: (filters: ReportFilters, page: number, limit: number) =>
    ['reports', 'list', filters, page, limit] as const,
  export: (filters: ReportFilters) => ['reports', 'export', filters] as const,
  auditLogs: (filters: AuditLogFilters, page: number, limit: number) =>
    ['reports', 'auditLogs', filters, page, limit] as const,
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

/**
 * Fetches paginated report data from the admin reports API.
 * The query is automatically re-run when filters or page change.
 */
export function useReports(filters: ReportFilters, page: number, limit = 25) {
  return useQuery<ReportResponse>({
    queryKey: reportKeys.list(filters, page, limit),
    queryFn: async () => {
      const params = buildReportParams(filters, page, limit)
      const res = await fetch(`/api/admin/reports?${params.toString()}`)
      return handleResponse<ReportResponse>(res)
    },
    // Keep previous data while fetching next page (avoids empty flash)
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    enabled: Boolean(filters.from && filters.to),
  })
}

/**
 * Fetches ALL matching records for CSV export (no pagination).
 * Only runs when `enabled` is set to true — call it on demand.
 */
export function useReportExportData(filters: ReportFilters, enabled: boolean) {
  return useQuery<ReportResponse>({
    queryKey: reportKeys.export(filters),
    queryFn: async () => {
      const params = buildReportParams(filters, 1, 9999)
      const res = await fetch(`/api/admin/reports?${params.toString()}`)
      return handleResponse<ReportResponse>(res)
    },
    enabled: enabled && Boolean(filters.from && filters.to),
    staleTime: 0,
  })
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

function buildAuditParams(filters: AuditLogFilters, page: number, limit: number): URLSearchParams {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  if (filters.search) params.set('search', filters.search)
  if (filters.entityType) params.set('entityType', filters.entityType)
  if (filters.action) params.set('action', filters.action)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  return params
}

/**
 * Fetches paginated audit log entries from the admin audit-logs API.
 */
export function useAuditLogs(filters: AuditLogFilters, page: number, limit = 50) {
  return useQuery<AuditLogsResponse>({
    queryKey: reportKeys.auditLogs(filters, page, limit),
    queryFn: async () => {
      const params = buildAuditParams(filters, page, limit)
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      return handleResponse<AuditLogsResponse>(res)
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })
}
