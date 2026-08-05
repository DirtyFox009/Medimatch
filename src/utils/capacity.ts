import type { Doctor } from '../types/doctor';
import { todayISO } from './formatDate';

/**
 * Chamber capacity: the doctor's "I'll see N patients a day" setting, and the
 * slot grid it generates.
 *
 * Capacity is deliberately expressed *through* `Doctor.timeSlots` rather than
 * beside it: the doctor's three inputs (start, minutes per patient, patients per
 * day) generate exactly N slots, so the existing `doctors/{id}/slots/{date}_{time}`
 * ledger that already prevents double-booking also prevents over-booking. There
 * is no counter to keep in sync on book and cancel.
 *
 * Pure module — no Firebase import, so the booking transaction, the UI and any
 * future script all share one implementation.
 */

export const DEFAULT_CHAMBER_START = '09:00';
export const DEFAULT_SLOT_DURATION_MINS = 30;
/** A slot must start at least this far in the future to still be bookable. */
export const BOOKING_LEAD_MINUTES = 30;
export const MIN_SLOT_DURATION_MINS = 5;
export const MAX_SLOT_DURATION_MINS = 120;
export const MAX_DAILY_PATIENTS = 60;
/** How far back `dailyLimitOverrides` keys are kept before being pruned. */
const OVERRIDE_RETENTION_DAYS = 1;

const MINUTES_IN_DAY = 24 * 60;

export interface DoctorCapacity {
  autoConfirm: boolean;
  chamberStart: string;
  slotDurationMins: number;
  dailyPatientLimit: number;
  dailyLimitOverrides: Record<string, number>;
  /**
   * True when the doctor set their chamber through the portal, so `timeSlots`
   * was generated from these params and can be extended consistently. False for
   * seeded doctors whose `timeSlots` is hand-written and may be non-contiguous
   * (e.g. a lunch break) — extending those would invent hours they never offered.
   */
  configured: boolean;
}

/** 'HH:MM' → minutes since midnight, or null if unparseable. */
export function parseHHMM(value: string | undefined | null): number | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Minutes since midnight → 'HH:MM'. */
export function formatHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * `count` slots of `durationMins`, starting at `start`.
 * ('16:00', 15, 20) → ['16:00', '16:15', … '20:45'].
 * Stops at midnight rather than wrapping into the next day, so an over-long
 * session yields fewer slots than requested — the profile preview shows the
 * real count so the doctor sees the truncation.
 */
export function generateSlots(start: string, durationMins: number, count: number): string[] {
  const startMins = parseHHMM(start);
  const step = Math.round(durationMins);
  if (startMins === null || !Number.isFinite(step) || step <= 0) return [];

  const wanted = Math.min(Math.max(Math.floor(count), 0), MAX_DAILY_PATIENTS);
  const slots: string[] = [];
  for (let i = 0; i < wanted; i += 1) {
    const at = startMins + i * step;
    if (at >= MINUTES_IN_DAY) break;
    slots.push(formatHHMM(at));
  }
  return slots;
}

/** Infers the gap between slots from a legacy hand-written `timeSlots` array. */
function inferDuration(timeSlots: string[] | undefined): number {
  if (!timeSlots || timeSlots.length < 2) return DEFAULT_SLOT_DURATION_MINS;
  const first = parseHHMM(timeSlots[0]);
  const second = parseHHMM(timeSlots[1]);
  if (first === null || second === null) return DEFAULT_SLOT_DURATION_MINS;
  const gap = second - first;
  return gap >= MIN_SLOT_DURATION_MINS && gap <= MAX_SLOT_DURATION_MINS
    ? gap
    : DEFAULT_SLOT_DURATION_MINS;
}

/**
 * Reads capacity off a doctor doc, defaulting the fields the ~18 seeded doctors
 * predate. `dailyPatientLimit` defaults to `timeSlots.length`, which makes
 * `slice(0, limit)` the identity — so every existing doctor's booking grid is
 * unchanged until they save the capacity form for the first time.
 */
export function readCapacity(doctor: Partial<Doctor> | undefined | null): DoctorCapacity {
  const timeSlots = doctor?.timeSlots ?? [];
  return {
    autoConfirm: doctor?.autoConfirm ?? true,
    chamberStart: doctor?.chamberStart ?? timeSlots[0] ?? DEFAULT_CHAMBER_START,
    slotDurationMins: doctor?.slotDurationMins ?? inferDuration(timeSlots),
    dailyPatientLimit: doctor?.dailyPatientLimit ?? timeSlots.length,
    dailyLimitOverrides: doctor?.dailyLimitOverrides ?? {},
    configured: Boolean(doctor?.chamberStart && doctor?.slotDurationMins),
  };
}

/** The patient cap in force on a given date: today's override, else the default. */
export function effectiveLimit(cap: DoctorCapacity, date: string): number {
  const override = cap.dailyLimitOverrides[date];
  const limit = typeof override === 'number' ? override : cap.dailyPatientLimit;
  return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0;
}

/**
 * The slot list a limit exposes. Below the stored list this is a plain slice;
 * above it, a doctor who has configured their chamber can extend past the stored
 * array (raising today's limit above the default must actually open slots).
 * Because `timeSlots` was itself generated from those params, the two branches
 * agree for every limit <= timeSlots.length.
 */
export function slotsForLimit(
  cap: DoctorCapacity,
  timeSlots: string[],
  limit: number,
): string[] {
  if (limit <= timeSlots.length) return timeSlots.slice(0, limit);
  if (cap.configured) return generateSlots(cap.chamberStart, cap.slotDurationMins, limit);
  // A seeded doctor's hand-written grid is not ours to extend — raising the
  // limit past it does nothing until they configure their chamber.
  return timeSlots;
}

/** Capacity-limited slots for a date, before booked/past filtering. */
export function slotsForDate(doctor: Partial<Doctor> | undefined | null, date: string): string[] {
  const cap = readCapacity(doctor);
  return slotsForLimit(cap, doctor?.timeSlots ?? [], effectiveLimit(cap, date));
}

/**
 * What the patient may actually tap: capacity-limited, minus already-booked,
 * minus anything starting within BOOKING_LEAD_MINUTES when the date is today.
 * `now` is injected so this is testable.
 */
export function bookableSlots(
  doctor: Partial<Doctor> | undefined | null,
  date: string,
  booked: string[],
  now: Date = new Date(),
): string[] {
  const open = slotsForDate(doctor, date).filter((slot) => !booked.includes(slot));
  if (date !== todayISO()) return open;

  // Nobody reviews bookings any more, so a patient could otherwise auto-confirm
  // a slot that already passed earlier today.
  const cutoff = now.getHours() * 60 + now.getMinutes() + BOOKING_LEAD_MINUTES;
  return open.filter((slot) => {
    const at = parseHHMM(slot);
    return at === null || at >= cutoff;
  });
}

/** True when a date offers no bookable slot left. */
export function isDayFull(
  doctor: Partial<Doctor> | undefined | null,
  date: string,
  booked: string[],
  now: Date = new Date(),
): boolean {
  return bookableSlots(doctor, date, booked, now).length === 0;
}

/**
 * Drops override keys for days that are over. The doctor is the only writer and
 * writes the whole map, so last-write-wins pruning is safe here.
 */
export function pruneOverrides(
  overrides: Record<string, number>,
  today: string = todayISO(),
): Record<string, number> {
  const cutoffDate = new Date(`${today}T00:00:00`);
  cutoffDate.setDate(cutoffDate.getDate() - OVERRIDE_RETENTION_DAYS);
  const cutoff = Number.isNaN(cutoffDate.getTime()) ? today : cutoffDate.toISOString().slice(0, 10);

  const kept: Record<string, number> = {};
  for (const [date, limit] of Object.entries(overrides)) {
    if (date >= cutoff) kept[date] = limit;
  }
  return kept;
}
