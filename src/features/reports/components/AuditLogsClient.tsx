'use client'

import { useState, useCallback } from 'react'
import { format, formatDistanceToNow, parseISO, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'
import { useAuditLogs } from '../hooks/useReports'
import type { AuditLogFilters, AuditLogRow } from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_LIMIT = 50

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'Todas as entidades' },
  { value: 'room', label: 'Sala' },
  { value: 'category', label: 'Categoria' },
  { value: 'task', label: 'Tarefa' },
  { value: 'user', label: 'Usuário' },
  { value: 'schedule', label: 'Agendamento' },
] as const

const ACTION_OPTIONS = [
  { value: '', label: 'Todas as ações' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'INVITE', label: 'INVITE' },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'INVITE'

function actionBadgeClass(action: string): string {
  switch (action as ActionType) {
    case 'CREATE':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'UPDATE':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'DELETE':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'INVITE':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function safeRelativeTime(isoStr: string): string {
  try {
    return formatDistanceToNow(parseISO(isoStr), { addSuffix: true, locale: ptBR })
  } catch {
    return isoStr
  }
}

function safeFullTime(isoStr: string): string {
  try {
    return format(parseISO(isoStr), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
  } catch {
    return isoStr
  }
}

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ExpandedDetailsProps {
  oldValue: unknown
  newValue: unknown
}

function ExpandedDetails({ oldValue, newValue }: ExpandedDetailsProps) {
  const hasOld = oldValue !== null && oldValue !== undefined
  const hasNew = newValue !== null && newValue !== undefined

  if (!hasOld && !hasNew) {
    return (
      <p className="px-6 py-3 text-xs text-muted-foreground">Sem dados detalhados registrados.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
      {hasOld && (
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Valor anterior
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground">
            {prettyJson(oldValue)}
          </pre>
        </div>
      )}
      {hasNew && (
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Novo valor
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground">
            {prettyJson(newValue)}
          </pre>
        </div>
      )}
    </div>
  )
}

interface AuditLogsTableProps {
  rows: AuditLogRow[]
}

function AuditLogsTable({ rows }: AuditLogsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <div role="status" aria-live="polite" className="py-16 text-center text-muted-foreground">
        <p className="text-base font-medium">Nenhum log encontrado</p>
        <p className="mt-1 text-sm">Tente ajustar os filtros de busca.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" aria-label="Logs de auditoria">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {/* Expand toggle */}
            <th scope="col" className="w-8 px-4 py-3" aria-label="Expandir" />
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Quando
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Usuário
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Ação
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Entidade
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              ID
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isExpanded = expandedId === row.id
            const hasDetails = row.oldValue !== null || row.newValue !== null

            return (
              <>
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-border transition-colors',
                    isExpanded ? 'border-border' : 'last:border-0',
                    i % 2 === 1 && !isExpanded && 'bg-muted/10',
                    hasDetails && 'cursor-pointer hover:bg-muted/20'
                  )}
                  onClick={() =>
                    hasDetails ? setExpandedId(isExpanded ? null : row.id) : undefined
                  }
                  aria-expanded={hasDetails ? isExpanded : undefined}
                  role={hasDetails ? 'button' : undefined}
                  tabIndex={hasDetails ? 0 : undefined}
                  onKeyDown={
                    hasDetails
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setExpandedId(isExpanded ? null : row.id)
                          }
                        }
                      : undefined
                  }
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {hasDetails ? (
                      isExpanded ? (
                        <ChevronDown aria-hidden="true" className="size-3.5" />
                      ) : (
                        <ChevronRight aria-hidden="true" className="size-3.5" />
                      )
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      title={safeFullTime(row.createdAt)}
                      className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
                    >
                      {safeRelativeTime(row.createdAt)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{row.user.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        actionBadgeClass(row.action)
                      )}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{row.entityType}</td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-xs font-mono text-muted-foreground">
                    {row.entityId}
                  </td>
                </tr>

                {/* Expanded details row */}
                {isExpanded && (
                  <tr
                    key={`${row.id}-details`}
                    className={cn(
                      'border-b border-border last:border-0',
                      i % 2 === 1 && 'bg-muted/10'
                    )}
                  >
                    <td colSpan={6} className="p-0">
                      <ExpandedDetails oldValue={row.oldValue} newValue={row.newValue} />
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AuditLogsClient — main export
// ---------------------------------------------------------------------------

/**
 * Admin audit logs page.
 *
 * Features:
 * - Search across action, entityType, and entityId
 * - Entity type and action filters
 * - Date range filter
 * - Results table with expandable rows showing oldValue → newValue JSON
 * - Action badges: CREATE (green), UPDATE (blue), DELETE (red), INVITE (purple)
 * - "Quando" column: relative time with full timestamp on hover
 * - Pagination (50 per page)
 */
export function AuditLogsClient() {
  const today = startOfDay(new Date())
  const defaultFrom = subDays(today, 30)

  // ── Draft filter state ───────────────────────────────────────────────────
  const [draftSearch, setDraftSearch] = useState('')
  const [draftEntityType, setDraftEntityType] = useState('')
  const [draftAction, setDraftAction] = useState('')
  const [draftFrom, setDraftFrom] = useState(format(defaultFrom, 'yyyy-MM-dd'))
  const [draftTo, setDraftTo] = useState(format(today, 'yyyy-MM-dd'))

  // ── Applied filter state ─────────────────────────────────────────────────
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({
    from: format(defaultFrom, 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  })

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)

  // ── Data query ───────────────────────────────────────────────────────────
  const { data, isFetching } = useAuditLogs(appliedFilters, page, PAGE_LIMIT)

  // ── Apply filters ────────────────────────────────────────────────────────
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({
      search: draftSearch || undefined,
      entityType: draftEntityType || undefined,
      action: draftAction || undefined,
      from: draftFrom || undefined,
      to: draftTo || undefined,
    })
    setPage(1)
  }, [draftSearch, draftEntityType, draftAction, draftFrom, draftTo])

  const selectClass = cn(
    'h-8 rounded-md border border-input bg-transparent px-3 text-xs shadow-sm transition-colors',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50'
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs de Auditoria</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Rastreie todas as alterações realizadas no sistema.
        </p>
      </div>

      {/* ── Filters ── */}
      <section aria-label="Filtros dos logs de auditoria">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <Input
            type="search"
            placeholder="Buscar por ação, entidade ou ID..."
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            className="h-8 text-xs w-60"
            aria-label="Buscar nos logs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyFilters()
            }}
          />

          {/* Entity type */}
          <div>
            <label htmlFor="audit-entity" className="sr-only">
              Filtrar por tipo de entidade
            </label>
            <select
              id="audit-entity"
              value={draftEntityType}
              onChange={(e) => setDraftEntityType(e.target.value)}
              className={selectClass}
              aria-label="Filtrar por tipo de entidade"
            >
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div>
            <label htmlFor="audit-action" className="sr-only">
              Filtrar por ação
            </label>
            <select
              id="audit-action"
              value={draftAction}
              onChange={(e) => setDraftAction(e.target.value)}
              className={selectClass}
              aria-label="Filtrar por ação"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap" htmlFor="audit-from">
              De
            </label>
            <Input
              id="audit-from"
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="h-8 text-xs w-36"
              aria-label="Data inicial dos logs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap" htmlFor="audit-to">
              Até
            </label>
            <Input
              id="audit-to"
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              className="h-8 text-xs w-36"
              aria-label="Data final dos logs"
            />
          </div>

          <Button
            size="sm"
            onClick={handleApplyFilters}
            disabled={isFetching}
            aria-busy={isFetching}
          >
            {isFetching ? 'Filtrando...' : 'Filtrar'}
          </Button>
        </div>
      </section>

      {/* ── Result count ── */}
      {data && !isFetching && (
        <p aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground">
          {data.total === 0
            ? 'Nenhum log encontrado.'
            : `${data.total} log${data.total !== 1 ? 's' : ''} encontrado${data.total !== 1 ? 's' : ''}.`}
        </p>
      )}

      {/* ── Table ── */}
      {isFetching ? (
        <DataTableSkeleton rows={6} columns={6} />
      ) : (
        <AuditLogsTable rows={data?.data ?? []} />
      )}

      {/* ── Pagination ── */}
      {data && data.totalPages > 1 && (
        <nav aria-label="Paginação dos logs" className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            aria-label="Página anterior"
          >
            Anterior
          </Button>
          <span aria-live="polite" aria-atomic="true" className="text-xs text-muted-foreground">
            Página {page} de {data.totalPages} ({data.total} registro
            {data.total !== 1 ? 's' : ''})
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages || isFetching}
            aria-label="Próxima página"
          >
            Próxima
          </Button>
        </nav>
      )}
    </div>
  )
}
