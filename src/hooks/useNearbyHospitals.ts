import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { getNearbyHospitals, getHospitals } from '../services/maps/hospitals';
import type { Hospital } from '../types/hospital';
import { isWeb } from '../utils/platform';

export function useNearbyHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationStatus('denied');
          setHospitals(getHospitals().slice(0, 10));
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setHospitals(getNearbyHospitals(latitude, longitude));
        setLocationStatus('granted');
      } catch {
        setLocationStatus('denied');
        setHospitals(getHospitals().slice(0, 10));
      }
    })();
  }, []);

  return { hospitals, userLocation, locationStatus };
}
