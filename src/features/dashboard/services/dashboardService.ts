'server-only'

import { prisma } from '@/lib/prisma'
import { subDays, subMonths, startOfDay, endOfDay, differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type {
  DashboardData,
  HeatmapEntry,
  ByRoomEntry,
  ByCategoryEntry,
  ByUserEntry,
  RecentComment,
} from '../types'

// ---------------------------------------------------------------------------
// Raw query result types (internal — columns match SQL aliases)
// ---------------------------------------------------------------------------

type MonthlyTrendRow = {
  month: Date
  completed: number
  pending: number
  skipped: number
}

type ByRoomRow = {
  roomId: string
  roomName: string
  color: string
  completed: number
  pending: number
}

type ByCategoryRow = {
  categoryId: string
  categoryName: string
  color: string
  completed: number
  pending: number
}

type ByUserRow = {
  userId: string
  userName: string
  completed: number
  pending: number
  total: number
}

type AvgRow = {
  avgMinutes: number
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Fetches all dashboard analytics data in a single parallel query batch.
 * Called by both the API route and the server page component.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()
  const thirtyDaysAgo = startOfDay(subDays(now, 30))
  const ninetyDaysAgo = startOfDay(subDays(now, 90))
  const twelveMonthsAgo = subMonths(now, 12)
  const todayStart = startOfDay(now)
  const nowEnd = endOfDay(now)

  const [
    thirtyDayStatusRows,
    activeUsers,
    lastCompleted,
    pendingCount,
    heatmapRows,
    monthlyTrendRows,
    byRoomRows,
    byCategoryRows,
    byUserRows,
    avgRows,
    recentCommentRows,
  ] = await Promise.all([
    // 1. Status breakdown for last 30 days (completionRate, completedCount, skippedCount)
    prisma.schedule.groupBy({
      by: ['status'],
      where: { date: { gte: thirtyDaysAgo, lte: nowEnd } },
      _count: { status: true },
    }),

    // 2. Active user count
    prisma.user.count({ where: { active: true } }),

    // 3. Most recent completedAt (for daysWithoutActivity)
    prisma.schedule.findFirst({
      where: { status: 'completed', completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    }),

    // 4. Today's pending count
    prisma.schedule.count({
      where: { date: todayStart, status: 'pending' },
    }),

    // 5. Heatmap: last 90 days grouped by date + status
    prisma.schedule.groupBy({
      by: ['date', 'status'],
      where: { date: { gte: ninetyDaysAgo, lte: nowEnd } },
      _count: { status: true },
    }),

    // 6. Monthly trend (last 12 months) — raw SQL for date_trunc
    prisma.$queryRaw<MonthlyTrendRow[]>`
      SELECT
        DATE_TRUNC('month', date) AS month,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed,
        COUNT(CASE WHEN status = 'pending'   THEN 1 END)::int AS pending,
        COUNT(CASE WHEN status = 'skipped'   THEN 1 END)::int AS skipped
      FROM schedules
      WHERE date >= ${twelveMonthsAgo}::date
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `,

    // 7. By room — last 30 days
    prisma.$queryRaw<ByRoomRow[]>`
      SELECT
        r.id        AS "roomId",
        r.name      AS "roomName",
        r.color,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::int AS completed,
        COUNT(CASE WHEN s.status = 'pending'   THEN 1 END)::int AS pending
      FROM schedules s
      JOIN tasks t ON t.id = s.task_id
      JOIN rooms  r ON r.id = t.room_id
      WHERE s.date >= ${thirtyDaysAgo}::date
        AND s.date <= ${nowEnd}::date
      GROUP BY r.id, r.name, r.color
      ORDER BY r.name
    `,

    // 8. By category — last 30 days
    prisma.$queryRaw<ByCategoryRow[]>`
      SELECT
        c.id    AS "categoryId",
        c.name  AS "categoryName",
        c.color,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::int AS completed,
        COUNT(CASE WHEN s.status = 'pending'   THEN 1 END)::int AS pending
      FROM schedules s
      JOIN tasks      t ON t.id = s.task_id
      JOIN categories c ON c.id = t.category_id
      WHERE s.date >= ${thirtyDaysAgo}::date
        AND s.date <= ${nowEnd}::date
      GROUP BY c.id, c.name, c.color
      ORDER BY c.name
    `,

    // 9. By user — last 30 days
    prisma.$queryRaw<ByUserRow[]>`
      SELECT
        u.id    AS "userId",
        u.name  AS "userName",
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::int AS completed,
        COUNT(CASE WHEN s.status = 'pending'   THEN 1 END)::int AS pending,
        COUNT(*)::int                                             AS total
      FROM schedules s
      JOIN users u ON u.id = s.assigned_to
      WHERE s.date >= ${thirtyDaysAgo}::date
        AND s.date <= ${nowEnd}::date
      GROUP BY u.id, u.name
      ORDER BY u.name
    `,

    // 10. Average completion time in minutes — last 30 days
    prisma.$queryRaw<AvgRow[]>`
      SELECT COALESCE(
        AVG(EXTRACT(EPOCH FROM (completed_at - date::timestamp)) / 60)::int,
        0
      ) AS "avgMinutes"
      FROM schedules
      WHERE date >= ${thirtyDaysAgo}::date
        AND status = 'completed'
        AND completed_at IS NOT NULL
    `,

    // 11. Recent comments (last 10, across all tasks)
    prisma.taskComment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
        schedule: {
          select: { task: { select: { title: true } } },
        },
      },
    }),
  ])

  // ---------------------------------------------------------------------------
  // Process KPI metrics
  // ---------------------------------------------------------------------------

  const statusCounts = thirtyDayStatusRows.reduce(
    (acc, row) => ({ ...acc, [row.status]: row._count.status }),
    { completed: 0, pending: 0, skipped: 0 } as Record<string, number>
  )
  const completedCount = statusCounts['completed'] ?? 0
  const skippedCount = statusCounts['skipped'] ?? 0
  const totalThirty = completedCount + (statusCounts['pending'] ?? 0) + skippedCount
  const completionRate = totalThirty > 0 ? Math.round((completedCount / totalThirty) * 100) : 0

  const daysWithoutActivity = lastCompleted?.completedAt
    ? differenceInDays(now, lastCompleted.completedAt)
    : 999

  // ---------------------------------------------------------------------------
  // Process heatmap
  // ---------------------------------------------------------------------------

  const heatmapMap = new Map<string, { completed: number; total: number }>()
  for (const row of heatmapRows) {
    const dateStr = format(row.date, 'yyyy-MM-dd')
    const entry = heatmapMap.get(dateStr) ?? { completed: 0, total: 0 }
    const count = row._count.status
    entry.total += count
    if (row.status === 'completed') entry.completed += count
    heatmapMap.set(dateStr, entry)
  }
  const heatmap: HeatmapEntry[] = Array.from(heatmapMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))

  // ---------------------------------------------------------------------------
  // Process monthly trend
  // ---------------------------------------------------------------------------

  const monthlyTrend = monthlyTrendRows.map((row) => ({
    month: format(new Date(row.month), 'MMM/yy', { locale: ptBR }),
    completed: row.completed,
    pending: row.pending,
    skipped: row.skipped,
  }))

  // ---------------------------------------------------------------------------
  // Process by user with derived completionRate
  // ---------------------------------------------------------------------------

  const byUser: ByUserEntry[] = byUserRows.map((row) => ({
    userId: row.userId,
    userName: row.userName,
    completed: row.completed,
    pending: row.pending,
    completionRate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
  }))

  // ---------------------------------------------------------------------------
  // Process recent comments (serialize dates)
  // ---------------------------------------------------------------------------

  const recentComments: RecentComment[] = recentCommentRows.map((c) => ({
    id: c.id,
    comment: c.comment,
    createdAt: c.createdAt.toISOString(),
    user: { name: c.user.name },
    schedule: { task: { title: c.schedule.task.title } },
  }))

  // ---------------------------------------------------------------------------
  // Compose result
  // ---------------------------------------------------------------------------

  return {
    completionRate,
    activeUsers,
    daysWithoutActivity,
    completedCount,
    pendingCount,
    skippedCount,
    avgCompletionMinutes: avgRows[0]?.avgMinutes ?? 0,
    heatmap,
    monthlyTrend,
    byRoom: byRoomRows as ByRoomEntry[],
    byCategory: byCategoryRows as ByCategoryEntry[],
    byUser,
    recentComments,
  }
}
