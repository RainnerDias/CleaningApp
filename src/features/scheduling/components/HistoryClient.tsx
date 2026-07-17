'use client'

import { useState, useMemo } from 'react'
import { format, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'
import type { ScheduleWithDetails } from '../types'
import { useScheduleHistory } from '../hooks/useSchedules'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'completed', label: 'Concluídas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'skipped', label: 'Ignoradas' },
] as const

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HistoryClientProps {
  /** Server-fetched schedules for the default range (last 30 days, no filters) */
  initialSchedules: ScheduleWithDetails[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Concluída'
    case 'skipped':
      return 'Ignorada'
    default:
      return 'Pendente'
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-brand/12 text-brand'
    case 'skipped':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-warning/12 text-warning-foreground'
  }
}

// Derive unique rooms from the initial (unfiltered) schedules
function extractRooms(schedules: ScheduleWithDetails[]): { id: string; name: string }[] {
  const map = new Map<string, { id: string; name: string }>()
  for (const s of schedules) {
    const { room } = s.task
    if (!map.has(room.id)) map.set(room.id, { id: room.id, name: room.name })
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------
// SummaryCards
// ---------------------------------------------------------------------------

interface SummaryCardsProps {
  completed: number
  pending: number
  skipped: number
}

function SummaryCards({ completed, pending, skipped }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3" aria-label="Resumo dos resultados" role="list">
      <article role="listitem" className="rounded-xl border border-border bg-card p-3 text-center">
        <p className="text-2xl font-bold text-brand" aria-label={`${completed} concluídas`}>
          {completed}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Concluídas</p>
      </article>

      <article role="listitem" className="rounded-xl border border-border bg-card p-3 text-center">
        <p className="text-2xl font-bold text-warning" aria-label={`${pending} pendentes`}>
          {pending}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Pendentes</p>
      </article>

      <article role="listitem" className="rounded-xl border border-border bg-card p-3 text-center">
        <p className="text-2xl font-bold text-muted-foreground" aria-label={`${skipped} ignoradas`}>
          {skipped}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Ignoradas</p>
      </article>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HistoryTable
// ---------------------------------------------------------------------------

interface HistoryTableProps {
  schedules: ScheduleWithDetails[]
}

function HistoryTable({ schedules }: HistoryTableProps) {
  if (schedules.length === 0) {
    return (
      <div role="status" aria-live="polite" className="py-16 text-center text-muted-foreground">
        <p className="text-base font-medium">Nenhum resultado para os filtros selecionados</p>
        <p className="mt-1 text-sm">Tente ajustar o período ou os filtros.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" aria-label="Histórico de tarefas">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Data
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Tarefa
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell"
            >
              Sala
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell"
            >
              Est.
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell"
            >
              Concluído
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s, i) => (
            <tr
              key={s.id}
              className={cn(
                'border-b border-border last:border-0 transition-colors hover:bg-muted/20',
                i % 2 === 1 && 'bg-muted/10'
              )}
            >
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(s.date), 'dd/MM/yyyy', { locale: ptBR })}
              </td>
              <td className="px-4 py-3 font-medium max-w-[160px] truncate">{s.task.title}</td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${s.task.room.color}18`,
                    borderColor: `${s.task.room.color}40`,
                    color: s.task.room.color,
                  }}
                >
                  <span aria-hidden="true">{s.task.room.icon}</span>
                  {s.task.room.name}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    statusBadgeClass(s.status)
                  )}
                >
                  {statusLabel(s.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                {s.task.estimatedMinutes > 0 ? `${s.task.estimatedMinutes} min` : '—'}
              </td>
              <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                {s.completedAt ? format(new Date(s.completedAt), 'HH:mm') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HistoryClient — main export
// ---------------------------------------------------------------------------

/**
 * User-facing history page.
 *
 * Features:
 * - Date range picker (De / Até), status filter, room filter, "Filtrar" button
 * - Summary cards: completed / pending / skipped counts
 * - Sortable table (by date descending), 20 rows per page
 * - Pagination: "Anterior" / "Próxima"
 * - Empty state when no results match the filters
 */
export function HistoryClient({ initialSchedules }: HistoryClientProps) {
  // Default filter state mirrors what the server pre-fetched
  const today = useMemo(() => startOfDay(new Date()), [])
  const defaultFrom = useMemo(() => subDays(today, 30), [today])

  // Available rooms derived from the initial (unfiltered) data — stays static
  const availableRooms = useMemo(() => extractRooms(initialSchedules), [initialSchedules])

  // ── Filter UI state (pending changes, not yet applied) ──────────────────
  const [draftFrom, setDraftFrom] = useState(format(defaultFrom, 'yyyy-MM-dd'))
  const [draftTo, setDraftTo] = useState(format(today, 'yyyy-MM-dd'))
  const [draftStatus, setDraftStatus] = useState('_all')
  const [draftRoomId, setDraftRoomId] = useState('_all')

  // ── Applied filter state (what the query is actually using) ─────────────
  const [appliedFrom, setAppliedFrom] = useState(defaultFrom)
  const [appliedTo, setAppliedTo] = useState(today)
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined)
  const [appliedRoomId, setAppliedRoomId] = useState<string | undefined>(undefined)

  // Detect whether applied filters match the server-pre-fetched default
  const isDefaultFilter =
    format(appliedFrom, 'yyyy-MM-dd') === format(defaultFrom, 'yyyy-MM-dd') &&
    format(appliedTo, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') &&
    !appliedStatus &&
    !appliedRoomId

  // ── React Query ─────────────────────────────────────────────────────────
  const { data: schedules = [], isFetching } = useScheduleHistory(
    {
      from: appliedFrom,
      to: appliedTo,
      status: appliedStatus,
      roomId: appliedRoomId,
    },
    isDefaultFilter ? initialSchedules : undefined
  )

  // ── Pagination ──────────────────────────────────────────────────────────
  const [page, setPage] = useState(0)

  // Reset to page 0 when filters change
  function handleApplyFilters() {
    const from = new Date(draftFrom)
    const to = new Date(draftTo)
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return
    setAppliedFrom(from)
    setAppliedTo(to)
    setAppliedStatus(draftStatus === '_all' ? undefined : draftStatus)
    setAppliedRoomId(draftRoomId === '_all' ? undefined : draftRoomId)
    setPage(0)
  }

  // Sorted descending by date
  const sorted = useMemo(
    () => [...schedules].sort((a, b) => b.date.localeCompare(a.date)),
    [schedules]
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // ── Summary counts ──────────────────────────────────────────────────────
  const { completed, pending, skipped } = useMemo(
    () =>
      schedules.reduce(
        (acc, s) => {
          acc[s.status as 'completed' | 'pending' | 'skipped']++
          return acc
        },
        { completed: 0, pending: 0, skipped: 0 }
      ),
    [schedules]
  )

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* ── Filter controls ── */}
        <section aria-label="Filtros do histórico">
          <div className="flex flex-wrap gap-3">
            {/* Date range */}
            <div className="flex items-center gap-2 min-w-0">
              <label
                className="text-xs text-muted-foreground whitespace-nowrap"
                htmlFor="hist-from"
              >
                De
              </label>
              <Input
                id="hist-from"
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="h-8 text-xs w-full sm:w-36"
                aria-label="Data inicial"
              />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className="text-xs text-muted-foreground whitespace-nowrap" htmlFor="hist-to">
                Até
              </label>
              <Input
                id="hist-to"
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="h-8 text-xs w-full sm:w-36"
                aria-label="Data final"
              />
            </div>

            {/* Status filter */}
            <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v ?? '_all')}>
              <SelectTrigger size="sm" className="text-xs" aria-label="Filtrar por status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos os status</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="skipped">Ignoradas</SelectItem>
              </SelectContent>
            </Select>

            {/* Room filter */}
            {availableRooms.length > 0 && (
              <Select value={draftRoomId} onValueChange={(v) => setDraftRoomId(v ?? '_all')}>
                <SelectTrigger size="sm" className="text-xs" aria-label="Filtrar por sala">
                  <SelectValue placeholder="Sala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas as salas</SelectItem>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Apply button */}
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

        {/* ── Summary cards ── */}
        <SummaryCards completed={completed} pending={pending} skipped={skipped} />

        {/* ── Table / skeleton / empty ── */}
        {isFetching ? (
          <DataTableSkeleton rows={5} columns={6} />
        ) : (
          <>
            <HistoryTable schedules={paginated} />

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <nav aria-label="Paginação" className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Página anterior"
                >
                  Anterior
                </Button>
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className="text-xs text-muted-foreground"
                >
                  Página {page + 1} de {totalPages} ({sorted.length} resultado
                  {sorted.length !== 1 ? 's' : ''})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Próxima página"
                >
                  Próxima
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}
