import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db, auth } from './config';
import type { Doctor, DoctorFilter, Review } from '../../types/doctor';
import type { Appointment, AppointmentStatus } from '../../types/appointment';
import type { MedicalRecord } from '../../types/record';
import type { MedicineReminder } from '../../types/medicine';
import type { Prescription } from '../../types/prescription';
import {
  readCapacity,
  effectiveLimit,
  slotsForLimit,
  pruneOverrides,
} from '../../utils/capacity';
import { accessExpiryFor, expiryFromAppointments } from '../../utils/recordAccess';
import type { RecordGrant } from '../../types/user';

/** Firestore Timestamp | Date | null → Date | null. */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

// ── Doctors ──────────────────────────────────────────────────────────────────

export async function getDoctors(filter: DoctorFilter = {}): Promise<Doctor[]> {
  // One server-side filter (composite indexes exist for each); the rest are
  // narrowed client-side on the already-small result set.
  const constraints: QueryConstraint[] = [where('isAvailable', '==', true)];
  if (filter.specialty) {
    constraints.push(where('specialty', '==', filter.specialty));
  } else if (filter.division) {
    constraints.push(where('division', '==', filter.division));
  } else if (filter.telemedicineOnly) {
    constraints.push(where('telemedicineAvailable', '==', true));
  }
  // Sorting by ratingAvg is done client-side (below) rather than via orderBy so
  // the query stays equality-only and needs no composite index — deploying those
  // requires the Firebase CLI, and the dataset is small enough to sort in JS.
  constraints.push(limit(50));

  const snap = await getDocs(query(collection(db, 'doctors'), ...constraints));
  let doctors = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor));

  if (filter.specialty && filter.division) {
    doctors = doctors.filter((d) => d.division === filter.division);
  }
  if (filter.telemedicineOnly && (filter.specialty || filter.division)) {
    doctors = doctors.filter((d) => d.telemedicineAvailable);
  }
  if (filter.maxFee) doctors = doctors.filter((d) => d.consultationFee <= filter.maxFee!);
  if (filter.availableToday) {
    // availableDays holds short day names ('Sat', 'Sun', …) — see seedDoctors.ts.
    const today = format(new Date(), 'EEE');
    doctors = doctors.filter((d) => d.availableDays?.includes(today));
  }

  doctors.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
  return doctors;
}

export async function getDoctor(id: string): Promise<Doctor | null> {
  const snap = await getDoc(doc(db, 'doctors', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Doctor;
}

/**
 * Live doctor doc. The booking screen and the doctor portal both need capacity
 * changes to land without a reload — a one-shot read would leave a patient
 * booking against a limit the doctor has already lowered.
 */
export function subscribeDoctor(
  id: string,
  onData: (doctor: Doctor | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'doctors', id),
    (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Doctor) : null),
    (err) => onError?.(err),
  );
}

/**
 * Sets or clears the patient cap for a single date.
 * The doctor is the only writer, so the whole map is replaced (pruned of days
 * that are over) rather than patched field-by-field.
 */
export async function setDayLimit(
  doctorId: string,
  overrides: Record<string, number>,
  date: string,
  limit: number | null,
): Promise<void> {
  const next = pruneOverrides(overrides);
  if (limit === null) {
    delete next[date];
  } else {
    next[date] = limit;
  }
  await updateDoc(doc(db, 'doctors', doctorId), {
    dailyLimitOverrides: next,
    updatedAt: serverTimestamp(),
  });
}

export async function updateDoctorAvailability(
  doctorId: string,
  isAvailable: boolean,
): Promise<void> {
  await updateDoc(doc(db, 'doctors', doctorId), {
    isAvailable,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fields a doctor may edit on their own profile. Identity and trust fields
 * (name, specialty, BMDC number, verified badge, ratings) stay operator-only —
 * mirrored by the doctors update rule in firestore.rules.
 */
export type EditableDoctorProfile = Partial<
  Pick<
    Doctor,
    | 'qualifications'
    | 'hospitalNameEn'
    | 'hospitalNameBn'
    | 'consultationFee'
    | 'telemedicineFee'
    | 'telemedicineAvailable'
    | 'availableDays'
    | 'timeSlots'
    | 'bio'
    | 'autoConfirm'
    | 'chamberStart'
    | 'slotDurationMins'
    | 'dailyPatientLimit'
    | 'dailyLimitOverrides'
  >
>;

export async function updateDoctorProfile(
  doctorId: string,
  data: EditableDoctorProfile,
): Promise<void> {
  await updateDoc(doc(db, 'doctors', doctorId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function getDoctorReviews(doctorId: string): Promise<Review[]> {
  const snap = await getDocs(
    query(
      collection(db, 'doctors', doctorId, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(20),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}

/** Review doc id == appointment id, so each appointment gets one review. */
export async function hasReviewed(doctorId: string, appointmentId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'doctors', doctorId, 'reviews', appointmentId));
  return snap.exists();
}

export async function submitReview(
  appointment: Appointment,
  rating: number,
  comment: string,
  patientName: string,
): Promise<void> {
  const doctorRef = doc(db, 'doctors', appointment.doctorId);
  const reviewRef = doc(db, 'doctors', appointment.doctorId, 'reviews', appointment.id);

  await runTransaction(db, async (tx) => {
    const doctorSnap = await tx.get(doctorRef);
    if (!doctorSnap.exists()) throw new Error('DOCTOR_NOT_FOUND');
    const { ratingAvg = 0, reviewCount = 0 } = doctorSnap.data() as Doctor;
    const newCount = reviewCount + 1;
    const newAvg = Math.round(((ratingAvg * reviewCount + rating) / newCount) * 100) / 100;

    tx.set(reviewRef, {
      userId: appointment.patientId,
      patientName,
      rating,
      comment,
      createdAt: serverTimestamp(),
    });
    tx.update(doctorRef, {
      ratingAvg: newAvg,
      reviewCount: newCount,
      updatedAt: serverTimestamp(),
    });
  });
}

// ── Appointments ─────────────────────────────────────────────────────────────

function slotDocId(date: string, timeSlot: string): string {
  return `${date}_${timeSlot}`;
}

/**
 * Books a slot and decides the appointment's status.
 *
 * `status` is derived here from the transactionally-read doctor doc rather than
 * accepted from the caller: the client's copy of the doctor can be arbitrarily
 * stale, and only the transaction's read is authoritative about whether that
 * doctor has auto-confirm switched on.
 */
export async function bookAppointment(
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
): Promise<{ appointmentId: string; status: AppointmentStatus }> {
  const doctorRef = doc(db, 'doctors', data.doctorId);
  const slotRef = doc(db, 'doctors', data.doctorId, 'slots', slotDocId(data.date, data.timeSlot));
  const appointmentRef = doc(collection(db, 'appointments'));
  let status: AppointmentStatus = 'pending';

  // tx.get on the slot doc is a true transactional read (queries inside
  // runTransaction are not), so two concurrent bookings of the same slot
  // cannot both commit. Firestore requires every read before every write.
  //
  // Reading the doctor doc puts it in the transaction's read set, so a concurrent
  // write to it (rating aggregation, availability toggle, a capacity save) aborts
  // and retries this booking. That is the behaviour we want — the retry re-reads
  // the fresh limit — and the SDK retries automatically.
  const grantRef = data.doctorUserId
    ? doc(db, 'users', data.patientId, 'authorizedDoctors', data.doctorUserId)
    : null;

  await runTransaction(db, async (tx) => {
    const doctorSnap = await tx.get(doctorRef);
    const existing = await tx.get(slotRef);
    const grantSnap = grantRef ? await tx.get(grantRef) : null;

    if (!doctorSnap.exists()) throw new Error('DOCTOR_NOT_FOUND');
    const raw = doctorSnap.data() as Doctor;
    if (raw.isAvailable === false) throw new Error('DOCTOR_UNAVAILABLE');

    // Capacity is enforced as an INDEX check, not a count: a transaction cannot
    // run queries, so it cannot count the day's bookings. Because slots are
    // generated in a fixed order, "is this slot within the first N?" gives
    // exactly the semantics we want — lowering the limit blocks new bookings at
    // indexes past it while leaving already-booked ones untouched.
    const cap = readCapacity(raw);
    const limit = effectiveLimit(cap, data.date);
    if (!slotsForLimit(cap, raw.timeSlots ?? [], limit).includes(data.timeSlot)) {
      throw new Error('DAY_FULL');
    }
    if (existing.exists()) throw new Error('SLOT_TAKEN');

    status = cap.autoConfirm ? 'confirmed' : 'pending';

    tx.set(appointmentRef, {
      ...data,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.set(slotRef, {
      date: data.date,
      timeSlot: data.timeSlot,
      bookedBy: data.patientId,
      appointmentId: appointmentRef.id,
    });

    // Grant the booked doctor read access to this patient's medical records.
    // Written by the patient (record owner) so the rules allow it; the doctor's
    // records read is authorized against this deterministic doc (Firestore rules
    // cannot query, only get/exists a known path).
    //
    // The grant expires, and the rules enforce that — existence alone used to
    // mean a single cancelled booking granted access forever. Rebooking extends
    // it, but never shortens it: booking a nearer date after a farther one must
    // not pull the expiry back in.
    if (data.doctorUserId) {
      const existingExpiry = grantSnap?.exists()
        ? toDate(grantSnap.data().expiresAt)
        : null;
      const earned = accessExpiryFor(data.date);
      const expiresAt =
        existingExpiry && existingExpiry.getTime() > earned.getTime() ? existingExpiry : earned;

      tx.set(doc(db, 'users', data.patientId, 'authorizedDoctors', data.doctorUserId), {
        doctorUserId: data.doctorUserId,
        doctorId: data.doctorId,
        grantedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });
    }
  });

  return { appointmentId: appointmentRef.id, status };
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const snap = await getDoc(doc(db, 'appointments', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Appointment;
}

// Appointments are sorted by date client-side (see sortByDateDesc) instead of via
// orderBy, keeping these queries equality-only so they need no composite index.
function sortByDateDesc(appointments: Appointment[]): Appointment[] {
  return appointments.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

export async function getUserAppointments(userId: string): Promise<Appointment[]> {
  const snap = await getDocs(
    query(
      collection(db, 'appointments'),
      where('patientId', '==', userId),
      limit(50),
    ),
  );
  return sortByDateDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
}

export function subscribeUserAppointments(
  patientId: string,
  onData: (appointments: Appointment[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId),
      limit(50),
    ),
    (snap) => onData(sortByDateDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)))),
    (err) => onError?.(err),
  );
}

export function subscribeDoctorAppointments(
  doctorUserId: string,
  onData: (appointments: Appointment[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'appointments'),
      where('doctorUserId', '==', doctorUserId),
      limit(100),
    ),
    (snap) => onData(sortByDateDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)))),
    (err) => onError?.(err),
  );
}

export async function getBookedSlots(doctorId: string, date: string): Promise<string[]> {
  const snap = await getDocs(
    query(collection(db, 'doctors', doctorId, 'slots'), where('date', '==', date)),
  );
  return snap.docs.map((d) => d.data().timeSlot as string);
}

/**
 * Booked slots across a date range, grouped by date. One listener covers the
 * whole booking strip, so a fully-booked day can be marked without a query per
 * date — and switching dates no longer briefly shows the previous date's
 * bookings. A single-field range on `date` needs no composite index.
 */
export function subscribeBookedSlotsRange(
  doctorId: string,
  fromDate: string,
  toDate: string,
  onData: (byDate: Record<string, string[]>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'doctors', doctorId, 'slots'),
      where('date', '>=', fromDate),
      where('date', '<=', toDate),
      limit(500),
    ),
    (snap) => {
      const byDate: Record<string, string[]> = {};
      snap.docs.forEach((d) => {
        const { date, timeSlot } = d.data() as { date: string; timeSlot: string };
        (byDate[date] ??= []).push(timeSlot);
      });
      onData(byDate);
    },
    (err) => onError?.(err),
  );
}

export function subscribeBookedSlots(
  doctorId: string,
  date: string,
  onData: (slots: string[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'doctors', doctorId, 'slots'), where('date', '==', date)),
    (snap) => onData(snap.docs.map((d) => d.data().timeSlot as string)),
    // Without this a rules regression renders as "every slot free", and every
    // booking then fails late with SLOT_TAKEN.
    (err) => onError?.(err),
  );
}

/** Cancels an appointment and frees its slot (works for patient and doctor). */
export async function cancelAppointment(appointment: Appointment): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'appointments', appointment.id), {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });

  // Appointments booked before the slots ledger existed have no slot doc;
  // deleting a nonexistent doc would fail the whole batch under the rules.
  const slotRef = doc(
    db,
    'doctors',
    appointment.doctorId,
    'slots',
    slotDocId(appointment.date, appointment.timeSlot),
  );
  const slotSnap = await getDoc(slotRef);
  if (slotSnap.exists()) batch.delete(slotRef);

  await batch.commit();

  // Cancelling may have removed the last thing justifying this doctor's access
  // to the patient's records. Best-effort: the grant carries an expiry the rules
  // enforce regardless, so a failure here delays revocation rather than losing it.
  await revokeAccessIfUnjustified(appointment).catch((e) =>
    console.warn('[cancelAppointment] grant revocation skipped:', e),
  );
}

/**
 * Drops the record-access grant when no remaining appointment justifies it.
 *
 * Called after a cancellation by either side. A patient may rewrite the grant
 * (narrowing its expiry to what is still justified); a doctor may only delete
 * their own — letting a doctor rewrite it would let them extend their own access.
 */
async function revokeAccessIfUnjustified(appointment: Appointment): Promise<void> {
  const { patientId, doctorUserId } = appointment;
  if (!doctorUserId) return;

  // Both roles can read their own side of this: patients query by patientId,
  // doctors by doctorUserId. Filter the other key client-side.
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return;
  const isPatient = currentUid === patientId;

  const snap = await getDocs(
    query(
      collection(db, 'appointments'),
      where(isPatient ? 'patientId' : 'doctorUserId', '==', isPatient ? patientId : doctorUserId),
      limit(100),
    ),
  );
  const between = snap.docs
    .map((d) => d.data() as Appointment)
    .filter((a) => a.patientId === patientId && a.doctorUserId === doctorUserId);

  const expiry = expiryFromAppointments(between);
  const grantRef = doc(db, 'users', patientId, 'authorizedDoctors', doctorUserId);

  if (expiry === null) {
    // Every appointment between them is cancelled — no basis for access at all.
    await deleteDoc(grantRef);
    return;
  }
  // Something still justifies access; only the patient may narrow the window.
  if (isPatient) {
    await updateDoc(grantRef, { expiresAt: Timestamp.fromDate(expiry) });
  }
}

/** Doctors currently able to read this patient's records. */
export function subscribeRecordGrants(
  patientId: string,
  onData: (grants: RecordGrant[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'users', patientId, 'authorizedDoctors'),
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const v = d.data();
          return {
            doctorUserId: d.id,
            doctorId: v.doctorId ?? '',
            grantedAt: toDate(v.grantedAt),
            expiresAt: toDate(v.expiresAt),
          };
        }),
      ),
    (err) => onError?.(err),
  );
}

/** Patient-initiated revocation — removes a doctor's access immediately. */
export async function revokeRecordAccess(
  patientId: string,
  doctorUserId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'users', patientId, 'authorizedDoctors', doctorUserId));
}

/** Doctor-side status transitions (confirm / complete). Cancel goes through cancelAppointment. */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: Exclude<AppointmentStatus, 'cancelled'>,
): Promise<void> {
  await updateDoc(doc(db, 'appointments', appointmentId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ── Medical Records ───────────────────────────────────────────────────────────

export async function getUserRecords(userId: string): Promise<MedicalRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, 'users', userId, 'records'),
      orderBy('createdAt', 'desc'),
      limit(100),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
}

export async function addRecord(
  userId: string,
  data: Omit<MedicalRecord, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'records'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteRecord(userId: string, recordId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'records', recordId));
}

// ── Medicine Reminders ────────────────────────────────────────────────────────

export async function getUserMedicines(userId: string): Promise<MedicineReminder[]> {
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'medicines'), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedicineReminder));
}

export async function saveMedicine(
  userId: string,
  data: Omit<MedicineReminder, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'medicines'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMedicine(
  userId: string,
  medicineId: string,
  data: Partial<MedicineReminder>,
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'medicines', medicineId), data);
}

export async function deleteMedicine(userId: string, medicineId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'medicines', medicineId));
}

// ── Prescriptions ────────────────────────────────────────────────────────────
// Top-level collection; doc id == appointmentId, so each appointment gets at
// most one prescription and lookup needs no query. Immutable once written
// (rules deny update/delete). NOTE: never getDoc-probe for existence — the
// owner-scoped read rule returns permission-denied for missing docs; derive
// existence from the role-scoped list subscriptions instead.

function sortPrescriptionsByDateDesc(prescriptions: Prescription[]): Prescription[] {
  return [...prescriptions].sort((a, b) => b.date.localeCompare(a.date));
}

export async function createPrescription(
  data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  await setDoc(doc(db, 'prescriptions', data.appointmentId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return data.appointmentId;
}

export async function getPrescription(id: string): Promise<Prescription | null> {
  const snap = await getDoc(doc(db, 'prescriptions', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Prescription;
}

export function subscribePatientPrescriptions(
  patientId: string,
  onData: (prescriptions: Prescription[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'prescriptions'),
      where('patientId', '==', patientId),
      limit(50),
    ),
    (snap) =>
      onData(sortPrescriptionsByDateDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prescription)))),
    (err) => onError?.(err),
  );
}

export function subscribeDoctorPrescriptions(
  doctorUserId: string,
  onData: (prescriptions: Prescription[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'prescriptions'),
      where('doctorUserId', '==', doctorUserId),
      limit(100),
    ),
    (snap) =>
      onData(sortPrescriptionsByDateDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prescription)))),
    (err) => onError?.(err),
  );
}
