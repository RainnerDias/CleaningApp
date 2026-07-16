import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { requireAdmin } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import type { ScheduleStatus } from '@prisma/client'

const VALID_STATUSES: ScheduleStatus[] = ['pending', 'completed', 'skipped']

/**
 * GET /api/admin/reports
 *
 * Query params:
 *   from       ISO date string (required)
 *   to         ISO date string (required)
 *   roomId     UUID (optional)
 *   userId     UUID (optional)
 *   status     pending | completed | skipped (optional)
 *   page       integer >= 1 (default: 1)
 *   limit      integer 1–100 (default: 25)
 *
 * Returns paginated schedule data with a summary row (total, completed,
 * pending, skipped, completion rate).
 */
export async function GET(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  // ── Parse params ────────────────────────────────────────────────────────
  const { searchParams } = request.nextUrl

  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const roomId = searchParams.get('roomId') || undefined
  const userId = searchParams.get('userId') || undefined
  const statusParam = searchParams.get('status') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)))

  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '`from` and `to` query params are required' } },
      { status: 422 }
    )
  }

  let fromDate: Date
  let toDate: Date
  try {
    fromDate = startOfDay(parseISO(fromStr))
    toDate = endOfDay(parseISO(toStr))
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: '`from` and `to` must be valid ISO date strings',
        },
      },
      { status: 422 }
    )
  }

  if (fromDate > toDate) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '`from` must be before or equal to `to`' } },
      { status: 422 }
    )
  }

  const status =
    statusParam && VALID_STATUSES.includes(statusParam as ScheduleStatus)
      ? (statusParam as ScheduleStatus)
      : undefined

  // ── Build where clause ──────────────────────────────────────────────────
  const where = {
    date: { gte: fromDate, lte: toDate },
    ...(userId ? { assignedTo: userId } : {}),
    ...(status ? { status } : {}),
    ...(roomId ? { task: { roomId } } : {}),
  }

  // ── Query ────────────────────────────────────────────────────────────────
  try {
    const [total, data, statusCounts] = await Promise.all([
      prisma.schedule.count({ where }),
      prisma.schedule.findMany({
        where,
        select: {
          id: true,
          date: true,
          status: true,
          completedAt: true,
          task: {
            select: {
              id: true,
              title: true,
              estimatedMinutes: true,
              room: { select: { id: true, name: true } },
            },
          },
          user: { select: { id: true, name: true } },
        },
        orderBy: [{ date: 'asc' }, { task: { room: { displayOrder: 'asc' } } }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.schedule.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ])

    const byStatus = statusCounts.reduce(
      (acc, row) => ({ ...acc, [row.status]: row._count.status }),
      {} as Record<string, number>
    )

    const completed = byStatus['completed'] ?? 0
    const pending = byStatus['pending'] ?? 0
    const skipped = byStatus['skipped'] ?? 0
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: { total, completed, pending, skipped, completionRate },
    })
  } catch (err) {
    console.error('[GET /api/admin/reports]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch report data' } },
      { status: 500 }
    )
  }
}
