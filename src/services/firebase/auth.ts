import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { AppUser } from '../../types/user';

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName,
      email,
      phone: null,
      preferredLang: 'en',
      division: '',
      fcmToken: null,
      privacyAccepted: true,
      role: 'patient',
      doctorId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Non-blocking: signup succeeds even if the verification email fails to send.
    sendEmailVerification(user).catch((e) =>
      console.warn('[signUp] verification email failed:', e?.message),
    );
    return user;
  } catch (error: any) {
    console.error('[signUp] Firebase error — code:', error.code, '| message:', error.message);
    throw error;
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerification(): Promise<void> {
  if (!auth.currentUser) throw new Error('not_signed_in');
  await sendEmailVerification(auth.currentUser);
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    // Accounts created before roles existed are patients.
    role: data.role ?? 'patient',
    doctorId: data.doctorId ?? null,
  } as AppUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
