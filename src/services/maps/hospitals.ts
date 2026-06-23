import { haversineKm } from '../../utils/haversine';
import type { Hospital } from '../../types/hospital';

// Bundled dataset — loaded synchronously, no network needed
const BD_HOSPITALS: Hospital[] = [
  // Dhaka
  { id: 'h001', nameEn: 'Dhaka Medical College Hospital', nameBn: 'ঢাকা মেডিকেল কলেজ হাসপাতাল', type: 'government', division: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7270, lng: 90.3988 }, phone: '02-55165088', emergencyAvailable: true },
  { id: 'h002', nameEn: 'Evercare Hospital Dhaka', nameBn: 'এভারকেয়ার হাসপাতাল ঢাকা', type: 'private', division: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.8103, lng: 90.4125 }, phone: '02-8431661', emergencyAvailable: true },
  { id: 'h003', nameEn: 'Square Hospital', nameBn: 'স্কয়ার হাসপাতাল', type: 'private', division: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7512, lng: 90.3752 }, phone: '02-8159457', emergencyAvailable: true },
  { id: 'h004', nameEn: 'BSMMU (PG Hospital)', nameBn: 'বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয়', type: 'government', division: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7385, lng: 90.3955 }, phone: '02-55161051', emergencyAvailable: true },
  { id: 'h005', nameEn: 'United Hospital Dhaka', nameBn: 'ইউনাইটেড হাসপাতাল ঢাকা', type: 'private', division: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.8009, lng: 90.4133 }, phone: '02-8836000', emergencyAvailable: true },
  { id: 'h006', nameEn: 'National Heart Foundation Hospital', nameBn: 'জাতীয় হৃদরোগ ইনস্টিটিউট', type: 'government', division: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7801, lng: 90.3567 }, phone: '02-8116138', emergencyAvailable: true },
  { id: 'h007', nameEn: 'Popular Medical College Hospital', nameBn: 'পপুলার মেডিকেল কলেজ হাসপাতাল', type: 'private', division: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7508, lng: 90.3710 }, phone: '02-9660118', emergencyAvailable: true },
  { id: 'h008', nameEn: 'Ibn Sina Hospital Dhanmondi', nameBn: 'ইবনে সিনা হাসপাতাল ধানমন্ডি', type: 'private', division: 'Dhaka', district: 'Dhaka', coordinates: { lat: 23.7461, lng: 90.3742 }, phone: '02-9671234', emergencyAvailable: false },
  // Chittagong
  { id: 'h009', nameEn: 'Chittagong Medical College Hospital', nameBn: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল', type: 'government', division: 'Chittagong', district: 'Chittagong', coordinates: { lat: 22.3569, lng: 91.8329 }, phone: '031-615300', emergencyAvailable: true },
  { id: 'h010', nameEn: 'Evercare Hospital Chattogram', nameBn: 'এভারকেয়ার হাসপাতাল চট্টগ্রাম', type: 'private', division: 'Chittagong', district: 'Chittagong', coordinates: { lat: 22.3490, lng: 91.8349 }, phone: '031-2850010', emergencyAvailable: true },
  { id: 'h011', nameEn: 'Chevron Clinical Laboratory', nameBn: 'শেভরন ক্লিনিক্যাল ল্যাবরেটরি', type: 'private', division: 'Chittagong', district: 'Chittagong', coordinates: { lat: 22.3601, lng: 91.8195 }, phone: '031-711777', emergencyAvailable: false },
  // Sylhet
  { id: 'h012', nameEn: 'MAG Osmani Medical College Hospital', nameBn: 'ওসমানী মেডিকেল কলেজ হাসপাতাল', type: 'government', division: 'Sylhet', district: 'Sylhet', coordinates: { lat: 24.8988, lng: 91.8750 }, phone: '0821-721048', emergencyAvailable: true },
  { id: 'h013', nameEn: 'Mount Adora Hospital Sylhet', nameBn: 'মাউন্ট আডোরা হাসপাতাল', type: 'private', division: 'Sylhet', district: 'Sylhet', coordinates: { lat: 24.9045, lng: 91.8685 }, phone: '0821-725550', emergencyAvailable: true },
  // Rajshahi
  { id: 'h014', nameEn: 'Rajshahi Medical College Hospital', nameBn: 'রাজশাহী মেডিকেল কলেজ হাসপাতাল', type: 'government', division: 'Rajshahi', district: 'Rajshahi', coordinates: { lat: 24.3636, lng: 88.5990 }, phone: '0721-775052', emergencyAvailable: true },
  { id: 'h015', nameEn: 'Popular Medical Centre Rajshahi', nameBn: 'পপুলার মেডিকেল সেন্টার রাজশাহী', type: 'private', division: 'Rajshahi', district: 'Rajshahi', coordinates: { lat: 24.3690, lng: 88.6010 }, phone: '0721-810282', emergencyAvailable: false },
  // Khulna
  { id: 'h016', nameEn: 'Khulna Medical College Hospital', nameBn: 'খুলনা মেডিকেল কলেজ হাসপাতাল', type: 'government', division: 'Khulna', district: 'Khulna', coordinates: { lat: 22.8456, lng: 89.5403 }, phone: '041-760020', emergencyAvailable: true },
  { id: 'h017', nameEn: 'Gazi Medical College Hospital Khulna', nameBn: 'গাজী মেডিকেল কলেজ হাসপাতাল', type: 'private', division: 'Khulna', district: 'Khulna', coordinates: { lat: 22.8374, lng: 89.5473 }, phone: '041-731000', emergencyAvailable: true },
  // Barisal
  { id: 'h018', nameEn: 'Sher-E-Bangla Medical College Hospital', nameBn: 'শের-ই-বাংলা মেডিকেল কলেজ হাসপাতাল', type: 'government', division: 'Barisal', district: 'Barisal', coordinates: { lat: 22.7010, lng: 90.3535 }, phone: '0431-62010', emergencyAvailable: true },
  // Rangpur
  { id: 'h019', nameEn: 'Rangpur Medical College Hospital', nameBn: 'রংপুর মেডিকেল কলেজ হাসপাতাল', type: 'government', division: 'Rangpur', district: 'Rangpur', coordinates: { lat: 25.7439, lng: 89.2752 }, phone: '0521-63300', emergencyAvailable: true },
  // Mymensingh
  { id: 'h020', nameEn: 'Mymensingh Medical College Hospital', nameBn: 'ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল', type: 'government', division: 'Mymensingh', district: 'Mymensingh', coordinates: { lat: 24.7471, lng: 90.4203 }, phone: '091-65027', emergencyAvailable: true },
];

export function getHospitals(): Hospital[] {
  return BD_HOSPITALS;
}

export function getNearbyHospitals(
  userLat: number,
  userLng: number,
  count = 10,
): Hospital[] {
  return BD_HOSPITALS
    .map((h) => ({
      ...h,
      distance: haversineKm(userLat, userLng, h.coordinates.lat, h.coordinates.lng),
    }))
    .sort((a, b) => a.distance! - b.distance!)
    .slice(0, count);
}

export function getHospitalsForMap(): Array<{
  id: string;
  lat: number;
  lng: number;
  nameEn: string;
  nameBn: string;
  phone: string;
  emergency: boolean;
}> {
  return BD_HOSPITALS.map((h) => ({
    id: h.id,
    lat: h.coordinates.lat,
    lng: h.coordinates.lng,
    nameEn: h.nameEn,
    nameBn: h.nameBn,
    phone: h.phone,
    emergency: h.emergencyAvailable,
  }));
}
