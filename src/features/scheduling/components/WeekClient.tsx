'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ScheduleWithDetails } from '../types'
import { useSchedulesByWeek } from '../hooks/useSchedules'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEEK_DAY_ABBR: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WeekClientProps {
  /** Current authenticated user */
  user: { id: string; name: string }
  /** Server-fetched schedules for the initial week */
  initialSchedules: ScheduleWithDetails[]
  /** ISO date string of the server-rendered week's Monday */
  initialWeekStart: string
  /** Pre-formatted week range label from the server (avoids timezone hydration mismatch) */
  initialWeekLabel: string
}

// ---------------------------------------------------------------------------
// StatusIcon
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: ScheduleWithDetails['status'] }) {
  if (status === 'completed') {
    return (
      <span className="text-green-500 text-xs font-bold" aria-label="Concluída">
        ✓
      </span>
    )
  }
  if (status === 'skipped') {
    return (
      <span className="text-muted-foreground text-xs" aria-label="Ignorada">
        —
      </span>
    )
  }
  return (
    <span className="text-amber-500 text-xs font-bold" aria-label="Pendente">
      ·
    </span>
  )
}

// ---------------------------------------------------------------------------
// DayTaskCard — compact card shown inside a day column
// ---------------------------------------------------------------------------

interface DayTaskCardProps {
  schedule: ScheduleWithDetails
  onClick: () => void
}

function DayTaskCard({ schedule, onClick }: DayTaskCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg px-2.5 py-2 text-xs border border-border bg-card shadow-sm',
        'hover:bg-muted/50 hover:border-border/80 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'flex items-center gap-1.5 min-w-0',
        schedule.status === 'completed' && 'opacity-60',
        schedule.status === 'skipped' && 'opacity-40'
      )}
      aria-label={`${schedule.task.title} — ${
        schedule.status === 'completed'
          ? 'Concluída'
          : schedule.status === 'skipped'
            ? 'Ignorada'
            : 'Pendente'
      }`}
    >
      {/* Room colour dot */}
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: schedule.task.room.color }}
        aria-hidden="true"
      />
      {/* Title */}
      <span
        className={cn(
          'truncate flex-1 font-medium',
          schedule.status === 'completed' && 'line-through'
        )}
      >
        {schedule.task.title}
      </span>
      {/* Status icon */}
      <StatusIcon status={schedule.status} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// ScheduleDetailPanel — bottom-sheet on mobile, centred modal on desktop
// ---------------------------------------------------------------------------

interface ScheduleDetailPanelProps {
  schedule: ScheduleWithDetails
  onClose: () => void
}

function ScheduleDetailPanel({ schedule, onClose }: ScheduleDetailPanelProps) {
  const statusLabel =
    schedule.status === 'completed'
      ? 'Concluída'
      : schedule.status === 'skipped'
        ? 'Ignorada'
        : 'Pendente'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes: ${schedule.task.title}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Fechar painel de detalhes"
        tabIndex={-1}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl border border-border p-4 shadow-xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-3">
          <h2 className="font-semibold text-base leading-snug">{schedule.task.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Fechar"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>

        {/* Room pill */}
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium mb-3"
          style={{
            backgroundColor: `${schedule.task.room.color}18`,
            borderColor: `${schedule.task.room.color}40`,
            color: schedule.task.room.color,
          }}
        >
          <span aria-hidden="true">{schedule.task.room.icon}</span>
          {schedule.task.room.name}
        </span>

        {/* Details */}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{statusLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Data</dt>
            <dd className="font-medium">
              {format(new Date(schedule.date), "d 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </dd>
          </div>
          {schedule.task.estimatedMinutes > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tempo estimado</dt>
              <dd className="font-medium">{schedule.task.estimatedMinutes} min</dd>
            </div>
          )}
          {schedule.completedAt && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Concluído em</dt>
              <dd className="font-medium">{format(new Date(schedule.completedAt), 'HH:mm')}</dd>
            </div>
          )}
        </dl>

        {/* Comments */}
        {schedule.comments.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Comentários
            </p>
            <ul className="space-y-1.5" aria-label="Comentários">
              {schedule.comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                  <span className="font-medium">{c.user.name}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {format(new Date(c.createdAt), 'dd/MM HH:mm')}
                  </span>
                  <p className="mt-0.5 text-foreground/80">{c.comment}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DayColumn — one column in the 7-day grid
// ---------------------------------------------------------------------------

interface DayColumnProps {
  day: Date
  schedules: ScheduleWithDetails[]
  onTaskClick: (schedule: ScheduleWithDetails) => void
}

function DayColumn({ day, schedules, onTaskClick }: DayColumnProps) {
  const todayHighlight = isToday(day)
  const dayLabel = format(day, "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div role="gridcell" aria-label={dayLabel} className="flex flex-col gap-1.5 min-w-[120px]">
      {/* Day header */}
      <div
        className={cn(
          'rounded-xl px-2 py-2 text-center shadow-sm',
          todayHighlight ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
        )}
      >
        <p
          className={cn(
            'text-xs font-semibold',
            todayHighlight ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}
        >
          {WEEK_DAY_ABBR[day.getDay()]}
        </p>
        <p
          className={cn(
            'text-sm font-bold tabular-nums',
            todayHighlight ? 'text-primary-foreground' : 'text-foreground'
          )}
        >
          {format(day, 'd')}
        </p>
      </div>

      {/* Task list */}
      {schedules.length === 0 ? (
        <div
          className="flex items-center justify-center h-12 text-muted-foreground/40 text-xs select-none"
          aria-label="Sem tarefas"
        >
          ·
        </div>
      ) : (
        <ul className="flex flex-col gap-1" aria-label={`Tarefas de ${dayLabel}`}>
          {schedules.map((schedule) => (
            <li key={schedule.id}>
              <DayTaskCard schedule={schedule} onClick={() => onTaskClick(schedule)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// WeekClient — main export
// ---------------------------------------------------------------------------

/**
 * User-facing week view.
 *
 * Features:
 * - 7-column grid (Mon–Sun), scrollable horizontally on mobile
 * - Today highlighted in primary colour
 * - Compact task cards with room dot + title + status icon
 * - Click any task card to open a detail bottom-sheet
 * - "← / →" week navigation + "Hoje" shortcut
 * - Keeps previous week's data visible while fetching the next week
 */
export function WeekClient({
  user: _user,
  initialSchedules,
  initialWeekStart,
  initialWeekLabel,
}: WeekClientProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => {
    // Parse only the YYYY-MM-DD portion as LOCAL midnight to avoid the UTC→local
    // shift that would land in the previous day in UTC-3 and display the wrong week.
    const [y, m, d] = initialWeekStart.slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
  })
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithDetails | null>(null)

  // Determine whether the current week matches the server-fetched week so we
  // can safely inject initialData into the query without polluting other keys.
  const initialWeekMonday = useMemo(
    () => format(startOfWeek(new Date(initialWeekStart), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    [initialWeekStart]
  )
  const currentWeekMonday = useMemo(
    () => format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    [weekStart]
  )
  const isInitialWeek = currentWeekMonday === initialWeekMonday

  const { data: schedules = [], isFetching } = useSchedulesByWeek(
    weekStart,
    isInitialWeek ? initialSchedules : undefined
  )

  // Enumerate Mon–Sun for the active week
  const days = useMemo(() => {
    const monday = startOfWeek(weekStart, { weekStartsOn: 1 })
    const sunday = endOfWeek(weekStart, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: monday, end: sunday })
  }, [weekStart])

  // Group schedules by calendar date (YYYY-MM-DD)
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, ScheduleWithDetails[]>()
    for (const s of schedules) {
      const key = s.date.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }, [schedules])

  // Navigation handlers
  function handlePrevWeek() {
    setWeekStart((d) => subWeeks(d, 1))
  }

  function handleNextWeek() {
    setWeekStart((d) => addWeeks(d, 1))
  }

  function handleToday() {
    setWeekStart(new Date())
  }

  const monday = startOfWeek(weekStart, { weekStartsOn: 1 })
  const sunday = endOfWeek(weekStart, { weekStartsOn: 1 })
  // On initial render use the server-computed label (matches SSR, avoids hydration mismatch).
  // After navigation the client can compute it freely since hydration has already completed.
  const isInitialRender = currentWeekMonday === initialWeekMonday
  const weekLabel = isInitialRender
    ? initialWeekLabel
    : `${format(monday, "d 'de' MMM", { locale: ptBR })} – ${format(sunday, "d 'de' MMM", { locale: ptBR })}`

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Semana</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Veja as tarefas desta semana</p>

        {/* Week navigation */}
        <nav aria-label="Navegação da semana" className="mt-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handlePrevWeek}
            aria-label="Semana anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>

          <span
            aria-live="polite"
            aria-atomic="true"
            className="flex-1 text-center text-sm font-medium text-muted-foreground"
          >
            {weekLabel}
          </span>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleNextWeek}
            aria-label="Próxima semana"
          >
            <ChevronRight aria-hidden="true" />
          </Button>

          <Button variant="ghost" size="sm" onClick={handleToday}>
            Hoje
          </Button>
        </nav>

        {/* Loading indicator */}
        {isFetching && (
          <p
            role="status"
            aria-live="polite"
            className="mt-1 text-center text-xs text-muted-foreground"
          >
            Atualizando...
          </p>
        )}
      </div>

      {/* ── 7-column week grid ── */}
      {/* On mobile: horizontal scroll; on desktop: natural 7-col grid */}
      <div className="px-4 overflow-x-auto">
        <div
          role="grid"
          aria-label="Grade de tarefas da semana"
          className="grid grid-cols-7 gap-2.5"
          style={{ minWidth: '560px' }}
        >
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            return (
              <DayColumn
                key={dateKey}
                day={day}
                schedules={schedulesByDate.get(dateKey) ?? []}
                onTaskClick={setSelectedSchedule}
              />
            )
          })}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selectedSchedule && (
        <ScheduleDetailPanel
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </div>
  )
}
