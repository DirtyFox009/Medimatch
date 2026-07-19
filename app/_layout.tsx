import '../global.css';
import '../src/i18n';

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useAuthListener, useAuth } from '../src/hooks/useAuth';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, appUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    const inDoctor = segments[0] === '(doctor)';
    const isPublicRoute = segments[0] === 'emergency' || segments[0] === 'privacy';
    const isDoctor = appUser?.role === 'doctor';

    if (!isAuthenticated && !inAuth && !isPublicRoute) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      router.replace(isDoctor ? '/(doctor)/appointments' : '/(tabs)/home');
    } else if (isAuthenticated && isDoctor && segments[0] === '(tabs)') {
      // Doctors live in their portal; telemedicine/emergency stay shared.
      router.replace('/(doctor)/appointments');
    } else if (isAuthenticated && !isDoctor && inDoctor) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, appUser?.role, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  useAuthListener();

  const [fontsLoaded] = useFonts({
    NotoSansBengali: require('../assets/fonts/NotoSansBengali-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(doctor)" />
          <Stack.Screen name="doctor/[id]" options={{ headerShown: true, title: 'Doctor Profile', headerBackTitle: 'Back' }} />
          <Stack.Screen name="booking/[doctorId]" options={{ headerShown: true, title: 'Book Appointment', headerBackTitle: 'Back' }} />
          <Stack.Screen name="telemedicine/[appointmentId]" options={{ headerShown: true, title: 'Video Consultation' }} />
          <Stack.Screen name="prescription/new" options={{ headerShown: true, title: 'Write Prescription', headerBackTitle: 'Back' }} />
          <Stack.Screen name="prescription/[id]" options={{ headerShown: true, title: 'Prescription', headerBackTitle: 'Back' }} />
          <Stack.Screen name="medicines" options={{ headerShown: true, title: 'Medicine Reminders' }} />
          <Stack.Screen name="emergency" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: true, title: 'Privacy Policy' }} />
        </Stack>
      </AuthGate>
    </SafeAreaProvider>
  );
}
