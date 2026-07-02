import { useEffect } from 'react';
import { onAuthChange, getUserProfile } from '../services/firebase/auth';
import { registerForPushNotifications } from '../services/firebase/fcm';
import { useAuthStore } from '../store/authStore';

export function useAuthListener() {
  const { setFirebaseUser, setAppUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setAppUser(profile);
        // Best-effort: push tokens are unavailable in Expo Go / on web.
        registerForPushNotifications(user.uid).catch(() => {});
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);
}

export function useAuth() {
  const { firebaseUser, appUser, isLoading } = useAuthStore();
  return { user: firebaseUser, appUser, isLoading, isAuthenticated: !!firebaseUser };
}
