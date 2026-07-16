import { addDays, getDay, getDate, getWeekOfMonth, getISOWeek } from 'date-fns'

/**
 * Returns true if the given date falls on one of the specified days of the week.
 * Day values: 0 = Sunday, 6 = Saturday (matches JavaScript's getDay convention).
 */
export function matchesDayOfWeek(date: Date, days: number[]): boolean {
  return days.includes(getDay(date))
}

/**
 * Returns true for biweekly matching: the date must fall on one of the given
 * days of the week AND the ISO week number must be even.
 *
 * Using ISO week parity as the "every other week" anchor ensures consistent
 * results regardless of when the engine is first run.
 */
export function matchesBiweekly(date: Date, days: number[]): boolean {
  if (!matchesDayOfWeek(date, days)) return false
  return getISOWeek(date) % 2 === 0
}

/**
 * Returns true if the date matches a monthly recurrence rule.
 *
 * Two modes:
 *  - dayOfMonth: fires on a specific calendar day (e.g., the 15th of every month).
 *  - weekOfMonth + daysOfWeek: fires on a specific weekday occurrence within the
 *    month (e.g., the second Monday, expressed as weekOfMonth=2, daysOfWeek=[1]).
 *
 * dayOfMonth takes precedence when both are provided.
 */
export function matchesMonthly(
  date: Date,
  dayOfMonth: number | null,
  weekOfMonth: number | null,
  daysOfWeek: number[]
): boolean {
  if (dayOfMonth !== null) {
    return getDate(date) === dayOfMonth
  }
  if (weekOfMonth !== null && daysOfWeek.length > 0) {
    return getWeekOfMonth(date) === weekOfMonth && matchesDayOfWeek(date, daysOfWeek)
  }
  return false
}

/**
 * Returns all Date instances in the closed interval [from, to], one per day.
 * Each returned Date has the same time component as the input `from` value.
 */
export function getDatesInRange(from: Date, to: Date): Date[] {
  const dates: Date[] = []
  let current = new Date(from)
  while (current <= to) {
    dates.push(new Date(current))
    current = addDays(current, 1)
  }
  return dates
}

/**
 * Returns true if the given date is a configured work day.
 * @param date - The date to check.
 * @param workDays - Array of day-of-week values that are work days (0=Sun, 6=Sat).
 */
export function isWorkDay(date: Date, workDays: number[]): boolean {
  return workDays.includes(getDay(date))
}
