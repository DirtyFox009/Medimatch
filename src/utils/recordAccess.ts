/**
 * Record-access grants: how long a doctor may read a patient's profile and
 * medical records after seeing them.
 *
 * Access is authorised by `users/{patientId}/authorizedDoctors/{doctorUserId}`,
 * whose existence the Firestore rules check (rules cannot query, only get/exists
 * a known path). Existence alone used to mean access never lapsed — a single
 * cancelled booking granted a doctor permanent read access. The grant now
 * carries an `expiresAt` that the rules enforce, so access lapses on its own
 * even if no client ever runs a revocation.
 *
 * Pure module — no Firebase import, so the service layer, the UI and the
 * backfill script all share one definition of the window.
 */

/** How long access outlives the patient's most recent real appointment. */
export const RECORD_ACCESS_TTL_DAYS = 90;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Appointment states that justify a doctor reading the patient's records. */
export function justifiesAccess(status: string): boolean {
  return status !== 'cancelled';
}

/**
 * When access earned by an appointment on `date` (YYYY-MM-DD) should lapse.
 * Measured from the appointment, not from the booking, so booking far ahead
 * does not shorten the window — and a future appointment extends it.
 */
export function accessExpiryFor(date: string): Date {
  const at = new Date(`${date}T23:59:59`);
  const base = Number.isNaN(at.getTime()) ? new Date() : at;
  return new Date(base.getTime() + RECORD_ACCESS_TTL_DAYS * MS_PER_DAY);
}

/**
 * The expiry a patient↔doctor pair should carry given every appointment between
 * them. Returns null when nothing justifies access, meaning the grant should be
 * deleted rather than dated.
 */
export function expiryFromAppointments(
  appointments: { date: string; status: string }[],
): Date | null {
  const relevant = appointments.filter((a) => justifiesAccess(a.status));
  if (relevant.length === 0) return null;
  const latest = relevant.map((a) => a.date).sort().pop()!;
  return accessExpiryFor(latest);
}

/** Grants are only meaningful while unexpired; treat a missing date as expired. */
export function isGrantActive(expiresAt: Date | null, now: Date = new Date()): boolean {
  return expiresAt !== null && expiresAt.getTime() > now.getTime();
}
