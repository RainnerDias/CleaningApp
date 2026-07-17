'server-only'

import { startOfDay, endOfDay } from 'date-fns'
import { prisma } from '@/lib/prisma'
import type { ScheduleItemCompletion, ScheduleStatus } from '@prisma/client'

/** Shared include for full schedule detail (used in single-day and date-range queries). */
const scheduleInclude = {
  task: {
    include: {
      room: { select: { id: true, name: true, color: true, icon: true } },
      category: { select: { id: true, name: true, color: true } },
      items: {
        where: { active: true },
        orderBy: { displayOrder: 'asc' as const },
        select: { id: true, title: true, note: true, displayOrder: true },
      },
    },
  },
  user: { select: { id: true, name: true, avatarUrl: true } },
  comments: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  photos: { select: { id: true, imageUrl: true } },
  itemCompletions: {
    select: { id: true, taskItemId: true, completedAt: true },
  },
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

  /** Records clock-in timestamp for a schedule. */
  clockIn: (id: string) =>
    prisma.schedule.update({
      where: { id },
      data: { startedAt: new Date(), stoppedAt: null },
    }),

  /** Records clock-out timestamp for a schedule. */
  clockOut: (id: string) =>
    prisma.schedule.update({
      where: { id },
      data: { stoppedAt: new Date() },
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

  /**
   * Toggles the completion of a single task-item within a schedule.
   *
   * Behavior:
   * - If no completion record exists → creates one with completedAt = now (toggle ON).
   * - If a completion record exists with completedAt set → sets completedAt = null (toggle OFF).
   * - If a completion record exists with completedAt = null → sets completedAt = now (toggle ON).
   *
   * Side effects (within the same transaction):
   * - If toggling ON the last uncompleted active item → sets schedule.status = 'completed'.
   * - If toggling OFF any item → sets schedule.status = 'pending'.
   * - If the task has no active items, schedule status is not touched.
   */
  toggleItemCompletion: async (
    scheduleId: string,
    taskItemId: string
  ): Promise<ScheduleItemCompletion> => {
    return prisma.$transaction(async (tx) => {
      // Resolve the task behind this schedule
      const schedule = await tx.schedule.findUnique({
        where: { id: scheduleId },
        select: { taskId: true },
      })
      if (!schedule) throw new Error('Schedule not found')

      // Find existing completion record (may not exist yet)
      const existing = await tx.scheduleItemCompletion.findUnique({
        where: { scheduleId_taskItemId: { scheduleId, taskItemId } },
      })

      // Determine new completedAt value
      const newCompletedAt = existing?.completedAt ? null : new Date()

      // Upsert the completion record
      const completion = existing
        ? await tx.scheduleItemCompletion.update({
            where: { scheduleId_taskItemId: { scheduleId, taskItemId } },
            data: { completedAt: newCompletedAt },
          })
        : await tx.scheduleItemCompletion.create({
            data: { scheduleId, taskItemId, completedAt: newCompletedAt },
          })

      // Fetch all active items for the task
      const taskItems = await tx.taskItem.findMany({
        where: { taskId: schedule.taskId, active: true },
        select: { id: true },
      })

      if (taskItems.length === 0) {
        // No items — do not touch schedule status
        return completion
      }

      // Fetch all completion records for this schedule's items
      const allCompletions = await tx.scheduleItemCompletion.findMany({
        where: { scheduleId, taskItemId: { in: taskItems.map((i) => i.id) } },
        select: { taskItemId: true, completedAt: true },
      })

      // All items are done when every item has a completedAt value
      const allDone = taskItems.every((item) => {
        const comp = allCompletions.find((c) => c.taskItemId === item.id)
        return comp?.completedAt != null
      })

      if (allDone) {
        // Last item checked — mark schedule as completed
        await tx.schedule.update({
          where: { id: scheduleId },
          data: { status: 'completed', completedAt: new Date() },
        })
      } else if (newCompletedAt === null) {
        // An item was unchecked — revert schedule to pending
        await tx.schedule.update({
          where: { id: scheduleId },
          data: { status: 'pending', completedAt: null },
        })
      }

      return completion
    })
  },
}
