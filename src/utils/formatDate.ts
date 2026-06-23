import { format, parseISO, isToday, isTomorrow, addDays, isAfter } from 'date-fns';

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
