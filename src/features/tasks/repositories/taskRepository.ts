import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Priority, FrequencyType } from '@prisma/client'

/** Shared include for all task queries — always loads room, category, and frequency. */
const taskInclude = {
  room: { select: { id: true, name: true, color: true, icon: true } },
  category: { select: { id: true, name: true, color: true } },
  frequency: true,
} as const

export type TaskCreateData = {
  roomId: string
  categoryId?: string | null
  title: string
  description?: string | null
  estimatedMinutes: number
  priority: Priority
  active: boolean
  goldenRuleApplies: boolean
}

export type TaskUpdateData = Partial<TaskCreateData>

export const taskRepository = {
  findAll: () =>
    prisma.task.findMany({
      include: taskInclude,
      orderBy: [{ room: { displayOrder: 'asc' } }, { title: 'asc' }],
    }),

  findById: (id: string) => prisma.task.findUnique({ where: { id }, include: taskInclude }),

  create: (data: TaskCreateData) => prisma.task.create({ data, include: taskInclude }),

  update: (id: string, data: TaskUpdateData) =>
    prisma.task.update({ where: { id }, data, include: taskInclude }),

  delete: (id: string) => prisma.task.delete({ where: { id } }),
}

export type FrequencyUpsertData = {
  type: FrequencyType
  daysOfWeek?: number[]
  weekOfMonth?: number | null
  dayOfMonth?: number | null
}

export const frequencyRepository = {
  upsert: (taskId: string, data: FrequencyUpsertData) =>
    prisma.frequency.upsert({
      where: { taskId },
      create: {
        taskId,
        type: data.type,
        daysOfWeek: data.daysOfWeek ?? [],
        weekOfMonth: data.weekOfMonth ?? null,
        dayOfMonth: data.dayOfMonth ?? null,
      },
      update: {
        type: data.type,
        daysOfWeek: data.daysOfWeek ?? [],
        weekOfMonth: data.weekOfMonth ?? null,
        dayOfMonth: data.dayOfMonth ?? null,
      },
    }),

  delete: (taskId: string) => prisma.frequency.deleteMany({ where: { taskId } }),
}
