import { useState, useEffect, useCallback } from 'react';
import { getDoctors, getDoctor, getDoctorReviews } from '../services/firebase/firestore';
import { useAuth } from './useAuth';
import type { Doctor, DoctorFilter, Review } from '../types/doctor';

export function useDoctors(filter: DoctorFilter = {}) {
  const { isAuthenticated } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filter);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getDoctors(filter);
      setDoctors(data);
    } catch (e) {
      console.error('[useDoctors] error:', e);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [filterKey, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  return { doctors, loading, error, refetch: load };
}

export function useDoctor(id: string) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [d, r] = await Promise.all([getDoctor(id), getDoctorReviews(id)]);
      if (active) {
        setDoctor(d);
        setReviews(r);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  return { doctor, reviews, loading };
}
