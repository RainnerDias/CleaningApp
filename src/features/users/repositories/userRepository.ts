import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

export const userRepository = {
  findAll: () =>
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { schedules: true } } },
    }),

  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  create: (data: { id: string; name: string; email: string; role: Role }) =>
    prisma.user.create({ data }),

  update: (id: string, data: { name?: string; role?: Role; active?: boolean }) =>
    prisma.user.update({ where: { id }, data }),
}
