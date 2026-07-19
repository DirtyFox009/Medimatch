import { useEffect, useMemo, useState } from 'react';
import type { Prescription } from '../types/prescription';
import {
  subscribeDoctorPrescriptions,
  subscribePatientPrescriptions,
} from '../services/firebase/firestore';
import { useAuth } from './useAuth';

interface PrescriptionsState {
  prescriptions: Prescription[];
  /** appointmentId → true; drives "Write vs View Prescription" buttons. */
  byAppointmentId: Record<string, boolean>;
  loading: boolean;
  error: string | null;
}

function usePrescriptionsSubscription(
  subscribe: typeof subscribePatientPrescriptions | null,
  uid: string | undefined,
): PrescriptionsState {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subscribe || !uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsubscribe = subscribe(
      uid,
      (data) => {
        setPrescriptions(data);
        setLoading(false);
      },
      (err) => {
        console.error('[usePrescriptions] error:', err);
        setError('Failed to load prescriptions');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [subscribe, uid]);

  const byAppointmentId = useMemo(
    () => Object.fromEntries(prescriptions.map((p) => [p.appointmentId, true])),
    [prescriptions],
  );

  return { prescriptions, byAppointmentId, loading, error };
}

/** Prescriptions issued to the signed-in patient. */
export function usePatientPrescriptions(): PrescriptionsState {
  const { user, isAuthenticated } = useAuth();
  return usePrescriptionsSubscription(
    isAuthenticated ? subscribePatientPrescriptions : null,
    user?.uid,
  );
}

/** Prescriptions written by the signed-in doctor. */
export function useDoctorPrescriptions(): PrescriptionsState {
  const { user, appUser, isAuthenticated } = useAuth();
  const isDoctor = isAuthenticated && appUser?.role === 'doctor';
  return usePrescriptionsSubscription(
    isDoctor ? subscribeDoctorPrescriptions : null,
    user?.uid,
  );
}
