export interface PatientRiskFlags {
  pregnancy: boolean;
  renal: boolean;
  hepatic: boolean;
  elderly: boolean;
  pediatric: boolean;
  asthma: boolean;
  pepticUlcer: boolean;
  dengue: boolean;
  ckd: boolean;
  heartDisease: boolean;
}

export type PatientGender = 'male' | 'female' | 'other' | '';

export interface PrescriptionItem {
  medicineName: string;
  genericName: string;
  strength: string;
  /** Bangladeshi dose convention, e.g. "1+0+1" or "SOS" */
  dosage: string;
  /** 0 = as needed / continuous */
  durationDays: number;
  timing: string;
  instructions: string;
}

export interface Prescription {
  /** Doc id — equals appointmentId (one prescription per appointment). */
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  doctorUserId: string;
  // Patient snapshot — typed by the doctor (appointments carry no patient
  // profile, and doctors cannot read users/{uid}).
  patientName: string;
  patientAge: string;
  patientGender: PatientGender;
  patientWeight: string;
  // Clinical content
  complaint: string;
  diagnosis: string;
  riskFlags: PatientRiskFlags;
  items: PrescriptionItem[];
  tests: string[];
  advice: string;
  followUpDate: string | null;
  // Doctor letterhead snapshot, frozen at issue time
  doctorNameEn: string;
  doctorNameBn: string;
  qualifications: string[];
  bmdcReg: string;
  specialty: string;
  hospitalNameEn: string;
  hospitalNameBn: string;
  /** Issue date, YYYY-MM-DD */
  date: string;
  createdAt: Date;
  updatedAt: Date;
}
