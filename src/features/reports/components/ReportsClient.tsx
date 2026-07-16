'use client'

import { useState } from 'react'
import { format, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, FileSpreadsheet, FileText, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'
import { useReports } from '../hooks/useReports'
import type { ReportFilters, ReportRow, ReportSummary } from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_LIMIT = 25

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'completed', label: 'Concluídas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'skipped', label: 'Ignoradas' },
] as const

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Room {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

interface ReportsClientProps {
  rooms: Room[]
  users: User[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function translateStatus(status: string): string {
  switch (status) {
    case 'completed':
      return 'Concluída'
    case 'skipped':
      return 'Ignorada'
    default:
      return 'Pendente'
  }
}

function statusBadgeVariant(status: string): 'success' | 'secondary' | 'default' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'skipped':
      return 'secondary'
    default:
      return 'default'
  }
}

function buildExportUrl(filters: ReportFilters, exportFormat: 'xlsx' | 'pdf'): string {
  const params = new URLSearchParams({
    format: exportFormat,
    from: filters.from,
    to: filters.to,
  })
  if (filters.roomId) params.set('roomId', filters.roomId)
  if (filters.userId) params.set('userId', filters.userId)
  if (filters.status) params.set('status', filters.status)
  return `/api/admin/reports/export?${params.toString()}`
}

// ---------------------------------------------------------------------------
// CSV export (client-side)
// ---------------------------------------------------------------------------

function generateAndDownloadCSV(schedules: ReportRow[]): void {
  const headers = ['Data', 'Tarefa', 'Sala', 'Usuário', 'Status', 'Estimado (min)', 'Concluído em']
  const rows = schedules.map((s) => [
    format(new Date(s.date), 'dd/MM/yyyy', { locale: ptBR }),
    s.task.title,
    s.task.room.name,
    s.user.name,
    translateStatus(s.status),
    String(s.task.estimatedMinutes),
    s.completedAt ? format(new Date(s.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
  ])

  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')

  // BOM prefix for correct Excel UTF-8 rendering
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-limpeza-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SummaryRowProps {
  summary: ReportSummary
}

function SummaryRow({ summary }: SummaryRowProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-5"
      role="list"
      aria-label="Resumo do relatório"
    >
      {[
        { label: 'Total', value: summary.total, color: 'text-foreground' },
        {
          label: 'Concluídas',
          value: summary.completed,
          color: 'text-green-600 dark:text-green-400',
        },
        { label: 'Pendentes', value: summary.pending, color: 'text-amber-600 dark:text-amber-400' },
        { label: 'Ignoradas', value: summary.skipped, color: 'text-muted-foreground' },
        {
          label: 'Taxa de Conclusão',
          value: `${summary.completionRate}%`,
          color: 'text-blue-600 dark:text-blue-400',
        },
      ].map((item) => (
        <article
          key={item.label}
          role="listitem"
          className="rounded-xl border border-border bg-card p-3 text-center"
        >
          <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.label}</p>
        </article>
      ))}
    </div>
  )
}

interface ReportsTableProps {
  rows: ReportRow[]
}

function ReportsTable({ rows }: ReportsTableProps) {
  if (rows.length === 0) {
    return (
      <div role="status" aria-live="polite" className="py-16 text-center text-muted-foreground">
        <p className="text-base font-medium">Nenhum resultado para os filtros selecionados</p>
        <p className="mt-1 text-sm">Tente ajustar o período ou os filtros.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" aria-label="Resultados do relatório">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {['Data', 'Tarefa', 'Sala', 'Usuário', 'Status', 'Estimado', 'Concluído em'].map(
              (h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-border last:border-0 transition-colors hover:bg-muted/20',
                i % 2 === 1 && 'bg-muted/10'
              )}
            >
              <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                {format(new Date(row.date), 'dd/MM/yyyy', { locale: ptBR })}
              </td>
              <td className="max-w-[200px] truncate px-4 py-3 font-medium">{row.task.title}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">{row.task.room.name}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">{row.user.name}</td>
              <td className="px-4 py-3">
                <Badge variant={statusBadgeVariant(row.status)}>
                  {translateStatus(row.status)}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-muted-foreground">
                {row.task.estimatedMinutes > 0 ? `${row.task.estimatedMinutes} min` : '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                {row.completedAt
                  ? format(new Date(row.completedAt), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReportsClient — main export
// ---------------------------------------------------------------------------

/**
 * Admin reports page.
 *
 * Features:
 * - Date range, room, user, and status filters
 * - Summary row (total / completed / pending / skipped / completion rate)
 * - Paginated results table (25 rows per page)
 * - Export: CSV (client-side), Excel and PDF (server-side via export API)
 */
export function ReportsClient({ rooms, users }: ReportsClientProps) {
  const today = startOfDay(new Date())
  const defaultFrom = subDays(today, 30)

  // ── Draft filter state (UI controls, not yet applied) ───────────────────
  const [draftFrom, setDraftFrom] = useState(format(defaultFrom, 'yyyy-MM-dd'))
  const [draftTo, setDraftTo] = useState(format(today, 'yyyy-MM-dd'))
  const [draftRoomId, setDraftRoomId] = useState('')
  const [draftUserId, setDraftUserId] = useState('')
  const [draftStatus, setDraftStatus] = useState('')

  // ── Applied filters (drives the query) ──────────────────────────────────
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({
    from: format(defaultFrom, 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  })

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)

  // ── Export loading state ─────────────────────────────────────────────────
  const [exportingCSV, setExportingCSV] = useState(false)

  // ── Data query ───────────────────────────────────────────────────────────
  const { data, isFetching } = useReports(appliedFilters, page, PAGE_LIMIT)

  // ── Apply filters ────────────────────────────────────────────────────────
  function handleApplyFilters() {
    const from = new Date(draftFrom)
    const to = new Date(draftTo)
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return
    if (from > to) return

    setAppliedFilters({
      from: draftFrom,
      to: draftTo,
      roomId: draftRoomId || undefined,
      userId: draftUserId || undefined,
      status: draftStatus || undefined,
    })
    setPage(1)
  }

  // ── CSV export ───────────────────────────────────────────────────────────
  // Not wrapped in useCallback — only invoked from a button click, not passed
  // to any memoized child, so recreating on each render is harmless.
  async function handleExportCSV() {
    if (exportingCSV) return
    setExportingCSV(true)
    try {
      const params = new URLSearchParams({
        from: appliedFilters.from,
        to: appliedFilters.to,
        limit: '9999',
        page: '1',
      })
      if (appliedFilters.roomId) params.set('roomId', appliedFilters.roomId)
      if (appliedFilters.userId) params.set('userId', appliedFilters.userId)
      if (appliedFilters.status) params.set('status', appliedFilters.status)

      const res = await fetch(`/api/admin/reports?${params.toString()}`)
      if (!res.ok) throw new Error('Falha ao buscar dados para exportação')
      // Destructure as `rows` to avoid shadowing the `data` query result above
      const { data: rows } = (await res.json()) as { data: ReportRow[] }
      generateAndDownloadCSV(rows)
    } catch (err) {
      console.error('[ReportsClient] CSV export failed', err)
    } finally {
      setExportingCSV(false)
    }
  }

  // ── Excel / PDF export ───────────────────────────────────────────────────
  function handleExportFile(exportFormat: 'xlsx' | 'pdf') {
    const url = buildExportUrl(appliedFilters, exportFormat)
    window.open(url, '_blank')
  }

  const selectClass = cn(
    'h-8 rounded-md border border-input bg-transparent px-3 text-xs shadow-sm transition-colors',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50'
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Analise o histórico de tarefas de limpeza e exporte os dados.
        </p>
      </div>

      {/* ── Filters ── */}
      <section aria-label="Filtros do relatório">
        <div className="flex flex-wrap gap-3">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap" htmlFor="rep-from">
              De
            </label>
            <Input
              id="rep-from"
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="h-8 text-xs w-36"
              aria-label="Data inicial"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap" htmlFor="rep-to">
              Até
            </label>
            <Input
              id="rep-to"
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              className="h-8 text-xs w-36"
              aria-label="Data final"
            />
          </div>

          {/* Room filter */}
          {rooms.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="rep-room" className="sr-only">
                Filtrar por sala
              </label>
              <select
                id="rep-room"
                value={draftRoomId}
                onChange={(e) => setDraftRoomId(e.target.value)}
                className={selectClass}
                aria-label="Filtrar por sala"
              >
                <option value="">Todas as salas</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User filter */}
          {users.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="rep-user" className="sr-only">
                Filtrar por usuário
              </label>
              <select
                id="rep-user"
                value={draftUserId}
                onChange={(e) => setDraftUserId(e.target.value)}
                className={selectClass}
                aria-label="Filtrar por usuário"
              >
                <option value="">Todos os usuários</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="rep-status" className="sr-only">
              Filtrar por status
            </label>
            <select
              id="rep-status"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
              className={selectClass}
              aria-label="Filtrar por status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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

      {/* ── Summary ── */}
      {data?.summary && <SummaryRow summary={data.summary} />}

      {/* ── Table ── */}
      {isFetching ? (
        <DataTableSkeleton rows={6} columns={7} />
      ) : (
        <ReportsTable rows={data?.data ?? []} />
      )}

      {/* ── Pagination ── */}
      {data && data.totalPages > 1 && (
        <nav aria-label="Paginação do relatório" className="flex items-center justify-between pt-1">
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
            Página {page} de {data.totalPages} ({data.total} resultado
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

      {/* ── Export section ── */}
      {data && data.total > 0 && (
        <section
          aria-label="Exportar relatório"
          className="rounded-xl border border-border bg-muted/20 p-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Download aria-hidden="true" className="size-4" />
              Exportar todos os {data.total} resultado
              {data.total !== 1 ? 's' : ''}:
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={exportingCSV}
              aria-label="Exportar como CSV"
              aria-busy={exportingCSV}
            >
              <FileDown aria-hidden="true" className="mr-1 size-4" />
              {exportingCSV ? 'Gerando...' : 'CSV'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportFile('xlsx')}
              aria-label="Exportar como Excel"
            >
              <FileSpreadsheet aria-hidden="true" className="mr-1 size-4" />
              Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportFile('pdf')}
              aria-label="Exportar como PDF"
            >
              <FileText aria-hidden="true" className="mr-1 size-4" />
              PDF
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
