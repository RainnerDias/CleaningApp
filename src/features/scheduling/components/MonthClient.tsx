'use client'

import { useState, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type { DatesSetArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { ScheduleWithDetails } from '../types'
import { useSchedulesByRange } from '../hooks/useSchedules'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MonthClientProps {
  /** Server-fetched schedules for the initial month */
  initialSchedules: ScheduleWithDetails[]
  /** ISO date string of the server-rendered month's first day */
  initialMonthStart: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a ScheduleWithDetails into a FullCalendar event object */
function toCalendarEvent(s: ScheduleWithDetails) {
  const isCompleted = s.status === 'completed'
  const isSkipped = s.status === 'skipped'

  return {
    id: s.id,
    title: s.task.title,
    // date-only string keeps it as an all-day event
    start: s.date.slice(0, 10),
    allDay: true,
    backgroundColor: isSkipped ? '#9ca3af' : s.task.room.color,
    borderColor: isSkipped ? '#9ca3af' : s.task.room.color,
    textColor: '#ffffff',
    classNames: isCompleted ? ['fc-event-completed'] : isSkipped ? ['fc-event-skipped'] : [],
    extendedProps: { scheduleId: s.id },
  }
}

// ---------------------------------------------------------------------------
// DayPanel — bottom inline panel showing a selected day's tasks
// ---------------------------------------------------------------------------

interface DayPanelProps {
  date: Date
  schedules: ScheduleWithDetails[]
}

function DayPanel({ date, schedules }: DayPanelProps) {
  const dateLabel = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <section
      aria-label={`Tarefas de ${dateLabel}`}
      className="mt-4 rounded-xl border border-border bg-card p-4"
    >
      <h2 className="text-sm font-semibold mb-3 capitalize">{dateLabel}</h2>

      {schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma tarefa neste dia.</p>
      ) : (
        <ul className="space-y-2" aria-label={`Lista de tarefas — ${dateLabel}`}>
          {schedules.map((s) => (
            <li
              key={s.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm',
                s.status === 'completed' && 'opacity-60',
                s.status === 'skipped' && 'opacity-40'
              )}
            >
              {/* Room dot */}
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.task.room.color }}
                aria-hidden="true"
              />
              {/* Title */}
              <span
                className={cn(
                  'flex-1 font-medium',
                  s.status === 'completed' && 'line-through text-muted-foreground'
                )}
              >
                {s.task.title}
              </span>
              {/* Room name */}
              <span className="text-xs text-muted-foreground shrink-0">
                {s.task.room.icon} {s.task.room.name}
              </span>
              {/* Status badge */}
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  s.status === 'completed' &&
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  s.status === 'skipped' && 'bg-muted text-muted-foreground',
                  s.status === 'pending' &&
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                )}
              >
                {s.status === 'completed'
                  ? 'Concluída'
                  : s.status === 'skipped'
                    ? 'Ignorada'
                    : 'Pendente'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// MonthClient — main export
// ---------------------------------------------------------------------------

/**
 * User-facing month calendar view.
 *
 * Features:
 * - FullCalendar dayGridMonth view with pt-BR locale
 * - Events coloured by room; completed events have reduced opacity
 * - Click a date → shows that day's tasks in an inline bottom panel
 * - Month navigation via FullCalendar built-in prev/next; datesSet callback
 *   updates the React Query range and triggers a refetch
 */
export function MonthClient({ initialSchedules, initialMonthStart }: MonthClientProps) {
  const calendarRef = useRef<FullCalendar>(null)

  // Track the visible date range for the query key
  const defaultFrom = useMemo(() => {
    const [y, m] = initialMonthStart.slice(0, 10).split('-').map(Number)
    return startOfMonth(new Date(y, m - 1, 1))
  }, [initialMonthStart])
  const defaultTo = useMemo(() => {
    const [y, m] = initialMonthStart.slice(0, 10).split('-').map(Number)
    return endOfMonth(new Date(y, m - 1, 1))
  }, [initialMonthStart])

  const [range, setRange] = useState<{ from: Date; to: Date }>({
    from: defaultFrom,
    to: defaultTo,
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Determine whether the current range matches the server-fetched month
  const isInitialRange =
    format(range.from, 'yyyy-MM-dd') === format(defaultFrom, 'yyyy-MM-dd') &&
    format(range.to, 'yyyy-MM-dd') === format(defaultTo, 'yyyy-MM-dd')

  const { data: schedules = isInitialRange ? initialSchedules : [] } = useSchedulesByRange(
    range.from,
    range.to
  )

  // Convert schedules to FullCalendar events
  const events = useMemo(() => schedules.map(toCalendarEvent), [schedules])

  // Schedules for the selected day (bottom panel)
  const selectedDaySchedules = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return schedules.filter((s) => s.date.startsWith(key))
  }, [selectedDate, schedules])

  // FullCalendar callbacks
  function handleDatesSet(info: DatesSetArg) {
    // FullCalendar provides start/end of the visible range
    setRange({ from: info.start, to: info.end })
  }

  function handleDateClick(info: DateClickArg) {
    setSelectedDate(info.date)
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Mês</h1>
      </div>

      {/* ── FullCalendar ── */}
      <div className="px-4">
        {/* Inline style overrides for FullCalendar completed/skipped events */}
        <style>{`
          .fc-event-completed { opacity: 0.6; text-decoration: line-through; }
          .fc-event-skipped { opacity: 0.4; }
          .fc .fc-daygrid-day.fc-day-today { background: hsl(var(--primary) / 0.08); }
          .fc .fc-button {
            background: transparent;
            border: 1px solid hsl(var(--border));
            color: hsl(var(--foreground));
            border-radius: 8px;
            font-size: 0.8rem;
          }
          .fc .fc-button:hover { background: hsl(var(--muted)); }
          .fc .fc-button-primary:not(:disabled):active,
          .fc .fc-button-primary:not(:disabled).fc-button-active {
            background: hsl(var(--primary));
            border-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
          }
          .fc .fc-toolbar-title { font-size: 1rem; font-weight: 600; }
          .fc th { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
          .fc .fc-event { border-radius: 4px; font-size: 0.7rem; padding: 1px 3px; cursor: pointer; }
          .fc .fc-daygrid-day-number { font-size: 0.8rem; }
          .fc-theme-standard .fc-scrollgrid { border-color: hsl(var(--border)); }
          .fc-theme-standard td, .fc-theme-standard th { border-color: hsl(var(--border)); }
        `}</style>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          events={events}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next',
          }}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
          fixedWeekCount={false}
        />
      </div>

      {/* ── Selected day panel ── */}
      {selectedDate && (
        <div className="px-4">
          <DayPanel date={selectedDate} schedules={selectedDaySchedules} />
        </div>
      )}
    </div>
  )
}
