import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAppointment } from '../../src/services/firebase/firestore';
import { useAuth } from '../../src/hooks/useAuth';

// Jitsi Meet — completely free, no API key required
function buildJitsiUrl(roomId: string, displayName: string): string {
  return `https://meet.jit.si/${roomId}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(displayName)}`;
}

export default function TelemedicineScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { appUser } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // The room id is a random token stored on the appointment (unguessable, and
  // only patient + doctor can read the doc). Legacy appointments without one
  // fall back to the old derived id.
  useEffect(() => {
    if (!appointmentId) return;
    getAppointment(appointmentId)
      .then((appt) => setRoomId(appt?.telemedicineRoomId ?? `medimatch-${appointmentId}`))
      .catch(() => setRoomId(`medimatch-${appointmentId}`))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  if (loading || !roomId) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator color="#fff" />
      </SafeAreaView>
    );
  }

  const displayName =
    appUser?.role === 'doctor' ? appUser.displayName || 'Doctor' : appUser?.displayName || 'Patient';
  const jitsiUrl = buildJitsiUrl(roomId, displayName);

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center gap-4">
        <Ionicons name="videocam" size={48} color="#fff" />
        <Text className="text-white text-lg font-semibold">{t('telemedicine.title')}</Text>
        <Text className="text-slate-400 text-center px-8">
          On web, the video call opens in a new tab via Jitsi Meet.
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (typeof window !== 'undefined') window.open(jitsiUrl, '_blank');
          }}
          className="bg-teal-500 rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Open Video Call</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="mt-2">
          <Text className="text-slate-400">{t('common.back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <WebView
        source={{ uri: jitsiUrl }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        originWhitelist={['https://meet.jit.si']}
      />
      <View className="bg-slate-900 px-6 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-red-600 rounded-xl py-3 flex-row items-center justify-center gap-2"
        >
          <Ionicons name="call" size={18} color="#fff" />
          <Text className="text-white font-semibold">{t('telemedicine.end_call')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
