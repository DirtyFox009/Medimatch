export type UserRole = 'patient' | 'doctor';

export type Gender = 'male' | 'female' | 'other';

/**
 * One doctor's permission to read this patient's profile and medical records,
 * stored at users/{patientId}/authorizedDoctors/{doctorUserId}. Written by the
 * patient at booking time; the Firestore rules authorise reads against it.
 */
export interface RecordGrant {
  /** Auth uid of the doctor — also the document id. */
  doctorUserId: string;
  /** doctors/{doctorId} document id, for resolving the doctor's name. */
  doctorId: string;
  grantedAt: Date | null;
  /** Access lapses here; the rules reject the read past this instant. */
  expiresAt: Date | null;
}

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
  /** When the notification list was last opened; anything newer is unread. */
  notificationsSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
