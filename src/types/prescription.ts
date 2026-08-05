import type { Gender } from './user';

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

/** The account-level gender, plus '' for a prescription the doctor hasn't filled in. */
export type PatientGender = Gender | '';

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
  // Patient snapshot, frozen at issue time. Name/age/gender prefill from the
  // patient's profile (users/{uid}, read via the authorizedDoctors grant); the
  // doctor may override any of them before saving.
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
