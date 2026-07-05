# MediMatch

A cross-platform (iOS / Android / Web) healthcare app for Bangladesh. Patients can find doctors, book appointments, run an AI-guided symptom check, manage medical records, set medicine reminders, and locate nearby hospitals in an emergency.

**Live demo:** https://medimatch-weld.vercel.app

## Features

- **Doctor search** — filter by specialty, division, fee, and telemedicine availability
- **Appointment booking** — real-time slot availability with double-booking protection; doctors confirm from their own portal
- **AI symptom checker** — adaptive guided questionnaire (English + Bengali) with instant emergency triage for red-flag symptoms, plus matched doctor suggestions
- **Telemedicine** — video consultations for confirmed appointments
- **Medical records** — upload and manage prescriptions, reports, and scans
- **Emergency** — nearest-hospital map with one-tap calling, no login required
- **Bilingual** — full English and Bengali support throughout

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 56 + React Native 0.85 (New Architecture) |
| Routing | Expo Router v4 (file-based, typed routes) |
| Styling | NativeWind 4 (Tailwind CSS for RN) |
| State | Zustand 5 |
| Backend | Firebase 12 — Auth, Firestore |
| AI | Groq (`llama-3.3-70b-versatile`) via a Vercel serverless proxy |
| Maps | React-Leaflet (web) / WebView fallback (native) |
| Forms | React Hook Form |
| i18n | i18next + react-i18next (English + Bengali) |

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in your Firebase web config
npm run start                      # Expo dev server (choose platform)
```

Other commands:

```bash
npm run android         # Launch on Android emulator/device
npm run ios             # Launch on iOS simulator/device
npm run web             # Launch web build (Metro bundler)
npm run seed            # Seed Firestore with doctor data (needs firebase-admin creds)
```

## Project Structure

```
app/                    Expo Router file-based routes
  (auth)/               Login & register (unauthenticated group)
  (tabs)/               Bottom-tab shell: home, doctors, appointments, chat, records
  booking/[doctorId]    Multi-step appointment booking
  doctor/[id]           Doctor profile + reviews
  telemedicine/[id]     Video consultation screen
  emergency.tsx         Emergency map — no auth required
api/                    Vercel serverless functions (Groq proxy)
src/
  services/firebase/    Firestore/Auth async functions
  services/groq/        Groq client, system prompts, triage JSON parser
  services/maps/        Hospital geolocation (Overpass API)
  hooks/                React hooks wrapping services (data + loading/error)
  store/                Zustand slices: authStore, bookingStore, chatStore
  components/           Shared UI; maps/ has web/native split components
  types/                TypeScript interfaces for all domain objects
  constants/            config.ts, divisions, specialties, triage flow
  i18n/                 i18next setup + locales/en.json + locales/bn.json
  utils/                formatDate, haversine distance, platform helpers
scripts/                Firestore seed + doctor account provisioning
```

## Environment Variables

All client keys are `EXPO_PUBLIC_`-prefixed and centralized in `src/constants/config.ts`. The Firebase web config is public by design — security is enforced by the deployed Firestore rules, not by hiding these values.

The Groq API key is **never** shipped to the client: it lives only in Vercel's dashboard as `GROQ_API_KEY` and is used server-side by the proxy in `api/groq.ts`.

## Deployment

The web build deploys to Vercel as a static Expo export, with the `api/` directory providing serverless functions. Pushes to `main` deploy automatically.
