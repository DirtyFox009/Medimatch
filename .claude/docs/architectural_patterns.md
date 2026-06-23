# Architectural Patterns

## 1. Three-Layer Data Access (Service → Hook → Component)

All data flows through three distinct layers — no component talks to Firebase or Groq directly.

- **Services** (`src/services/`) — raw async functions, pure data I/O, no React
- **Hooks** (`src/hooks/`) — wrap services with `useState`/`useEffect`, expose loading/error states
- **Components/Screens** — call hooks only, never services

Examples:
- `src/services/firebase/firestore.ts` → `src/hooks/useDoctors.ts` → `app/(tabs)/doctors.tsx`
- `src/services/groq/client.ts` + `triage.ts` → `src/hooks/useGroqChat.ts` → `app/(tabs)/chat.tsx`

## 2. Zustand Store Separation by Domain

Each domain has its own Zustand slice — no shared mega-store.

- `src/store/authStore.ts` — Firebase `User` + `AppUser` profile + loading flag
- `src/store/bookingStore.ts` — multi-step booking wizard state + `reset()` to clear after success
- `src/store/chatStore.ts` — chat messages, streaming flag, triage result, suggested specialty

Pattern: stores expose flat setters (`setDate`, `setSlot`) rather than dispatching action objects.

## 3. Config via `EXPO_PUBLIC_` Env Vars Only

All runtime config is centralized in `src/constants/config.ts:1`. Keys are consumed from `process.env.EXPO_PUBLIC_*` and surfaced as a single typed `CONFIG` object. No `.env` key is accessed outside this file.

## 4. Platform-Split Components (Web vs Native)

Components that need different implementations per platform follow a three-file convention:

```
HospitalMap.tsx        ← public entry: runtime Platform.OS switch
HospitalMapWeb.tsx     ← react-leaflet (web)
HospitalMapNative.tsx  ← native fallback (e.g. WebView or stub)
```

Metro is configured in `metro.config.js:7-18` to exclude `leaflet` / `react-leaflet` from native bundles via a custom `resolveRequest` resolver that returns `{ type: 'empty' }`.

## 5. Firebase Singleton Pattern

`src/services/firebase/config.ts:10` uses `getApps().length === 0 ? initializeApp(...) : getApp()` to guarantee one app instance even when the module is hot-reloaded. All other Firebase modules import `{ auth, db, storage }` from this file.

## 6. Firestore Transaction for Double-Booking Prevention

`src/services/firebase/firestore.ts:74` wraps `bookAppointment` in `runTransaction` to atomically check for an existing slot before writing, throwing `'SLOT_TAKEN'` if one exists.

## 7. AI Response Protocol — Embedded JSON Triage Block

The Groq chat stream returns prose + a JSON block in the same response. `src/services/groq/triage.ts` provides three utilities consumed by `useGroqChat`:
- `parseTriageResult` — extracts the structured `TriageResult`
- `extractSpecialty` — pulls the recommended specialty
- `stripTriageJson` — removes the JSON block before displaying text to the user

## 8. Auth Guard in Root Layout

`app/_layout.tsx:13-28` contains `AuthGate`, a component that reads from `useAuthStore` and uses `useSegments` + `router.replace` to enforce route access rules. This is registered once at the root stack — individual screens do not repeat auth checks.

## 9. i18n with Bilingual Support (EN + BN)

`src/i18n/index.ts` bootstraps i18next with English and Bengali (Bangla) locales loaded from JSON files. Language detection for AI responses uses a Unicode range check in `src/services/groq/triage.ts:6`: `/[ঀ-৿]/.test(text)`.
