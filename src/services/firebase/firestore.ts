import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
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
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { Doctor, DoctorFilter, Review } from '../../types/doctor';
import type { Appointment, AppointmentStatus } from '../../types/appointment';
import type { MedicalRecord } from '../../types/record';
import type { MedicineReminder } from '../../types/medicine';

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
  constraints.push(orderBy('ratingAvg', 'desc'), limit(50));

  const snap = await getDocs(query(collection(db, 'doctors'), ...constraints));
  let doctors = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor));

  if (filter.specialty && filter.division) {
    doctors = doctors.filter((d) => d.division === filter.division);
  }
  if (filter.telemedicineOnly && (filter.specialty || filter.division)) {
    doctors = doctors.filter((d) => d.telemedicineAvailable);
  }
  if (filter.maxFee) doctors = doctors.filter((d) => d.consultationFee <= filter.maxFee!);

  return doctors;
}

export async function getDoctor(id: string): Promise<Doctor | null> {
  const snap = await getDoc(doc(db, 'doctors', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Doctor;
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

export async function bookAppointment(
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const slotRef = doc(db, 'doctors', data.doctorId, 'slots', slotDocId(data.date, data.timeSlot));
  const appointmentRef = doc(collection(db, 'appointments'));

  // tx.get on the slot doc is a true transactional read (queries inside
  // runTransaction are not), so two concurrent bookings of the same slot
  // cannot both commit.
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(slotRef);
    if (existing.exists()) throw new Error('SLOT_TAKEN');

    tx.set(appointmentRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.set(slotRef, {
      date: data.date,
      timeSlot: data.timeSlot,
      bookedBy: data.patientId,
      appointmentId: appointmentRef.id,
    });
  });

  return appointmentRef.id;
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const snap = await getDoc(doc(db, 'appointments', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Appointment;
}

export async function getUserAppointments(userId: string): Promise<Appointment[]> {
  const snap = await getDocs(
    query(
      collection(db, 'appointments'),
      where('patientId', '==', userId),
      orderBy('date', 'desc'),
      limit(50),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
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
      orderBy('date', 'desc'),
      limit(50),
    ),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment))),
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
      orderBy('date', 'desc'),
      limit(100),
    ),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment))),
    (err) => onError?.(err),
  );
}

export async function getBookedSlots(doctorId: string, date: string): Promise<string[]> {
  const snap = await getDocs(
    query(collection(db, 'doctors', doctorId, 'slots'), where('date', '==', date)),
  );
  return snap.docs.map((d) => d.data().timeSlot as string);
}

export function subscribeBookedSlots(
  doctorId: string,
  date: string,
  onData: (slots: string[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'doctors', doctorId, 'slots'), where('date', '==', date)),
    (snap) => onData(snap.docs.map((d) => d.data().timeSlot as string)),
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
