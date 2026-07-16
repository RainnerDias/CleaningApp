'server-only'

import { startOfDay, endOfDay } from 'date-fns'
import { prisma } from '@/lib/prisma'
import type { ScheduleStatus } from '@prisma/client'

/** Shared include for full schedule detail (used in single-day and date-range queries). */
const scheduleInclude = {
  task: {
    include: {
      room: { select: { id: true, name: true, color: true, icon: true } },
      category: { select: { id: true, name: true, color: true } },
    },
  },
  user: { select: { id: true, name: true, avatarUrl: true } },
  comments: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  photos: true,
} as const

export const scheduleRepository = {
  /** Returns all schedules in the given date range, optionally filtered by user, status, and room. */
  findByDateRange: (
    from: Date,
    to: Date,
    userId?: string,
    status?: ScheduleStatus,
    roomId?: string
  ) =>
    prisma.schedule.findMany({
      where: {
        date: { gte: startOfDay(from), lte: endOfDay(to) },
        ...(userId ? { assignedTo: userId } : {}),
        ...(status ? { status } : {}),
        ...(roomId ? { task: { roomId } } : {}),
      },
      include: scheduleInclude,
      orderBy: [{ date: 'asc' }, { task: { room: { displayOrder: 'asc' } } }],
    }),

  /** Returns all schedules for a single date, optionally filtered by user. */
  findByDate: (date: Date, userId?: string) =>
    prisma.schedule.findMany({
      where: {
        date: startOfDay(date),
        ...(userId ? { assignedTo: userId } : {}),
      },
      include: scheduleInclude,
      orderBy: [{ task: { room: { displayOrder: 'asc' } } }, { task: { priority: 'desc' } }],
    }),

  /** Returns a single schedule by its primary key. */
  findById: (id: string) =>
    prisma.schedule.findUnique({
      where: { id },
      include: scheduleInclude,
    }),

  /** Updates the status of a schedule entry. Sets completedAt on completion. */
  updateStatus: (id: string, status: ScheduleStatus, completedAt?: Date) =>
    prisma.schedule.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'completed' ? (completedAt ?? new Date()) : null,
      },
    }),

  /** Returns counts grouped by status for the given date range. */
  getStats: async (from: Date, to: Date): Promise<Record<string, number>> => {
    const rows = await prisma.schedule.groupBy({
      by: ['status'],
      where: { date: { gte: startOfDay(from), lte: endOfDay(to) } },
      _count: { status: true },
    })
    return rows.reduce(
      (acc, row) => ({ ...acc, [row.status]: row._count.status }),
      {} as Record<string, number>
    )
  },
}
