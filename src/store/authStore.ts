import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { AppUser } from '../types/user';

interface AuthState {
  firebaseUser: User | null;
  appUser: AppUser | null;
  /**
   * Mirrors firebaseUser.emailVerified. Held separately because reload()
   * mutates the Firebase User in place — the store would hand back the same
   * object reference and nothing would re-render.
   */
  emailVerified: boolean;
  isLoading: boolean;
  setFirebaseUser: (user: User | null) => void;
  setAppUser: (user: AppUser | null) => void;
  setEmailVerified: (verified: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  appUser: null,
  emailVerified: false,
  isLoading: true,
  setFirebaseUser: (firebaseUser) =>
    set({ firebaseUser, emailVerified: firebaseUser?.emailVerified ?? false }),
  setAppUser: (appUser) => set({ appUser }),
  setEmailVerified: (emailVerified) => set({ emailVerified }),
  setLoading: (isLoading) => set({ isLoading }),
}));
