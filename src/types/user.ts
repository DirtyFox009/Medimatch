export type UserRole = 'patient' | 'doctor';

export type Gender = 'male' | 'female' | 'other';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  /** ISO YYYY-MM-DD. Null on accounts created before demographics were collected. */
  dateOfBirth: string | null;
  /** Null on accounts created before demographics were collected. */
  gender: Gender | null;
  phone: string | null;
  preferredLang: 'en' | 'bn';
  division: string;
  fcmToken: string | null;
  privacyAccepted: boolean;
  role: UserRole;
  /** Links a doctor account to its doctors/{doctorId} document. Null for patients. */
  doctorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
