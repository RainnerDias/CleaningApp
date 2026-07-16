// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { createRoomSchema, updateRoomSchema } from './index'

describe('createRoomSchema', () => {
  const validRoom = {
    name: 'Cozinha',
    icon: '🍳',
    color: '#FF5733',
    displayOrder: 1,
  }

  it('should pass for a valid room', () => {
    const result = createRoomSchema.safeParse(validRoom)
    expect(result.success).toBe(true)
  })

  it('should pass when displayOrder is omitted (optional)', () => {
    const { displayOrder: _o, ...withoutOrder } = validRoom
    const result = createRoomSchema.safeParse(withoutOrder)
    expect(result.success).toBe(true)
  })

  it('should fail when name is empty', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameIssue).toBeDefined()
    }
  })

  it('should fail when name exceeds 255 characters', () => {
    const result = createRoomSchema.safeParse({
      ...validRoom,
      name: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('should fail when icon is empty', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, icon: '' })
    expect(result.success).toBe(false)
  })

  it('should fail when icon exceeds 100 characters', () => {
    const result = createRoomSchema.safeParse({
      ...validRoom,
      icon: 'a'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('should fail when color is not a valid hex string', () => {
    const invalidColors = ['red', '#GGG', '#12345', 'rgb(255,0,0)', '']
    for (const color of invalidColors) {
      const result = createRoomSchema.safeParse({ ...validRoom, color })
      expect(result.success, `color "${color}" should fail`).toBe(false)
    }
  })

  it('should pass for a 6-digit hex color (uppercase)', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, color: '#AABBCC' })
    expect(result.success).toBe(true)
  })

  it('should pass for a 6-digit hex color (lowercase)', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, color: '#aabbcc' })
    expect(result.success).toBe(true)
  })

  it('should fail when displayOrder is negative', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, displayOrder: -1 })
    expect(result.success).toBe(false)
  })

  it('should fail when displayOrder is a float', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, displayOrder: 1.5 })
    expect(result.success).toBe(false)
  })
})

describe('updateRoomSchema', () => {
  it('should pass for a fully empty object (all fields optional)', () => {
    const result = updateRoomSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should pass when updating only the name', () => {
    const result = updateRoomSchema.safeParse({ name: 'Sala de Estar' })
    expect(result.success).toBe(true)
  })

  it('should pass when setting active to false', () => {
    const result = updateRoomSchema.safeParse({ active: false })
    expect(result.success).toBe(true)
  })

  it('should fail when color is provided but invalid', () => {
    const result = updateRoomSchema.safeParse({ color: 'not-a-hex' })
    expect(result.success).toBe(false)
  })

  it('should pass when active is boolean', () => {
    const result = updateRoomSchema.safeParse({ active: true })
    expect(result.success).toBe(true)
  })
})
