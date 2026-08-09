import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  subscribeUserAppointments,
  subscribeDoctorAppointments,
  markNotificationsSeen,
} from '../services/firebase/firestore';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store/authStore';
import { buildFeed, unreadCount, toDate, type FeedItem } from '../utils/notifications';
import type { Appointment } from '../types/appointment';

/**
 * In-app notification feed for whichever role is signed in.
 *
 * Reuses the appointment subscriptions the app already runs rather than adding
 * a notifications collection — see utils/notifications.ts for why.
 */
export function useNotifications() {
  const { user, appUser } = useAuth();
  const setAppUser = useAuthStore((s) => s.setAppUser);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const role = appUser?.role === 'doctor' ? 'doctor' : 'patient';

  /**
   * Read from the shared auth store, not local state: the header bell and the
   * list screen each run this hook, so a private copy would let the list clear
   * itself while the bell kept showing a stale badge. useAuthListener only
   * refetches the profile on an auth change, so mark-seen updates the store.
   */
  const seenAt = toDate(appUser?.notificationsSeenAt);

  useEffect(() => {
    if (!user) return;
    const onError = (e: Error) => console.error('[useNotifications] subscription failed:', e);
    const unsubscribe =
      role === 'doctor'
        ? subscribeDoctorAppointments(user.uid, setAppointments, onError)
        : subscribeUserAppointments(user.uid, setAppointments, onError);
    return unsubscribe;
  }, [user, role]);

  const items = useMemo<FeedItem[]>(
    () => (user ? buildFeed(appointments, { role, myUid: user.uid, seenAt }) : []),
    [appointments, role, user, seenAt],
  );

  const unread = useMemo(() => unreadCount(items), [items]);

  const markSeen = useCallback(async () => {
    if (!user || !appUser || unread === 0) return;
    // Optimistic, and written to the shared store so the header bell clears too.
    // A failed write only leaves the items unread — nothing is lost.
    setAppUser({ ...appUser, notificationsSeenAt: new Date() });
    try {
      await markNotificationsSeen(user.uid);
    } catch (e) {
      console.error('[useNotifications] could not persist seen marker:', e);
    }
  }, [user, appUser, unread, setAppUser]);

  return { items, unread, markSeen };
}
