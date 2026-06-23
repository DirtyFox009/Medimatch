@AGENTS.md

# MediMatch

A cross-platform (iOS / Android / Web) healthcare app for Bangladesh. Patients find doctors, book appointments, run AI symptom triage, manage medical records, and locate nearby hospitals.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 56 + React Native 0.85 (New Architecture enabled) |
| Routing | Expo Router v4 (file-based, typed routes) |
| Styling | NativeWind 4 (Tailwind CSS for RN) |
| State | Zustand 5 |
| Backend | Firebase 12 — Auth, Firestore, Storage, FCM |
| AI | Groq SDK (`llama-3.3-70b-versatile`) — streaming chat + symptom triage |
| Maps | React-Leaflet (web) / WebView fallback (native) |
| Forms | React Hook Form |
| i18n | i18next + react-i18next (English + Bengali) |

## Key Directories

```
app/                    Expo Router file-based routes
  (auth)/               Login & register (unauthenticated group)
  (tabs)/               Bottom-tab shell: home, doctors, appointments, chat, records
  booking/[doctorId]    Multi-step appointment booking
  doctor/[id]           Doctor profile + reviews
  telemedicine/[id]     Video consultation screen
  emergency.tsx         Emergency map — no auth required
src/
  services/firebase/    Raw Firestore/Auth/Storage async functions
  services/groq/        Groq client, system prompts, triage JSON parser
  services/maps/        Hospital geolocation (Overpass API)
  hooks/                React hooks wrapping services (data + loading/error)
  store/                Zustand slices: authStore, bookingStore, chatStore
  components/           Shared UI; maps/ has web/native split components
  types/                TypeScript interfaces for all domain objects
  constants/            config.ts (single CONFIG object), divisions, specialties
  i18n/                 i18next setup + locales/en.json + locales/bn.json
  utils/                formatDate, haversine distance, platform helpers
scripts/
  seedDoctors.ts        Firestore seed script (run via `npm run seed`)
```

## Essential Commands

```bash
npm run start           # Expo dev server (choose platform in browser)
npm run android         # Launch on Android emulator/device
npm run ios             # Launch on iOS simulator/device
npm run web             # Launch web build (Metro bundler)
npm run seed            # Seed Firestore with doctor data (needs firebase-admin creds)
```

## Environment Variables

All keys are `EXPO_PUBLIC_` prefixed and centralized in `src/constants/config.ts:1`. Copy `.env.local` and fill in Firebase + Groq values. Never access `process.env` outside `config.ts`.

## Additional Documentation

- [Architectural Patterns](.claude/docs/architectural_patterns.md) — three-layer data flow, Zustand slice design, Firebase singleton, Firestore transaction, AI triage protocol, platform-split components, auth guard, i18n
