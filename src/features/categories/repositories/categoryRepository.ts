import 'server-only'

import { prisma } from '@/lib/prisma'
import type { CreateCategoryInput, UpdateCategoryInput } from '../types'

export const categoryRepository = {
  findAll: () =>
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { tasks: true } } },
    }),

  findById: (id: string) => prisma.category.findUnique({ where: { id } }),

  create: (data: CreateCategoryInput) => prisma.category.create({ data }),

  update: (id: string, data: UpdateCategoryInput) =>
    prisma.category.update({ where: { id }, data }),

  delete: (id: string) => prisma.category.delete({ where: { id } }),
}
