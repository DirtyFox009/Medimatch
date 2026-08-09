import type { Appointment } from '../types/appointment';

/**
 * In-app notification feed, derived from the appointments each side already
 * subscribes to rather than stored in its own collection.
 *
 * A parallel `notifications` collection would need cross-user write permission
 * — a patient writing into a doctor's document tree — which is a spam vector,
 * and it duplicates data that is already synced, so the two can disagree.
 * Everything worth announcing is already on the appointment docs.
 *
 * Unread is measured against `notificationsSeenAt` on the user profile, so it
 * follows the account rather than the device.
 *
 * Pure module — no Firebase import.
 */

export type NotificationKind = 'new_booking' | 'confirmed' | 'cancelled' | 'completed';

export interface FeedItem {
  /** Stable across renders: one item per appointment per kind. */
  id: string;
  kind: NotificationKind;
  appointmentId: string;
  at: Date;
  unread: boolean;
  /**
   * The doctor's name, for a patient's item. Empty for a doctor's item:
   * appointments carry no patient name, and resolving one per row would be an
   * N+1 profile lookup for a list that only needs the date and time.
   */
  personName: string;
  date: string;
  timeSlot: string;
}

/** Firestore Timestamp | Date | null → Date | null, without importing Firestore. */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const maybe = value as { toDate?: () => Date; seconds?: number };
  if (typeof maybe.toDate === 'function') return maybe.toDate();
  if (typeof maybe.seconds === 'number') return new Date(maybe.seconds * 1000);
  return null;
}

const MAX_ITEMS = 30;

export interface FeedOptions {
  role: 'patient' | 'doctor';
  myUid: string;
  /** When the user last opened the notification list; null means never. */
  seenAt: Date | null;
}

/**
 * Doctors are told about bookings that arrived without them acting — the gap
 * auto-confirm created. Patients are told about changes they did not make
 * themselves; a patient who cancels their own appointment is not notified of it,
 * which is what `statusChangedBy` distinguishes.
 */
export function buildFeed(appointments: Appointment[], opts: FeedOptions): FeedItem[] {
  const { role, myUid, seenAt } = opts;
  const items: FeedItem[] = [];

  for (const a of appointments) {
    if (role === 'doctor') {
      const at = toDate(a.createdAt);
      if (!at) continue;
      items.push({
        id: `${a.id}:new_booking`,
        kind: 'new_booking',
        appointmentId: a.id,
        at,
        unread: !seenAt || at.getTime() > seenAt.getTime(),
        personName: '',
        date: a.date,
        timeSlot: a.timeSlot,
      });
      continue;
    }

    // Patient: only changes someone else made.
    const changedBy = (a as Appointment & { statusChangedBy?: string }).statusChangedBy;
    if (!changedBy || changedBy === myUid) continue;
    if (a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'confirmed') continue;

    const at = toDate(a.updatedAt);
    if (!at) continue;
    items.push({
      id: `${a.id}:${a.status}`,
      kind: a.status as NotificationKind,
      appointmentId: a.id,
      at,
      unread: !seenAt || at.getTime() > seenAt.getTime(),
      personName: a.doctorNameEn,
      date: a.date,
      timeSlot: a.timeSlot,
    });
  }

  items.sort((x, y) => y.at.getTime() - x.at.getTime());
  return items.slice(0, MAX_ITEMS);
}

export function unreadCount(items: FeedItem[]): number {
  return items.filter((i) => i.unread).length;
}
