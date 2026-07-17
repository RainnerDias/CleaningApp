'use client'

import { useMemo, useSyncExternalStore } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  CheckCircle2,
  Users,
  AlertCircle,
  Timer,
  CheckCheck,
  Clock,
  SkipForward,
  RefreshCw,
} from 'lucide-react'
import { format, parseISO, addDays, subDays, getDay, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useChartColors } from '@/hooks/useChartColors'
import { useDashboard, useDashboardRefresh } from '../hooks/useDashboard'
import type { DashboardData, HeatmapEntry } from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Day-of-week labels starting Monday (index 0 = Monday) */
const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the Tailwind class for a heatmap cell based on its completion ratio.
 * Empty cells (total = 0) receive the muted background.
 */
function getHeatmapColor(cell: HeatmapEntry): string {
  if (cell.total === 0) return 'bg-muted'
  const ratio = cell.completed / cell.total
  if (ratio === 0) return 'bg-muted'
  if (ratio <= 0.33) return 'bg-brand/20'
  if (ratio <= 0.66) return 'bg-brand/45'
  if (ratio < 1) return 'bg-brand/65'
  return 'bg-brand'
}

/** Returns the fill color for a user bar chart based on completion rate. */
function getUserBarColor(
  rate: number,
  colors: { completed: string; pending: string; destructive: string }
): string {
  if (rate >= 80) return colors.completed
  if (rate >= 50) return colors.pending
  return colors.destructive
}

// ---------------------------------------------------------------------------
// KpiCard
// ---------------------------------------------------------------------------

interface KpiCardProps {
  /** Lucide icon component */
  icon: React.ElementType
  /** Short metric label */
  label: string
  /** Primary metric value displayed large */
  value: string | number
  /** Supplementary context text */
  subtext: string
}

function KpiCard({ icon: Icon, label, value, subtext }: KpiCardProps) {
  return (
    <article className="bg-card border rounded-xl p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{subtext}</div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// StatusMiniCard
// ---------------------------------------------------------------------------

interface StatusMiniCardProps {
  icon: React.ReactNode
  count: number
  label: string
  colorClass: string
}

function StatusMiniCard({ icon, count, label, colorClass }: StatusMiniCardProps) {
  return (
    <div className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3 shadow-sm">
      <div
        className={cn('flex items-center justify-center size-9 rounded-full shrink-0', colorClass)}
      >
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold tabular-nums">{count}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HeatmapGrid
// ---------------------------------------------------------------------------

interface HeatmapGridProps {
  data: HeatmapEntry[]
}

function HeatmapGrid({ data }: HeatmapGridProps) {
  const DAYS = 90
  const today = useMemo(() => new Date(), [])
  const startDate = useMemo(() => subDays(today, DAYS - 1), [today])

  // Day-of-week offset for Monday-first grid (Mon=0 … Sun=6)
  const startDow = useMemo(() => (getDay(startDate) + 6) % 7, [startDate])

  // Map from date string to heatmap data for O(1) lookup
  const dataMap = useMemo(() => new Map(data.map((d) => [d.date, d])), [data])

  const totalCells = startDow + DAYS
  const totalWeeks = Math.ceil(totalCells / 7)

  // Build the week columns: each column has 7 cells (null = padding / out of range)
  const weeks = useMemo<(HeatmapEntry | null)[][]>(() => {
    const result: (HeatmapEntry | null)[][] = []
    for (let w = 0; w < totalWeeks; w++) {
      const week: (HeatmapEntry | null)[] = []
      for (let d = 0; d < 7; d++) {
        const cellIndex = w * 7 + d
        if (cellIndex < startDow || cellIndex >= startDow + DAYS) {
          week.push(null)
        } else {
          const dayOffset = cellIndex - startDow
          const date = addDays(startDate, dayOffset)
          const dateStr = format(date, 'yyyy-MM-dd')
          const entry = dataMap.get(dateStr)
          week.push(entry ?? { date: dateStr, completed: 0, total: 0 })
        }
      }
      result.push(week)
    }
    return result
  }, [startDate, startDow, totalWeeks, dataMap])

  // Month labels: show abbreviated month name when it changes across weeks
  const monthLabels = useMemo<(string | null)[]>(() => {
    let lastMonth = -1
    return weeks.map((week) => {
      const firstCell = week.find((c) => c !== null)
      if (!firstCell) return null
      const date = parseISO(firstCell.date)
      const month = date.getMonth()
      if (month !== lastMonth) {
        lastMonth = month
        return format(date, 'MMM', { locale: ptBR })
      }
      return null
    })
  }, [weeks])

  return (
    <div
      className="overflow-x-auto"
      role="img"
      aria-label="Mapa de calor de atividade dos últimos 90 dias"
    >
      <div className="flex gap-0.5 min-w-max">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {/* Spacer matching the month label row height */}
          <div className="h-4" aria-hidden="true" />
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className="size-3 text-[10px] text-muted-foreground flex items-center leading-none"
              aria-hidden="true"
            >
              {/* Show every other label to avoid crowding */}
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-0.5">
            {/* Month label */}
            <div
              className="h-4 text-[10px] text-muted-foreground capitalize leading-4 whitespace-nowrap"
              aria-hidden="true"
            >
              {monthLabels[wIndex] ?? ''}
            </div>

            {/* Day cells */}
            {week.map((cell, dIndex) => (
              <div
                key={dIndex}
                className={cn(
                  'size-3 rounded-[2px]',
                  cell === null ? 'invisible' : getHeatmapColor(cell)
                )}
                title={
                  cell
                    ? `${format(parseISO(cell.date), "dd 'de' MMMM", { locale: ptBR })}: ${cell.completed}/${cell.total} tarefas`
                    : undefined
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SectionCard — consistent wrapper for chart sections
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn('bg-card border rounded-xl p-5 shadow-sm', className)}
    >
      <h2
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className="text-sm font-semibold mb-4 text-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// DashboardClient — main export
// ---------------------------------------------------------------------------

interface DashboardClientProps {
  /** Server-fetched data for instant first paint */
  initialData?: DashboardData
}

/**
 * Admin analytics dashboard client shell.
 *
 * Renders KPI cards, a 90-day activity heatmap, monthly trend lines,
 * per-room/category bar charts, per-user completion bars, and a recent
 * comments feed — all backed by TanStack Query with 5-minute cache.
 */
export function DashboardClient({ initialData }: DashboardClientProps) {
  // Recharts needs the DOM for layout measurement — guard against SSR hydration.
  // useSyncExternalStore returns false on the server and true on the client
  // without triggering a setState-in-effect lint violation.
  const isMounted = useSyncExternalStore(
    () => () => {}, // noop subscribe (the value never changes)
    () => true, // client snapshot
    () => false // server snapshot
  )

  const chartColors = useChartColors()
  const { data, isFetching, dataUpdatedAt } = useDashboard('30d', initialData)
  const handleRefresh = useDashboardRefresh('30d')

  // Fall back to a zero-state object so we never render with undefined
  const dashboard: DashboardData = data ?? {
    completionRate: 0,
    activeUsers: 0,
    daysWithoutActivity: 0,
    completedCount: 0,
    pendingCount: 0,
    skippedCount: 0,
    avgCompletionMinutes: 0,
    avgActualMinutes: 0,
    heatmap: [],
    monthlyTrend: [],
    byRoom: [],
    byCategory: [],
    byUser: [],
    recentComments: [],
  }

  const updatedAtLabel = dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm') : null

  return (
    <div className="px-4 md:px-6 pt-6 pb-12 max-w-7xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral da atividade de limpeza
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAtLabel && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Atualizado às {updatedAtLabel}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            aria-label="Atualizar dados do dashboard"
            disabled={isFetching}
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-3.5', isFetching && 'animate-spin')}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* ── Section 1: KPI Cards ── */}
      <section aria-label="Indicadores principais">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            icon={CheckCircle2}
            label="Taxa de Conclusão"
            value={`${dashboard.completionRate}%`}
            subtext="Últimos 30 dias"
          />
          <KpiCard
            icon={Users}
            label="Usuários Ativos"
            value={dashboard.activeUsers}
            subtext="Contas ativas no sistema"
          />
          <KpiCard
            icon={AlertCircle}
            label="Dias sem Atividade"
            value={
              dashboard.daysWithoutActivity === 999
                ? '—'
                : `${dashboard.daysWithoutActivity} dia${dashboard.daysWithoutActivity !== 1 ? 's' : ''}`
            }
            subtext="Desde a última conclusão"
          />
          <KpiCard
            icon={Timer}
            label="Tempo Médio"
            value={
              dashboard.avgCompletionMinutes > 0 ? `${dashboard.avgCompletionMinutes} min` : '—'
            }
            subtext="Por tarefa (30 dias)"
          />
          <KpiCard
            icon={Timer}
            label="Tempo Real Médio"
            value={dashboard.avgActualMinutes > 0 ? `${dashboard.avgActualMinutes} min` : '—'}
            subtext="cronômetro (clock in → out)"
          />
        </div>
      </section>

      {/* ── Section 2: Status Summary ── */}
      <section aria-label="Resumo de status">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatusMiniCard
            icon={<CheckCheck className="size-4 text-brand" aria-hidden="true" />}
            count={dashboard.completedCount}
            label="Concluídas (30 dias)"
            colorClass="bg-brand/12"
          />
          <StatusMiniCard
            icon={<Clock className="size-4 text-warning" aria-hidden="true" />}
            count={dashboard.pendingCount}
            label="Pendentes hoje"
            colorClass="bg-warning/12"
          />
          <StatusMiniCard
            icon={<SkipForward className="size-4 text-muted-foreground" aria-hidden="true" />}
            count={dashboard.skippedCount}
            label="Ignoradas (30 dias)"
            colorClass="bg-muted"
          />
        </div>
      </section>

      {/* ── Section 3: Activity Heatmap ── */}
      <SectionCard title="Atividade nos últimos 90 dias">
        {isMounted ? (
          <HeatmapGrid data={dashboard.heatmap} />
        ) : (
          <div className="h-20 bg-muted rounded animate-pulse" aria-hidden="true" />
        )}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3" aria-hidden="true">
          <span className="text-[10px] text-muted-foreground">Menos</span>
          <div className="size-3 rounded-[2px] bg-muted" />
          <div className="size-3 rounded-[2px] bg-brand/20" />
          <div className="size-3 rounded-[2px] bg-brand/45" />
          <div className="size-3 rounded-[2px] bg-brand/65" />
          <div className="size-3 rounded-[2px] bg-brand" />
          <span className="text-[10px] text-muted-foreground">Mais</span>
        </div>
      </SectionCard>

      {/* ── Section 4: Monthly Trend ── */}
      <SectionCard title="Tendência Mensal (12 meses)">
        {isMounted ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={dashboard.monthlyTrend}
              margin={{ top: 4, right: 16, bottom: 0, left: -16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="var(--chart-completed)"
                name="Concluídas"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="pending"
                stroke="var(--chart-pending)"
                name="Pendentes"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="skipped"
                stroke="var(--chart-skipped)"
                name="Ignoradas"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] bg-muted rounded animate-pulse" aria-hidden="true" />
        )}
      </SectionCard>

      {/* ── Section 5: By Room + By Category ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Tarefas por Sala (30 dias)">
          {isMounted && dashboard.byRoom.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={dashboard.byRoom}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="roomName"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  dataKey="completed"
                  name="Concluídas"
                  fill="var(--chart-completed)"
                  radius={[0, 2, 2, 0]}
                />
                <Bar
                  dataKey="pending"
                  name="Pendentes"
                  fill="var(--chart-pending)"
                  radius={[0, 2, 2, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] bg-muted rounded animate-pulse" aria-hidden="true" />
          )}
        </SectionCard>

        <SectionCard title="Tarefas por Categoria (30 dias)">
          {isMounted && dashboard.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={dashboard.byCategory}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="categoryName"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  dataKey="completed"
                  name="Concluídas"
                  fill="var(--chart-completed)"
                  radius={[0, 2, 2, 0]}
                />
                <Bar
                  dataKey="pending"
                  name="Pendentes"
                  fill="var(--chart-pending)"
                  radius={[0, 2, 2, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] bg-muted rounded animate-pulse" aria-hidden="true" />
          )}
        </SectionCard>
      </div>

      {/* ── Section 6: By User ── */}
      {dashboard.byUser.length > 0 && (
        <SectionCard title="Taxa de Conclusão por Usuário (30 dias)">
          {isMounted ? (
            <ResponsiveContainer width="100%" height={Math.max(160, dashboard.byUser.length * 48)}>
              <BarChart data={dashboard.byUser} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="userName"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0)}%`, 'Taxa de Conclusão']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="completionRate" name="Taxa de Conclusão" radius={[2, 2, 0, 0]}>
                  {dashboard.byUser.map((entry) => (
                    <Cell
                      key={entry.userId}
                      fill={getUserBarColor(entry.completionRate, chartColors)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 bg-muted rounded animate-pulse" aria-hidden="true" />
          )}
          {/* Color legend */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-brand" />≥ 80% — Ótimo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-warning" />≥ 50% — Regular
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-destructive" />
              &lt; 50% — Abaixo do esperado
            </span>
          </div>
        </SectionCard>
      )}

      {/* ── Section 7: Recent Comments ── */}
      {dashboard.recentComments.length > 0 && (
        <SectionCard title="Comentários Recentes">
          <ul className="space-y-4" aria-label="Lista de comentários recentes">
            {dashboard.recentComments.map((comment) => (
              <li key={comment.id} className="flex items-start gap-3">
                {/* Avatar initials */}
                <div
                  className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-semibold shrink-0"
                  aria-hidden="true"
                >
                  {getInitials(comment.user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">{comment.user.name}</span>
                    <span className="text-muted-foreground"> comentou em </span>
                    <span className="font-medium truncate">
                      &ldquo;{comment.schedule.task.title}&rdquo;
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {comment.comment.length > 80
                      ? `${comment.comment.slice(0, 80)}…`
                      : comment.comment}
                  </p>
                  <time
                    dateTime={comment.createdAt}
                    className="text-xs text-muted-foreground mt-0.5 block"
                  >
                    {isMounted
                      ? formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : '—'}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  )
}
