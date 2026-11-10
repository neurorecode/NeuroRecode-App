import { formatInTimeZone, toDate } from 'date-fns-tz';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export const IST = 'Asia/Kolkata';

export function todayIst(): string {
  return formatInTimeZone(new Date(), IST, 'yyyy-MM-dd');
}

export function nowIstIso(): string {
  return formatInTimeZone(new Date(), IST, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function dayNumberFromStart(startDate: string, today = todayIst()): number {
  const start = toDate(startDate + 'T00:00:00', { timeZone: IST });
  const now = toDate(today + 'T00:00:00', { timeZone: IST });
  return differenceInCalendarDays(now, start) + 1;
}

export function isoDateFor(day: Date | string): string {
  const d = typeof day === 'string' ? parseISO(day) : day;
  return formatInTimeZone(d, IST, 'yyyy-MM-dd');
}
