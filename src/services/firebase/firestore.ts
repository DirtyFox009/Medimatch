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
  runTransaction,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import type { Doctor, DoctorFilter, Review } from '../../types/doctor';
import type { Appointment } from '../../types/appointment';
import type { MedicalRecord } from '../../types/record';
import type { MedicineReminder } from '../../types/medicine';

// ── Doctors ──────────────────────────────────────────────────────────────────

export async function getDoctors(filter: DoctorFilter = {}): Promise<Doctor[]> {
  const constraints: QueryConstraint[] = [];

  if (filter.specialty) constraints.push(where('specialty', '==', filter.specialty));
  if (filter.division) constraints.push(where('division', '==', filter.division));
  if (filter.telemedicineOnly) constraints.push(where('telemedicineAvailable', '==', true));
  constraints.push(where('isAvailable', '==', true));
  constraints.push(orderBy('ratingAvg', 'desc'));
  constraints.push(limit(50));

  const snap = await getDocs(query(collection(db, 'doctors'), ...constraints));
  const doctors = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor));

  if (filter.maxFee) return doctors.filter((d) => d.consultationFee <= filter.maxFee!);
  return doctors;
}

export async function getDoctor(id: string): Promise<Doctor | null> {
  const snap = await getDoc(doc(db, 'doctors', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Doctor;
}

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

// ── Appointments ─────────────────────────────────────────────────────────────

export async function bookAppointment(
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const slotRef = collection(db, 'appointments');
  const slotQuery = query(
    slotRef,
    where('doctorId', '==', data.doctorId),
    where('date', '==', data.date),
    where('timeSlot', '==', data.timeSlot),
    where('status', 'in', ['pending', 'confirmed']),
  );

  // Transaction ensures no double-booking
  const appointmentId = await runTransaction(db, async (tx) => {
    const existing = await getDocs(slotQuery);
    if (!existing.empty) throw new Error('SLOT_TAKEN');

    const ref = doc(collection(db, 'appointments'));
    tx.set(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  });

  return appointmentId;
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

export async function getBookedSlots(doctorId: string, date: string): Promise<string[]> {
  const snap = await getDocs(
    query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      where('date', '==', date),
      where('status', 'in', ['pending', 'confirmed']),
    ),
  );
  return snap.docs.map((d) => d.data().timeSlot as string);
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  await updateDoc(doc(db, 'appointments', appointmentId), {
    status: 'cancelled',
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
