import 'server-only'

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { roomRepository } from '../repositories/roomRepository'
import type { CreateRoomInput, UpdateRoomInput } from '../types'

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
      entityType: 'room',
      entityId,
      ...(oldJson !== undefined ? { oldValue: oldJson } : {}),
      ...(newJson !== undefined ? { newValue: newJson } : {}),
    },
  })
}

export const roomService = {
  getAll: () => roomRepository.findAll(),

  getById: (id: string) => roomRepository.findById(id),

  create: async (userId: string, data: CreateRoomInput) => {
    const room = await roomRepository.create(data)
    await writeAuditLog(userId, 'CREATE', room.id, null, room)
    return room
  },

  update: async (userId: string, id: string, data: UpdateRoomInput) => {
    const old = await roomRepository.findById(id)
    const room = await roomRepository.update(id, data)
    await writeAuditLog(userId, 'UPDATE', id, old, room)
    return room
  },

  delete: async (userId: string, id: string) => {
    const old = await roomRepository.findById(id)
    await roomRepository.delete(id)
    await writeAuditLog(userId, 'DELETE', id, old, null)
  },

  reorder: (items: { id: string; displayOrder: number }[]) => roomRepository.reorder(items),
}
