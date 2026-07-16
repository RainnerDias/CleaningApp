import type { Role } from '@prisma/client'

export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
  _count?: { schedules: number }
}

export interface InviteUserInput {
  name: string
  email: string
  role: Role
}

export interface UpdateUserInput {
  name?: string
  role?: Role
  active?: boolean
}
