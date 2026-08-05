import { format, parseISO, isToday, isTomorrow, addDays, isAfter, isValid, differenceInYears } from 'date-fns';

export function formatAppointmentDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, d MMM yyyy');
}

export function getAvailableDates(availableDays: string[], count = 14): string[] {
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const days = availableDays.map((d) => dayMap[d]).filter((d) => d !== undefined);
  const results: string[] = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (results.length < count) {
    if (days.includes(cursor.getDay())) {
      results.push(format(cursor, 'yyyy-MM-dd'));
    }
    cursor = addDays(cursor, 1);
  }
  return results;
}

export function isFutureDate(dateStr: string): boolean {
  return isAfter(parseISO(dateStr), new Date());
}

/** Oldest plausible patient — anything beyond this is a typo, not a birthday. */
const MAX_AGE_YEARS = 120;

/**
 * Current age in whole years from an ISO YYYY-MM-DD date of birth.
 * The single place age is derived: profiles store the birth date, never the
 * age, so a stored number can never drift out of date.
 * Returns null for a missing, unparseable, future, or implausible date.
 */
export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const date = parseISO(dob);
  if (!isValid(date)) return null;
  const years = differenceInYears(new Date(), date);
  if (years < 0 || years > MAX_AGE_YEARS) return null;
  return years;
}

/** Human-readable birth date, e.g. "12 Mar 1994". Falls back to the raw string. */
export function formatDob(dob: string): string {
  const date = parseISO(dob);
  return isValid(date) ? format(date, 'd MMM yyyy') : dob;
}
