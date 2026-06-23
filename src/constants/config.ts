import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const CONFIG = {
  groqApiKey: (process.env.EXPO_PUBLIC_GROQ_API_KEY ?? extra.groqApiKey ?? '') as string,
  firebase: {
    apiKey: (process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '') as string,
    authDomain: (process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '') as string,
    projectId: (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '') as string,
    storageBucket: (process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '') as string,
    messagingSenderId: (process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '') as string,
    appId: (process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '') as string,
  },
} as const;
