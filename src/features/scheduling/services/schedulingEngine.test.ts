// @vitest-environment node

import { vi, describe, it, expect, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Hoist mock definitions so they're available inside vi.mock() factories
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  setting: {
    findMany: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
  task: {
    findMany: vi.fn(),
  },
  schedule: {
    createMany: vi.fn(),
  },
}))

// Mock server-only so the module doesn't throw in the test environment
vi.mock('server-only', () => ({}))

// Mock the Prisma client singleton
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

// Import after mocks are wired up
import { generateSchedules, doesDateMatchFrequency } from './schedulingEngine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a Date at local midnight for the given YYYY-MM-DD string.
 * Using local midnight ensures startOfDay() in the engine returns the same
 * calendar date regardless of the test host's timezone offset.
 */
function d(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const defaultSettings = [
  { key: 'schedule_days_ahead', value: { days: 30 } },
  { key: 'default_assignment_strategy', value: { strategy: 'round_robin' } },
  { key: 'work_days', value: { days: [1, 2, 3, 4, 5] } },
]

const userA = { id: 'user-a' }
const userB = { id: 'user-b' }

function mockDefaults() {
  mockPrisma.setting.findMany.mockResolvedValue(defaultSettings)
  mockPrisma.user.findMany.mockResolvedValue([userA, userB])
  mockPrisma.task.findMany.mockResolvedValue([])
  mockPrisma.schedule.createMany.mockResolvedValue({ count: 0 })
}

// ---------------------------------------------------------------------------
// doesDateMatchFrequency (pure function — no mocks needed)
// ---------------------------------------------------------------------------

describe('doesDateMatchFrequency', () => {
  const workDays = [1, 2, 3, 4, 5]

  it('should return true for daily frequency on a weekday', () => {
    const monday = new Date('2026-07-13T00:00:00')
    expect(doesDateMatchFrequency(monday, 'daily', [], null, null, workDays)).toBe(true)
  })

  it('should return false for daily frequency on a weekend', () => {
    const saturday = new Date('2026-07-18T00:00:00')
    expect(doesDateMatchFrequency(saturday, 'daily', [], null, null, workDays)).toBe(false)
  })

  it('should return true for weekly frequency on a matching day of week', () => {
    const monday = new Date('2026-07-13T00:00:00') // Monday
    expect(doesDateMatchFrequency(monday, 'weekly', [1], null, null, workDays)).toBe(true)
  })

  it('should return false for weekly frequency on a non-matching day of week', () => {
    const tuesday = new Date('2026-07-14T00:00:00') // Tuesday
    expect(doesDateMatchFrequency(tuesday, 'weekly', [1, 3], null, null, workDays)).toBe(false)
  })

  it('should return true for biweekly frequency on an even ISO week matching day', () => {
    // ISO week 28 (even), Monday
    const monday_w28 = new Date('2026-07-06T00:00:00')
    expect(doesDateMatchFrequency(monday_w28, 'biweekly', [1], null, null, workDays)).toBe(true)
  })

  it('should return false for biweekly frequency on an odd ISO week', () => {
    // ISO week 29 (odd), Monday
    const monday_w29 = new Date('2026-07-13T00:00:00')
    expect(doesDateMatchFrequency(monday_w29, 'biweekly', [1], null, null, workDays)).toBe(false)
  })

  it('should return true for monthly frequency matching dayOfMonth', () => {
    const the15th = new Date('2026-07-15T00:00:00')
    expect(doesDateMatchFrequency(the15th, 'monthly', [], 15, null, workDays)).toBe(true)
  })

  it('should return false for monthly frequency on a non-matching dayOfMonth', () => {
    const the16th = new Date('2026-07-16T00:00:00')
    expect(doesDateMatchFrequency(the16th, 'monthly', [], 15, null, workDays)).toBe(false)
  })

  it('should return true for custom frequency when day of week matches', () => {
    const friday = new Date('2026-07-17T00:00:00') // Friday = 5
    expect(doesDateMatchFrequency(friday, 'custom', [5], null, null, workDays)).toBe(true)
  })

  it('should return false for an unknown frequency type', () => {
    const monday = new Date('2026-07-13T00:00:00')
    // Cast to FrequencyType to simulate an unexpected value
    expect(doesDateMatchFrequency(monday, 'yearly' as never, [1], null, null, workDays)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// generateSchedules
// ---------------------------------------------------------------------------

describe('generateSchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return zero generated when no active users exist', async () => {
    mockPrisma.setting.findMany.mockResolvedValue(defaultSettings)
    mockPrisma.user.findMany.mockResolvedValue([]) // no users

    const result = await generateSchedules(d('2026-07-14'), d('2026-07-18'))

    expect(result.generated).toBe(0)
    expect(result.skipped).toBe(0)
    expect(mockPrisma.schedule.createMany).not.toHaveBeenCalled()
  })

  it('should return zero generated when no active tasks exist', async () => {
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([]) // no tasks

    const result = await generateSchedules(d('2026-07-14'), d('2026-07-18'))

    expect(result.generated).toBe(0)
    expect(mockPrisma.schedule.createMany).not.toHaveBeenCalled()
  })

  it('should return zero generated when tasks have no frequency', async () => {
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([{ id: 'task-1', active: true, frequency: null }])

    const result = await generateSchedules(d('2026-07-14'), d('2026-07-18'))

    expect(result.generated).toBe(0)
    expect(mockPrisma.schedule.createMany).not.toHaveBeenCalled()
  })

  it('should generate entries only on weekdays for a daily task over a 5-day range', async () => {
    // Mon 13 – Fri 17 July 2026 = 5 working days
    // (Jul 13=Mon, 14=Tue, 15=Wed, 16=Thu, 17=Fri)
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-daily',
        active: true,
        frequency: { type: 'daily', daysOfWeek: [], dayOfMonth: null, weekOfMonth: null },
      },
    ])
    mockPrisma.schedule.createMany.mockResolvedValue({ count: 5 })

    const result = await generateSchedules(d('2026-07-13'), d('2026-07-17'))

    expect(mockPrisma.schedule.createMany).toHaveBeenCalledOnce()
    const { data } = mockPrisma.schedule.createMany.mock.calls[0][0] as {
      data: { taskId: string; status: string }[]
    }
    expect(data).toHaveLength(5)
    expect(result.generated).toBe(5)
  })

  it('should skip weekends for a daily task when a 7-day range includes Sat and Sun', async () => {
    // Mon 13 – Sun 19 July 2026 = 5 weekdays + Sat + Sun
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-daily',
        active: true,
        frequency: { type: 'daily', daysOfWeek: [], dayOfMonth: null, weekOfMonth: null },
      },
    ])
    mockPrisma.schedule.createMany.mockResolvedValue({ count: 5 })

    await generateSchedules(d('2026-07-13'), d('2026-07-19'))

    const { data } = mockPrisma.schedule.createMany.mock.calls[0][0] as {
      data: { date: Date }[]
    }
    // Only Mon–Fri should appear
    expect(data).toHaveLength(5)
    for (const entry of data) {
      const day =
        entry.date.getDay !== undefined ? entry.date.getDay() : new Date(entry.date).getDay()
      expect([1, 2, 3, 4, 5]).toContain(day)
    }
  })

  it('should generate entries only on Mon and Wed for a weekly task with daysOfWeek=[1,3]', async () => {
    // Mon 13 – Sun 19 July 2026: Mon=13, Tue=14, Wed=15, Thu=16, Fri=17, Sat=18, Sun=19
    // daysOfWeek=[1,3] → Monday and Wednesday → Jul 13 and Jul 15 = 2 entries
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-weekly',
        active: true,
        frequency: { type: 'weekly', daysOfWeek: [1, 3], dayOfMonth: null, weekOfMonth: null },
      },
    ])
    mockPrisma.schedule.createMany.mockResolvedValue({ count: 2 })

    await generateSchedules(d('2026-07-13'), d('2026-07-19'))

    const { data } = mockPrisma.schedule.createMany.mock.calls[0][0] as {
      data: { date: Date }[]
    }
    expect(data).toHaveLength(2)
  })

  it('should generate entries only on the 15th for a monthly task with dayOfMonth=15', async () => {
    // Range: Jul 1 – Jul 31 2026
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-monthly',
        active: true,
        frequency: { type: 'monthly', daysOfWeek: [], dayOfMonth: 15, weekOfMonth: null },
      },
    ])
    mockPrisma.schedule.createMany.mockResolvedValue({ count: 1 })

    await generateSchedules(d('2026-07-01'), d('2026-07-31'))

    const { data } = mockPrisma.schedule.createMany.mock.calls[0][0] as {
      data: { date: Date }[]
    }
    expect(data).toHaveLength(1)
    expect(new Date(data[0].date).getDate()).toBe(15)
  })

  it('should apply round-robin assignment across users for a single task', async () => {
    // Mon 13 + Tue 14 → 2 entries → user-a then user-b
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-rr',
        active: true,
        frequency: { type: 'daily', daysOfWeek: [], dayOfMonth: null, weekOfMonth: null },
      },
    ])
    mockPrisma.schedule.createMany.mockResolvedValue({ count: 2 })

    await generateSchedules(d('2026-07-13'), d('2026-07-14')) // Mon + Tue

    const { data } = mockPrisma.schedule.createMany.mock.calls[0][0] as {
      data: { assignedTo: string }[]
    }
    expect(data).toHaveLength(2)
    expect(data[0].assignedTo).toBe('user-a')
    expect(data[1].assignedTo).toBe('user-b')
  })

  it('should wrap round-robin back to first user after exhausting all users', async () => {
    // Mon 13, Tue 14, Wed 15 = 3 consecutive weekdays → user-a, user-b, user-a
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-wrap',
        active: true,
        frequency: { type: 'daily', daysOfWeek: [], dayOfMonth: null, weekOfMonth: null },
      },
    ])
    mockPrisma.schedule.createMany.mockResolvedValue({ count: 3 })

    await generateSchedules(d('2026-07-13'), d('2026-07-15')) // Mon, Tue, Wed

    const { data } = mockPrisma.schedule.createMany.mock.calls[0][0] as {
      data: { assignedTo: string }[]
    }
    expect(data).toHaveLength(3)
    expect(data[0].assignedTo).toBe('user-a')
    expect(data[1].assignedTo).toBe('user-b')
    expect(data[2].assignedTo).toBe('user-a')
  })

  it('should report generated and skipped counts correctly when skipDuplicates fires', async () => {
    // Mon 13 – Fri 17 = 5 weekday entries; DB only inserts 2 (3 already existed)
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-idem',
        active: true,
        frequency: { type: 'daily', daysOfWeek: [], dayOfMonth: null, weekOfMonth: null },
      },
    ])
    mockPrisma.schedule.createMany.mockResolvedValue({ count: 2 }) // only 2 inserted

    const result = await generateSchedules(d('2026-07-13'), d('2026-07-17'))

    expect(result.generated).toBe(2)
    expect(result.skipped).toBe(3) // 5 entries - 2 inserted = 3 skipped
  })

  it('should include correct dateRange in the result', async () => {
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([])

    const from = d('2026-07-14')
    const to = d('2026-07-20')
    const result = await generateSchedules(from, to)

    // Compare using local-timezone getters because startOfDay() sets local midnight,
    // which may differ from UTC midnight in non-UTC environments.
    const localDate = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

    expect(localDate(result.dateRange.from)).toBe('2026-07-14')
    expect(localDate(result.dateRange.to)).toBe('2026-07-20')
  })

  it('should report assignmentCounts per user', async () => {
    // Mon 13 + Tue 14 → user-a gets entry 1, user-b gets entry 2
    mockDefaults()
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-ac',
        active: true,
        frequency: { type: 'daily', daysOfWeek: [], dayOfMonth: null, weekOfMonth: null },
      },
    ])
    mockPrisma.schedule.createMany.mockResolvedValue({ count: 2 })

    const result = await generateSchedules(d('2026-07-13'), d('2026-07-14'))

    expect(result.assignmentCounts['user-a']).toBe(1)
    expect(result.assignmentCounts['user-b']).toBe(1)
  })

  it('should use settings daysAhead when no toDate is provided', async () => {
    // Settings say daysAhead=7; no explicit to → should generate for 7 days
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'schedule_days_ahead', value: { days: 7 } },
      { key: 'default_assignment_strategy', value: { strategy: 'round_robin' } },
      { key: 'work_days', value: { days: [1, 2, 3, 4, 5] } },
    ])
    mockPrisma.user.findMany.mockResolvedValue([userA])
    mockPrisma.task.findMany.mockResolvedValue([])
    mockPrisma.schedule.createMany.mockResolvedValue({ count: 0 })

    const from = d('2026-07-14')
    const result = await generateSchedules(from, undefined)

    const diffMs = result.dateRange.to.getTime() - result.dateRange.from.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(7)
  })
})
