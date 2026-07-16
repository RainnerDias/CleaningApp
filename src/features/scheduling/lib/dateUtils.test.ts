// @vitest-environment node

import { describe, it, expect } from 'vitest'
import {
  matchesDayOfWeek,
  matchesBiweekly,
  matchesMonthly,
  getDatesInRange,
  isWorkDay,
} from './dateUtils'

// ---------------------------------------------------------------------------
// matchesDayOfWeek
// ---------------------------------------------------------------------------

describe('matchesDayOfWeek', () => {
  // 2026-07-13 is a Monday (getDay = 1)
  const monday = new Date('2026-07-13T12:00:00')
  // 2026-07-14 is a Tuesday (getDay = 2)
  const tuesday = new Date('2026-07-14T12:00:00')
  // 2026-07-19 is a Sunday (getDay = 0)
  const sunday = new Date('2026-07-19T12:00:00')

  it('should return true when date falls on one of the given days', () => {
    expect(matchesDayOfWeek(monday, [1, 3, 5])).toBe(true)
  })

  it('should return false when date does not fall on any given day', () => {
    expect(matchesDayOfWeek(tuesday, [1, 3, 5])).toBe(false)
  })

  it('should return true for Sunday (day 0) when 0 is in the list', () => {
    expect(matchesDayOfWeek(sunday, [0])).toBe(true)
  })

  it('should return false when days array is empty', () => {
    expect(matchesDayOfWeek(monday, [])).toBe(false)
  })

  it('should return true when all days are included', () => {
    expect(matchesDayOfWeek(monday, [0, 1, 2, 3, 4, 5, 6])).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// matchesBiweekly
// ---------------------------------------------------------------------------

describe('matchesBiweekly', () => {
  // We need four consecutive Mondays to test alternating behaviour.
  // Week 28/2026: Mon 2026-07-06 — ISO week 28 (even) → should match
  // Week 29/2026: Mon 2026-07-13 — ISO week 29 (odd)  → should NOT match
  // Week 30/2026: Mon 2026-07-20 — ISO week 30 (even) → should match
  // Week 31/2026: Mon 2026-07-27 — ISO week 31 (odd)  → should NOT match
  const mon_w28 = new Date('2026-07-06T12:00:00') // even week
  const mon_w29 = new Date('2026-07-13T12:00:00') // odd week
  const mon_w30 = new Date('2026-07-20T12:00:00') // even week
  const mon_w31 = new Date('2026-07-27T12:00:00') // odd week
  const mondays = [1]

  it('should return true on even ISO week mondays', () => {
    expect(matchesBiweekly(mon_w28, mondays)).toBe(true)
  })

  it('should return false on odd ISO week mondays', () => {
    expect(matchesBiweekly(mon_w29, mondays)).toBe(false)
  })

  it('should return true on the next even ISO week', () => {
    expect(matchesBiweekly(mon_w30, mondays)).toBe(true)
  })

  it('should return false on the next odd ISO week', () => {
    expect(matchesBiweekly(mon_w31, mondays)).toBe(false)
  })

  it('should return false when the day does not match even if week is even', () => {
    const tue_w28 = new Date('2026-07-07T12:00:00') // Tuesday, even week
    expect(matchesBiweekly(tue_w28, mondays)).toBe(false)
  })

  it('should return false when days array is empty', () => {
    expect(matchesBiweekly(mon_w28, [])).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// matchesMonthly — dayOfMonth mode
// ---------------------------------------------------------------------------

describe('matchesMonthly — dayOfMonth mode', () => {
  // 2026-07-15 is the 15th of July
  const the15th = new Date('2026-07-15T00:00:00')
  // 2026-07-16 is the 16th
  const the16th = new Date('2026-07-16T00:00:00')

  it('should return true when date is on the configured day of month', () => {
    expect(matchesMonthly(the15th, 15, null, [])).toBe(true)
  })

  it('should return false when date is not on the configured day of month', () => {
    expect(matchesMonthly(the16th, 15, null, [])).toBe(false)
  })

  it('should return false for day 1 when date is the 15th', () => {
    expect(matchesMonthly(the15th, 1, null, [])).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// matchesMonthly — weekOfMonth mode
// ---------------------------------------------------------------------------

describe('matchesMonthly — weekOfMonth mode', () => {
  // July 2026:
  //   Week 1: Jul 1 (Wed) — first partial week
  //   Week 2: Jul 6–12
  //   Week 3: Jul 13–19 — third Monday is Jul 13
  //   Week 4: Jul 20–26
  // getWeekOfMonth starts weeks on Sunday (locale default).
  // Jul 13 (Mon): week-of-month = 3
  // Jul 6  (Mon): week-of-month = 2

  const thirdMonday = new Date('2026-07-13T12:00:00') // week 3 in July
  const secondMonday = new Date('2026-07-06T12:00:00') // week 2 in July
  const monday = [1]

  it('should return true for the correct weekOfMonth and day combination', () => {
    expect(matchesMonthly(thirdMonday, null, 3, monday)).toBe(true)
  })

  it('should return false when weekOfMonth matches but day does not', () => {
    // thirdMonday is weekOfMonth=3 but if we ask for Tuesday it should fail
    expect(matchesMonthly(thirdMonday, null, 3, [2])).toBe(false)
  })

  it('should return false when day matches but weekOfMonth does not', () => {
    expect(matchesMonthly(secondMonday, null, 3, monday)).toBe(false)
  })

  it('should return false when both weekOfMonth and daysOfWeek are absent', () => {
    expect(matchesMonthly(thirdMonday, null, null, [])).toBe(false)
  })

  it('should prefer dayOfMonth over weekOfMonth when both are provided', () => {
    // dayOfMonth=13 matches Jul 13, so result should be true regardless of weekOfMonth
    expect(matchesMonthly(thirdMonday, 13, 99, monday)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getDatesInRange
// ---------------------------------------------------------------------------

describe('getDatesInRange', () => {
  it('should return exactly one date when from equals to', () => {
    const d = new Date('2026-07-01T00:00:00')
    const result = getDatesInRange(d, d)
    expect(result).toHaveLength(1)
  })

  it('should return the correct number of days for a 7-day range', () => {
    const from = new Date('2026-07-01T00:00:00')
    const to = new Date('2026-07-07T00:00:00')
    expect(getDatesInRange(from, to)).toHaveLength(7)
  })

  it('should return an empty array when from is after to', () => {
    const from = new Date('2026-07-10T00:00:00')
    const to = new Date('2026-07-09T00:00:00')
    expect(getDatesInRange(from, to)).toHaveLength(0)
  })

  it('should return dates in ascending order', () => {
    const from = new Date('2026-07-01T00:00:00')
    const to = new Date('2026-07-05T00:00:00')
    const result = getDatesInRange(from, to)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].getTime()).toBeGreaterThan(result[i - 1].getTime())
    }
  })

  it('should return 31 dates for a full July', () => {
    const from = new Date('2026-07-01T00:00:00')
    const to = new Date('2026-07-31T00:00:00')
    expect(getDatesInRange(from, to)).toHaveLength(31)
  })
})

// ---------------------------------------------------------------------------
// isWorkDay
// ---------------------------------------------------------------------------

describe('isWorkDay', () => {
  const defaultWorkDays = [1, 2, 3, 4, 5] // Mon–Fri

  it('should return true for a Monday', () => {
    const monday = new Date('2026-07-13T12:00:00')
    expect(isWorkDay(monday, defaultWorkDays)).toBe(true)
  })

  it('should return true for a Friday', () => {
    const friday = new Date('2026-07-17T12:00:00')
    expect(isWorkDay(friday, defaultWorkDays)).toBe(true)
  })

  it('should return false for a Saturday', () => {
    const saturday = new Date('2026-07-18T12:00:00')
    expect(isWorkDay(saturday, defaultWorkDays)).toBe(false)
  })

  it('should return false for a Sunday', () => {
    const sunday = new Date('2026-07-19T12:00:00')
    expect(isWorkDay(sunday, defaultWorkDays)).toBe(false)
  })

  it('should return true for Saturday when workDays includes Saturday', () => {
    const saturday = new Date('2026-07-18T12:00:00')
    expect(isWorkDay(saturday, [1, 2, 3, 4, 5, 6])).toBe(true)
  })

  it('should return false for any day when workDays is empty', () => {
    const monday = new Date('2026-07-13T12:00:00')
    expect(isWorkDay(monday, [])).toBe(false)
  })
})
