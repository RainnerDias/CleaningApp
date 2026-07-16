import 'server-only'

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { categoryRepository } from '../repositories/categoryRepository'
import type { CreateCategoryInput, UpdateCategoryInput } from '../types'

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
      entityType: 'category',
      entityId,
      ...(oldJson !== undefined ? { oldValue: oldJson } : {}),
      ...(newJson !== undefined ? { newValue: newJson } : {}),
    },
  })
}

export const categoryService = {
  getAll: () => categoryRepository.findAll(),

  getById: (id: string) => categoryRepository.findById(id),

  create: async (userId: string, data: CreateCategoryInput) => {
    const category = await categoryRepository.create(data)
    await writeAuditLog(userId, 'CREATE', category.id, null, category)
    return category
  },

  update: async (userId: string, id: string, data: UpdateCategoryInput) => {
    const old = await categoryRepository.findById(id)
    const category = await categoryRepository.update(id, data)
    await writeAuditLog(userId, 'UPDATE', id, old, category)
    return category
  },

  delete: async (userId: string, id: string) => {
    const old = await categoryRepository.findById(id)
    await categoryRepository.delete(id)
    await writeAuditLog(userId, 'DELETE', id, old, null)
  },
}
