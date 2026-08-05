export type Specialty =
  | 'Cardiology'
  | 'General Medicine'
  | 'Pediatrics'
  | 'Gynecology'
  | 'Orthopedics'
  | 'ENT'
  | 'Dermatology'
  | 'Neurology'
  | 'Gastroenterology'
  | 'Psychiatry'
  | 'Ophthalmology'
  | 'Urology';

export interface Doctor {
  id: string;
  nameEn: string;
  nameBn: string;
  qualifications: string[];
  bmdcReg: string;
  specialty: Specialty;
  hospitalNameEn: string;
  hospitalNameBn: string;
  division: string;
  district: string;
  coordinates: { lat: number; lng: number };
  consultationFee: number;
  telemedicineFee: number;
  availableDays: string[];
  timeSlots: string[];
  // Chamber capacity. All optional: doctors seeded before these existed fall
  // back to values derived from `timeSlots` (see readCapacity in
  // utils/capacity.ts), reproducing their old booking grid exactly.

  /** Confirm bookings automatically instead of queuing them as 'pending'. Default ON. */
  autoConfirm?: boolean;
  /** 'HH:MM' — the first slot of the chamber session. */
  chamberStart?: string;
  /** Minutes per patient; the gap between generated slots. */
  slotDurationMins?: number;
  /** Patients seen per day. Generates exactly this many entries into timeSlots. */
  dailyPatientLimit?: number;
  /** Per-date limit overrides, 'YYYY-MM-DD' → limit. Past dates pruned on write. */
  dailyLimitOverrides?: Record<string, number>;
  avatarUrl: string | null;
  ratingAvg: number;
  reviewCount: number;
  isVerified: boolean;
  telemedicineAvailable: boolean;
  isAvailable: boolean;
  bio: string;
  /** Auth uid of the provisioned doctor portal account, set by provisionDoctorAccounts.ts. */
  userId?: string | null;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface DoctorFilter {
  specialty?: Specialty | '';
  division?: string;
  maxFee?: number;
  telemedicineOnly?: boolean;
  availableToday?: boolean;
}
