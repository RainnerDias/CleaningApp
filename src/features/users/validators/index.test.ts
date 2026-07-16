// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { inviteUserSchema, updateUserSchema } from './index'

describe('inviteUserSchema', () => {
  const validInvite = {
    name: 'João Silva',
    email: 'joao@exemplo.com',
    role: 'user' as const,
  }

  it('should pass valid invite input', () => {
    const result = inviteUserSchema.safeParse(validInvite)
    expect(result.success).toBe(true)
  })

  it('should pass valid invite input with admin role', () => {
    const result = inviteUserSchema.safeParse({ ...validInvite, role: 'admin' })
    expect(result.success).toBe(true)
  })

  it('should fail when email is invalid', () => {
    const result = inviteUserSchema.safeParse({ ...validInvite, email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === 'email')
      expect(emailIssue).toBeDefined()
    }
  })

  it('should fail when email is empty', () => {
    const result = inviteUserSchema.safeParse({ ...validInvite, email: '' })
    expect(result.success).toBe(false)
  })

  it('should fail when name is empty', () => {
    const result = inviteUserSchema.safeParse({ ...validInvite, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameIssue).toBeDefined()
    }
  })

  it('should fail when name exceeds 255 characters', () => {
    const result = inviteUserSchema.safeParse({ ...validInvite, name: 'a'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('should fail when role is invalid', () => {
    const result = inviteUserSchema.safeParse({ ...validInvite, role: 'superadmin' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const roleIssue = result.error.issues.find((i) => i.path[0] === 'role')
      expect(roleIssue).toBeDefined()
    }
  })

  it('should fail when role is missing', () => {
    const { role: _r, ...withoutRole } = validInvite
    const result = inviteUserSchema.safeParse(withoutRole)
    expect(result.success).toBe(false)
  })
})

describe('updateUserSchema', () => {
  it('should pass valid update input with partial fields', () => {
    const result = updateUserSchema.safeParse({ name: 'Maria Souza' })
    expect(result.success).toBe(true)
  })

  it('should pass when all fields are provided', () => {
    const result = updateUserSchema.safeParse({
      name: 'Carlos Ferreira',
      role: 'admin',
      active: false,
    })
    expect(result.success).toBe(true)
  })

  it('should pass for a fully empty object (all fields optional)', () => {
    const result = updateUserSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should pass when active is boolean true', () => {
    const result = updateUserSchema.safeParse({ active: true })
    expect(result.success).toBe(true)
  })

  it('should pass when active is boolean false', () => {
    const result = updateUserSchema.safeParse({ active: false })
    expect(result.success).toBe(true)
  })

  it('should fail when role is invalid', () => {
    const result = updateUserSchema.safeParse({ role: 'moderator' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const roleIssue = result.error.issues.find((i) => i.path[0] === 'role')
      expect(roleIssue).toBeDefined()
    }
  })

  it('should fail when name is provided but empty', () => {
    const result = updateUserSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameIssue).toBeDefined()
    }
  })

  it('should fail when name exceeds 255 characters', () => {
    const result = updateUserSchema.safeParse({ name: 'x'.repeat(256) })
    expect(result.success).toBe(false)
  })
})
