import { Platform } from 'react-native';
import type { Hospital } from '../../types/hospital';

interface HospitalMapProps {
  hospitals: Hospital[];
  userLocation?: { lat: number; lng: number } | null;
  height?: number;
}

// Platform-switched export — react-leaflet is blocked from the native bundle by metro.config.js
export const HospitalMap: React.ComponentType<HospitalMapProps> =
  Platform.OS === 'web'
    ? require('./HospitalMapWeb').HospitalMapWeb
    : require('./HospitalMapNative').HospitalMapNative;
