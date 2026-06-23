import React, { useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Hospital } from '../../types/hospital';

interface HospitalMapNativeProps {
  hospitals: Hospital[];
  userLocation?: { lat: number; lng: number } | null;
  height?: number;
}

function buildLeafletHtml(
  hospitals: Hospital[],
  center: [number, number],
): string {
  const markers = hospitals
    .map(
      (h) =>
        `L.marker([${h.coordinates.lat},${h.coordinates.lng}])
          .addTo(map)
          .bindPopup("<b>${h.nameEn}</b><br/>${h.phone}${h.emergencyAvailable ? '<br/><span style=\\"color:red\\">🚨 Emergency</span>' : ''}");`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>html,body,#map{margin:0;padding:0;width:100%;height:100%}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${center[0]},${center[1]}],12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'&copy; OpenStreetMap contributors'
    }).addTo(map);
    ${markers}
  </script>
</body>
</html>`;
}

export function HospitalMapNative({ hospitals, userLocation, height = 300 }: HospitalMapNativeProps) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : hospitals.length > 0
      ? [hospitals[0].coordinates.lat, hospitals[0].coordinates.lng]
      : [23.727, 90.3988];

  const html = buildLeafletHtml(hospitals, center);

  return (
    <View style={{ height, borderRadius: 12, overflow: 'hidden' }}>
      <WebView
        source={{ html }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
      />
    </View>
  );
}
