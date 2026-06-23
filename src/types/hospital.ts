export interface Hospital {
  id: string;
  nameEn: string;
  nameBn: string;
  type: 'government' | 'private' | 'clinic';
  division: string;
  district: string;
  coordinates: { lat: number; lng: number };
  phone: string;
  emergencyAvailable: boolean;
  distance?: number; // km, set at runtime
}
