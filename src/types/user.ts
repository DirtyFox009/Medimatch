export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  phone: string | null;
  preferredLang: 'en' | 'bn';
  division: string;
  fcmToken: string | null;
  privacyAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
