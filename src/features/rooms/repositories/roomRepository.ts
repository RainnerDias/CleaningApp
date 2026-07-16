import 'server-only'

import { prisma } from '@/lib/prisma'
import type { CreateRoomInput, UpdateRoomInput } from '../types'

export const roomRepository = {
  findAll: () =>
    prisma.room.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { tasks: true } } },
    }),

  findById: (id: string) => prisma.room.findUnique({ where: { id } }),

  create: (data: CreateRoomInput) => prisma.room.create({ data }),

  update: (id: string, data: UpdateRoomInput) => prisma.room.update({ where: { id }, data }),

  delete: (id: string) => prisma.room.delete({ where: { id } }),

  reorder: (items: { id: string; displayOrder: number }[]) =>
    prisma.$transaction(
      items.map(({ id, displayOrder }) =>
        prisma.room.update({ where: { id }, data: { displayOrder } })
      )
    ),
}
