// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { createTaskSchema, updateTaskSchema, createFrequencySchema } from './index'

describe('createTaskSchema', () => {
  const validTask = {
    roomId: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Lavar banheiro',
    estimatedMinutes: 30,
    priority: 'medium' as const,
  }

  it('should pass with valid task data', () => {
    const result = createTaskSchema.safeParse(validTask)
    expect(result.success).toBe(true)
  })

  it('should pass with all optional fields provided', () => {
    const result = createTaskSchema.safeParse({
      ...validTask,
      categoryId: '223e4567-e89b-12d3-a456-426614174001',
      description: 'Limpar box e nicho',
      active: true,
      goldenRuleApplies: false,
    })
    expect(result.success).toBe(true)
  })

  it('should pass when categoryId is empty string (treated as undefined)', () => {
    const result = createTaskSchema.safeParse({ ...validTask, categoryId: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.categoryId).toBeUndefined()
    }
  })

  it('should default active to true when omitted', () => {
    const result = createTaskSchema.safeParse(validTask)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(true)
    }
  })

  it('should default goldenRuleApplies to true when omitted', () => {
    const result = createTaskSchema.safeParse(validTask)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.goldenRuleApplies).toBe(true)
    }
  })

  it('should fail when title is empty', () => {
    const result = createTaskSchema.safeParse({ ...validTask, title: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'title')
      expect(issue).toBeDefined()
    }
  })

  it('should fail when title exceeds 255 characters', () => {
    const result = createTaskSchema.safeParse({ ...validTask, title: 'a'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('should fail when estimatedMinutes is less than 5', () => {
    const result = createTaskSchema.safeParse({ ...validTask, estimatedMinutes: 4 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'estimatedMinutes')
      expect(issue).toBeDefined()
    }
  })

  it('should fail when estimatedMinutes is greater than 480', () => {
    const result = createTaskSchema.safeParse({ ...validTask, estimatedMinutes: 481 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'estimatedMinutes')
      expect(issue).toBeDefined()
    }
  })

  it('should fail when estimatedMinutes is not an integer', () => {
    const result = createTaskSchema.safeParse({ ...validTask, estimatedMinutes: 30.5 })
    expect(result.success).toBe(false)
  })

  it('should fail when priority is invalid', () => {
    const result = createTaskSchema.safeParse({ ...validTask, priority: 'urgent' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'priority')
      expect(issue).toBeDefined()
    }
  })

  it('should fail when roomId is not a UUID', () => {
    const result = createTaskSchema.safeParse({ ...validTask, roomId: 'not-a-uuid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'roomId')
      expect(issue).toBeDefined()
    }
  })

  it('should fail when categoryId is provided but not a UUID', () => {
    const result = createTaskSchema.safeParse({ ...validTask, categoryId: 'invalid-id' })
    expect(result.success).toBe(false)
  })

  it('should fail when description exceeds 2000 characters', () => {
    const result = createTaskSchema.safeParse({ ...validTask, description: 'a'.repeat(2001) })
    expect(result.success).toBe(false)
  })
})

describe('updateTaskSchema', () => {
  it('should pass for an empty object (all fields optional)', () => {
    const result = updateTaskSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should pass when updating only the title', () => {
    const result = updateTaskSchema.safeParse({ title: 'Nova tarefa' })
    expect(result.success).toBe(true)
  })

  it('should pass when setting active to false', () => {
    const result = updateTaskSchema.safeParse({ active: false })
    expect(result.success).toBe(true)
  })

  it('should fail when title is provided but empty', () => {
    const result = updateTaskSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })

  it('should fail when priority is provided but invalid', () => {
    const result = updateTaskSchema.safeParse({ priority: 'critical' })
    expect(result.success).toBe(false)
  })
})

describe('createFrequencySchema', () => {
  const validFrequency = {
    taskId: '123e4567-e89b-12d3-a456-426614174000',
    type: 'weekly' as const,
    daysOfWeek: [1, 3, 5],
  }

  it('should pass createFrequencySchema with weekly type', () => {
    const result = createFrequencySchema.safeParse(validFrequency)
    expect(result.success).toBe(true)
  })

  it('should pass with daily type and no daysOfWeek', () => {
    const result = createFrequencySchema.safeParse({
      taskId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'daily',
    })
    expect(result.success).toBe(true)
  })

  it('should pass with monthly type and weekOfMonth', () => {
    const result = createFrequencySchema.safeParse({
      ...validFrequency,
      type: 'monthly',
      daysOfWeek: [],
      weekOfMonth: 2,
    })
    expect(result.success).toBe(true)
  })

  it('should pass with monthly type and dayOfMonth', () => {
    const result = createFrequencySchema.safeParse({
      ...validFrequency,
      type: 'monthly',
      daysOfWeek: [],
      dayOfMonth: 15,
    })
    expect(result.success).toBe(true)
  })

  it('should fail createFrequencySchema when daysOfWeek contains invalid day', () => {
    const result = createFrequencySchema.safeParse({ ...validFrequency, daysOfWeek: [0, 7] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'daysOfWeek')
      expect(issue).toBeDefined()
    }
  })

  it('should fail createFrequencySchema when daysOfWeek contains negative day', () => {
    const result = createFrequencySchema.safeParse({ ...validFrequency, daysOfWeek: [-1, 3] })
    expect(result.success).toBe(false)
  })

  it('should fail createFrequencySchema when dayOfMonth exceeds 31', () => {
    const result = createFrequencySchema.safeParse({
      ...validFrequency,
      type: 'monthly',
      dayOfMonth: 32,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'dayOfMonth')
      expect(issue).toBeDefined()
    }
  })

  it('should fail when dayOfMonth is 0 (invalid)', () => {
    const result = createFrequencySchema.safeParse({
      ...validFrequency,
      type: 'monthly',
      dayOfMonth: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should fail when weekOfMonth exceeds 5', () => {
    const result = createFrequencySchema.safeParse({
      ...validFrequency,
      type: 'monthly',
      weekOfMonth: 6,
    })
    expect(result.success).toBe(false)
  })

  it('should fail when taskId is not a UUID', () => {
    const result = createFrequencySchema.safeParse({ ...validFrequency, taskId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('should fail when type is invalid', () => {
    const result = createFrequencySchema.safeParse({ ...validFrequency, type: 'yearly' })
    expect(result.success).toBe(false)
  })
})
