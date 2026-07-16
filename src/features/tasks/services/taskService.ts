import 'server-only'

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  taskRepository,
  frequencyRepository,
  type TaskCreateData,
  type TaskUpdateData,
  type FrequencyUpsertData,
} from '../repositories/taskRepository'

/** Serialises any value to a JSON-safe representation for audit logs. */
function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

async function writeAuditLog(
  userId: string,
  action: string,
  entityId: string,
  oldValue: unknown,
  newValue: unknown
): Promise<void> {
  const oldJson = toJson(oldValue)
  const newJson = toJson(newValue)

  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'task',
      entityId,
      ...(oldJson !== undefined ? { oldValue: oldJson } : {}),
      ...(newJson !== undefined ? { newValue: newJson } : {}),
    },
  })
}

export const taskService = {
  getAll: () => taskRepository.findAll(),

  getById: (id: string) => taskRepository.findById(id),

  create: async (userId: string, taskData: TaskCreateData, frequencyData?: FrequencyUpsertData) => {
    const task = await taskRepository.create(taskData)

    if (frequencyData) {
      await frequencyRepository.upsert(task.id, frequencyData)
    }

    // Re-fetch to include the newly created frequency relation
    const full = await taskRepository.findById(task.id)
    await writeAuditLog(userId, 'CREATE', task.id, null, full)
    return full
  },

  update: async (
    userId: string,
    id: string,
    taskData: TaskUpdateData,
    frequencyData?: FrequencyUpsertData
  ) => {
    const old = await taskRepository.findById(id)
    await taskRepository.update(id, taskData)

    if (frequencyData) {
      await frequencyRepository.upsert(id, frequencyData)
    }

    const updated = await taskRepository.findById(id)
    await writeAuditLog(userId, 'UPDATE', id, old, updated)
    return updated
  },

  delete: async (userId: string, id: string) => {
    const old = await taskRepository.findById(id)
    await taskRepository.delete(id)
    await writeAuditLog(userId, 'DELETE', id, old, null)
  },
}
