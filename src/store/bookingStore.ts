import { create } from 'zustand';
import type { AppointmentType } from '../types/appointment';

interface BookingState {
  doctorId: string | null;
  selectedDate: string | null;
  selectedSlot: string | null;
  appointmentType: AppointmentType;
  notes: string;
  attachSymptoms: boolean;
  setDoctor: (doctorId: string) => void;
  setDate: (date: string) => void;
  setSlot: (slot: string) => void;
  setType: (type: AppointmentType) => void;
  setNotes: (notes: string) => void;
  setAttachSymptoms: (attach: boolean) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  doctorId: null,
  selectedDate: null,
  selectedSlot: null,
  appointmentType: 'in-person',
  notes: '',
  attachSymptoms: false,
  setDoctor: (doctorId) => set({ doctorId }),
  setDate: (selectedDate) => set({ selectedDate, selectedSlot: null }),
  setSlot: (selectedSlot) => set({ selectedSlot }),
  setType: (appointmentType) => set({ appointmentType }),
  setNotes: (notes) => set({ notes }),
  setAttachSymptoms: (attachSymptoms) => set({ attachSymptoms }),
  reset: () =>
    set({
      doctorId: null,
      selectedDate: null,
      selectedSlot: null,
      appointmentType: 'in-person',
      notes: '',
      attachSymptoms: false,
    }),
}));
