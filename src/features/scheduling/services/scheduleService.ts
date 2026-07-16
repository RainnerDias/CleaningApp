'server-only'

import { prisma } from '@/lib/prisma'
import { scheduleRepository } from '../repositories/scheduleRepository'
import type { ScheduleStatus } from '@prisma/client'

export const scheduleService = {
  getByDateRange: (
    from: Date,
    to: Date,
    userId?: string,
    status?: ScheduleStatus,
    roomId?: string
  ) => scheduleRepository.findByDateRange(from, to, userId, status, roomId),

  getByDate: (date: Date, userId?: string) => scheduleRepository.findByDate(date, userId),

  /**
   * Updates the status of a schedule entry.
   *
   * Authorization rules:
   *  - Admins may update any schedule.
   *  - Regular users may only update schedules assigned to them.
   *
   * @throws {Error} 'Schedule not found' when the ID does not exist.
   * @throws {Error} 'Unauthorized' when the caller does not own the schedule and is not an admin.
   */
  updateStatus: async (
    scheduleId: string,
    callerId: string,
    status: ScheduleStatus
  ): Promise<ReturnType<typeof scheduleRepository.updateStatus>> => {
    const [schedule, caller] = await Promise.all([
      prisma.schedule.findUnique({ where: { id: scheduleId }, select: { assignedTo: true } }),
      prisma.user.findUnique({ where: { id: callerId }, select: { role: true } }),
    ])

    if (!schedule) throw new Error('Schedule not found')
    if (caller?.role !== 'admin' && schedule.assignedTo !== callerId) {
      throw new Error('Unauthorized')
    }

    return scheduleRepository.updateStatus(scheduleId, status)
  },

  getStats: (from: Date, to: Date) => scheduleRepository.getStats(from, to),
}
