/**
 * All "day" boundaries in this service are UTC calendar days.
 *
 * DECISION (needs human sign-off — flagged in project report): the product
 * spec doesn't say whether streaks/daily goals should reset at the user's
 * local midnight or a fixed server boundary. UTC midnight is used here
 * because it's simple, unambiguous, and matches `DailyActivity.date`
 * (`@db.Date`, stored as UTC). If per-user timezone-aware streaks are
 * required later, `DailyActivity` would need a `timezone`-aware bucketing
 * strategy computed at write-time (when a study session is logged), not at
 * read-time — this file is the place to change that.
 */

/** Truncates a Date to a UTC calendar day (midnight UTC). */
export function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function startOfTodayUtc(): Date {
  return toUtcDateOnly(new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Returns the Monday (UTC) of the week containing `date`. Week starts Monday. */
export function startOfWeekMondayUtc(date: Date): Date {
  const d = toUtcDateOnly(date);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(d, diffToMonday);
}

export function isSameUtcDay(a: Date, b: Date): boolean {
  return toUtcDateOnly(a).getTime() === toUtcDateOnly(b).getTime();
}
