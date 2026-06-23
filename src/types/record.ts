export type RecordType = 'prescription' | 'report' | 'scan' | 'other';

export interface MedicalRecord {
  id: string;
  userId: string;
  type: RecordType;
  title: string;
  doctorName: string;
  hospitalName: string;
  date: string; // YYYY-MM-DD
  fileUrl: string;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  notes: string;
  createdAt: Date;
}
