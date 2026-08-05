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
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { AppUser, Gender } from '../../types/user';

/** Demographics collected on the registration form alongside the credentials. */
export interface SignUpProfile {
  displayName: string;
  /** ISO YYYY-MM-DD. Stored instead of an age so it can never go stale. */
  dateOfBirth: string;
  gender: Gender;
}

export async function signUp(
  email: string,
  password: string,
  profile: SignUpProfile,
): Promise<User> {
  const { displayName, dateOfBirth, gender } = profile;
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName,
      email,
      dateOfBirth,
      gender,
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
    // Accounts created before demographics were collected have neither; the
    // patient can fill them in from the Profile tab.
    dateOfBirth: data.dateOfBirth ?? null,
    gender: data.gender ?? null,
  } as AppUser;
}

/** The profile fields a patient may edit themselves — never role or doctorId. */
export type EditableProfile = Partial<
  Pick<AppUser, 'displayName' | 'dateOfBirth' | 'gender' | 'phone' | 'division' | 'preferredLang'>
>;

export async function updateUserProfile(uid: string, patch: EditableProfile): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...patch, updatedAt: serverTimestamp() });
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
