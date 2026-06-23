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
  avatarUrl: string | null;
  ratingAvg: number;
  reviewCount: number;
  isVerified: boolean;
  telemedicineAvailable: boolean;
  isAvailable: boolean;
  bio: string;
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
