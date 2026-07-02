export type UserRole = 'patient' | 'doctor';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
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
