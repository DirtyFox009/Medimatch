import type { Specialty } from '../types/doctor';

export const SPECIALTIES: Array<{ value: Specialty; labelEn: string; labelBn: string; icon: string }> = [
  { value: 'General Medicine', labelEn: 'General Medicine', labelBn: 'সাধারণ চিকিৎসা', icon: 'medical-bag' },
  { value: 'Cardiology', labelEn: 'Cardiology', labelBn: 'হৃদরোগ', icon: 'heart' },
  { value: 'Pediatrics', labelEn: 'Pediatrics', labelBn: 'শিশুরোগ', icon: 'baby' },
  { value: 'Gynecology', labelEn: 'Gynecology', labelBn: 'স্ত্রীরোগ', icon: 'human-female' },
  { value: 'Orthopedics', labelEn: 'Orthopedics', labelBn: 'অস্থিরোগ', icon: 'bone' },
  { value: 'ENT', labelEn: 'ENT', labelBn: 'নাক-কান-গলা', icon: 'ear-hearing' },
  { value: 'Dermatology', labelEn: 'Dermatology', labelBn: 'চর্মরোগ', icon: 'hand-back-right' },
  { value: 'Neurology', labelEn: 'Neurology', labelBn: 'স্নায়ুরোগ', icon: 'brain' },
  { value: 'Gastroenterology', labelEn: 'Gastroenterology', labelBn: 'পরিপাকতন্ত্র', icon: 'stomach' },
  { value: 'Psychiatry', labelEn: 'Psychiatry', labelBn: 'মানসিক স্বাস্থ্য', icon: 'head-cog' },
  { value: 'Ophthalmology', labelEn: 'Ophthalmology', labelBn: 'চক্ষুরোগ', icon: 'eye' },
  { value: 'Urology', labelEn: 'Urology', labelBn: 'মূত্ররোগ', icon: 'water' },
];
