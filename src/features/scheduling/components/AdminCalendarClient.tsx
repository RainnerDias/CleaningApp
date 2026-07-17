'use client'

import { useRef, useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBR from '@fullcalendar/core/locales/pt-br'
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import { useSchedulesByRange, useGenerateSchedules } from '../hooks/useSchedules'
import type { ScheduleWithDetails } from '../types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { CalendarDays, RefreshCw } from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<ScheduleWithDetails['status'], string> = {
  pending: 'Pendente',
  completed: 'Concluído',
  skipped: 'Ignorado',
}

const STATUS_VARIANT: Record<ScheduleWithDetails['status'], 'default' | 'success' | 'secondary'> = {
  pending: 'default',
  completed: 'success',
  skipped: 'secondary',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCalendarEvents(schedules: ScheduleWithDetails[]): EventInput[] {
  return schedules.map((s) => ({
    id: s.id,
    title: `${s.task.room.icon} ${s.task.title}`,
    start: s.date,
    // FullCalendar event colors must be passed as inline style properties — no Tailwind equivalent
    backgroundColor: s.task.room.color,
    borderColor: s.task.room.color,
    textColor: '#fff',
    extendedProps: { schedule: s },
  }))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Admin Calendar client shell.
 *
 * Renders a FullCalendar month view displaying all household schedules.
 * Handles month navigation, event detail popups, and on-demand schedule generation.
 *
 * Mobile (< 640 px): switches to `dayGridWeek` view.
 * Note: `listWeek` view requires `@fullcalendar/list` which is not installed;
 * `dayGridWeek` from the already-installed `@fullcalendar/daygrid` is used instead.
 */
export function AdminCalendarClient() {
  const calendarRef = useRef<FullCalendar>(null)

  // ---------------------------------------------------------------------------
  // Date range — updated by FullCalendar's datesSet callback so the query
  // always covers exactly the visible grid (including leading/trailing days).
  // ---------------------------------------------------------------------------
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date()
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    }
  })

  // ---------------------------------------------------------------------------
  // Mobile responsive view — useSyncExternalStore avoids setState-in-effect
  // ---------------------------------------------------------------------------
  const isMobile = useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia('(max-width: 639px)')
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    () => window.matchMedia('(max-width: 639px)').matches,
    () => false // server snapshot — assume not mobile during SSR
  )

  // Imperatively change the FullCalendar view when the breakpoint flips
  useEffect(() => {
    const cal = calendarRef.current?.getApi()
    if (!cal) return
    cal.changeView(isMobile ? 'dayGridWeek' : 'dayGridMonth')
  }, [isMobile])

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const {
    data: schedules = [],
    isLoading,
    isError,
  } = useSchedulesByRange(dateRange.from, dateRange.to)

  const generate = useGenerateSchedules()

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({ from: arg.start, to: arg.end })
  }, [])

  // Selected event drives the detail dialog
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithDetails | null>(null)

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const schedule = arg.event.extendedProps['schedule'] as ScheduleWithDetails
    setSelectedSchedule(schedule)
  }, [])

  const handleGenerate = useCallback(() => {
    generate.mutate({})
  }, [generate])

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const events = buildCalendarEvents(schedules)
  const hasSchedules = schedules.length > 0

  return (
    <div className="px-4 md:px-6 pt-6 pb-8 max-w-7xl mx-auto space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize e gere os agendamentos de tarefas.
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generate.isPending}
          variant={!hasSchedules && !isLoading ? 'default' : 'outline'}
        >
          <RefreshCw
            aria-hidden="true"
            className={generate.isPending ? 'animate-spin' : undefined}
          />
          {generate.isPending ? 'Gerando...' : 'Gerar Agendamentos'}
        </Button>
      </div>

      {/* ── Fetch error ─────────────────────────────────────────────────── */}
      {isError && (
        <div
          className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm"
          role="alert"
        >
          Falha ao carregar os agendamentos. Tente novamente mais tarde.
        </div>
      )}

      {/* ── Generate error ──────────────────────────────────────────────── */}
      {generate.isError && (
        <div
          className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm"
          role="alert"
        >
          {generate.error?.message ?? 'Falha ao gerar agendamentos. Tente novamente.'}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!isLoading && !isError && !hasSchedules && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <CalendarDays className="size-7 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Nenhum agendamento neste período</p>
            <p className="text-xs text-muted-foreground">
              Clique em &ldquo;Gerar Agendamentos&rdquo; para criar tarefas para os próximos 30
              dias.
            </p>
          </div>
        </div>
      )}

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      <div className="relative rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <RefreshCw
              className="size-6 animate-spin text-muted-foreground"
              aria-label="Carregando"
            />
          </div>
        )}

        <div className="p-3 sm:p-5">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={ptBR}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
            eventDisplay="block"
          />
        </div>
      </div>

      {/* ── Event detail dialog ─────────────────────────────────────────── */}
      <DialogRoot
        open={selectedSchedule !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedSchedule(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSchedule?.task.room.icon} {selectedSchedule?.task.title}
            </DialogTitle>
            <DialogDescription>Detalhes do agendamento selecionado.</DialogDescription>
          </DialogHeader>

          {selectedSchedule !== null && (
            <dl className="mt-3 divide-y divide-border">
              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-muted-foreground">Sala</dt>
                <dd className="font-medium">{selectedSchedule.task.room.name}</dd>
              </div>

              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-muted-foreground">Responsável</dt>
                <dd className="font-medium">{selectedSchedule.user?.name ?? 'Não atribuído'}</dd>
              </div>

              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[selectedSchedule.status]}>
                    {STATUS_LABEL[selectedSchedule.status]}
                  </Badge>
                </dd>
              </div>

              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-muted-foreground">Duração estimada</dt>
                <dd className="font-medium">{selectedSchedule.task.estimatedMinutes} min</dd>
              </div>
            </dl>
          )}

          <div className="mt-6 flex justify-end">
            <DialogClose render={<Button variant="outline">Fechar</Button>} />
          </div>
        </DialogContent>
      </DialogRoot>
    </div>
  )
}
