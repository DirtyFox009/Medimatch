export type ReminderFrequency = 'daily' | 'twice_daily' | 'thrice_daily' | 'weekly' | 'custom';

export interface MedicineReminder {
  id: string;
  userId: string;
  medicineName: string;
  dosage: string;
  frequency: ReminderFrequency;
  times: string[]; // ["08:00", "20:00"]
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  notes: string;
  isActive: boolean;
  notificationIds: string[];
  createdAt: Date;
}
