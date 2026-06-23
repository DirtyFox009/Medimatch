export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type AppointmentType = 'in-person' | 'telemedicine';
export type Severity = 'Mild' | 'Moderate' | 'Severe';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorNameEn: string;
  doctorNameBn: string;
  specialty: string;
  hospitalNameEn: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  type: AppointmentType;
  fee: number;
  status: AppointmentStatus;
  chatSummary: string | null;
  severity: Severity | null;
  notes: string;
  telemedicineRoomId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
