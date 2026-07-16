// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { createCategorySchema, updateCategorySchema } from './index'

describe('createCategorySchema', () => {
  const validCategory = {
    name: 'Limpeza Pesada',
    color: '#3B82F6',
  }

  it('should pass for a valid category', () => {
    const result = createCategorySchema.safeParse(validCategory)
    expect(result.success).toBe(true)
  })

  it('should fail when name is empty', () => {
    const result = createCategorySchema.safeParse({ ...validCategory, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameIssue).toBeDefined()
    }
  })

  it('should fail when name exceeds 255 characters', () => {
    const result = createCategorySchema.safeParse({
      ...validCategory,
      name: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('should fail when color is not a valid hex string', () => {
    const invalidColors = ['blue', '#GGG', '#12345', 'rgb(0,0,255)', '', '#0000001']
    for (const color of invalidColors) {
      const result = createCategorySchema.safeParse({ ...validCategory, color })
      expect(result.success, `color "${color}" should fail`).toBe(false)
    }
  })

  it('should pass for a 6-digit hex color (uppercase)', () => {
    const result = createCategorySchema.safeParse({ ...validCategory, color: '#FFAA00' })
    expect(result.success).toBe(true)
  })

  it('should pass for a 6-digit hex color (lowercase)', () => {
    const result = createCategorySchema.safeParse({ ...validCategory, color: '#ffaa00' })
    expect(result.success).toBe(true)
  })

  it('should fail when color field is missing', () => {
    const result = createCategorySchema.safeParse({ name: 'Test' })
    expect(result.success).toBe(false)
  })

  it('should fail when name field is missing', () => {
    const result = createCategorySchema.safeParse({ color: '#FF0000' })
    expect(result.success).toBe(false)
  })
})

describe('updateCategorySchema', () => {
  it('should pass for a fully empty object (all fields optional)', () => {
    const result = updateCategorySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should pass when updating only the name', () => {
    const result = updateCategorySchema.safeParse({ name: 'Organização' })
    expect(result.success).toBe(true)
  })

  it('should pass when updating only the color', () => {
    const result = updateCategorySchema.safeParse({ color: '#10B981' })
    expect(result.success).toBe(true)
  })

  it('should fail when color is provided but invalid', () => {
    const result = updateCategorySchema.safeParse({ color: 'not-a-hex' })
    expect(result.success).toBe(false)
  })

  it('should fail when name is provided but empty', () => {
    const result = updateCategorySchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})
