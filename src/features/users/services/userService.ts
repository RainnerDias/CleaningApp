import 'server-only'

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { userRepository } from '../repositories/userRepository'
import type { InviteUserInput, UpdateUserInput } from '../types'

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
      entityType: 'user',
      entityId,
      ...(oldJson !== undefined ? { oldValue: oldJson } : {}),
      ...(newJson !== undefined ? { newValue: newJson } : {}),
    },
  })
}

export const userService = {
  getAll: () => userRepository.findAll(),

  invite: async (adminId: string, input: InviteUserInput) => {
    // 1. Create user in Supabase Auth with a pre-set password (no invite email needed)
    const supabase = createAdminClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // skip email verification — admin already knows the user
      user_metadata: { name: input.name, role: input.role },
    })
    if (authError) throw new Error(authError.message)

    // 2. Create DB record (id must match the Supabase auth user id)
    const user = await userRepository.create({
      id: authData.user.id,
      name: input.name,
      email: input.email,
      role: input.role,
    })

    await writeAuditLog(adminId, 'INVITE', user.id, null, {
      name: user.name,
      email: user.email,
      role: user.role,
    })
    return user
  },

  update: async (adminId: string, id: string, data: UpdateUserInput) => {
    const old = await userRepository.findById(id)

    const supabase = createAdminClient()

    // Sync active flag with Supabase Auth ban status
    if (data.active === false) {
      await supabase.auth.admin.updateUserById(id, { ban_duration: '876000h' }) // ~100 years
    }

    if (data.active === true) {
      await supabase.auth.admin.updateUserById(id, { ban_duration: 'none' })
    }

    const user = await userRepository.update(id, data)
    await writeAuditLog(adminId, 'UPDATE', id, old, user)
    return user
  },
}
