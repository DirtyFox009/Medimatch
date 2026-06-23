import React from 'react';
import { View } from 'react-native';
import type { Hospital } from '../../types/hospital';

// Lazily import react-leaflet only on web to keep this file tree-shakeable on native
// (metro.config.js blockList provides a second safety net)
let MapContainer: React.ComponentType<any>;
let TileLayer: React.ComponentType<any>;
let Marker: React.ComponentType<any>;
let Popup: React.ComponentType<any>;
let L: any;

if (typeof window !== 'undefined') {
  // Web only
  const leaflet = require('leaflet');
  const rl = require('react-leaflet');
  MapContainer = rl.MapContainer;
  TileLayer = rl.TileLayer;
  Marker = rl.Marker;
  Popup = rl.Popup;
  L = leaflet;

  // Fix Leaflet default icon path for bundlers
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface HospitalMapWebProps {
  hospitals: Hospital[];
  userLocation?: { lat: number; lng: number } | null;
  height?: number;
}

export function HospitalMapWeb({ hospitals, userLocation, height = 300 }: HospitalMapWebProps) {
  if (!MapContainer) return <View style={{ height, backgroundColor: '#E2E8F0' }} />;

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : hospitals.length > 0
      ? [hospitals[0].coordinates.lat, hospitals[0].coordinates.lng]
      : [23.7270, 90.3988]; // Dhaka default

  return (
    <View style={{ height }}>
      {/* Inject Leaflet CSS for web */}
      <style>{`
        @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        .leaflet-container { width: 100%; height: 100%; border-radius: 12px; }
      `}</style>
      <MapContainer
        center={center as [number, number]}
        zoom={12}
        style={{ height, borderRadius: 12 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hospitals.map((h) => (
          <Marker key={h.id} position={[h.coordinates.lat, h.coordinates.lng]}>
            <Popup>
              <strong>{h.nameEn}</strong>
              <br />
              {h.phone}
              {h.emergencyAvailable && <span style={{ color: 'red' }}> 🚨 Emergency</span>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </View>
  );
}
