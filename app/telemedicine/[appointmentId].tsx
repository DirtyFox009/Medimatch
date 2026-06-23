import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

// Jitsi Meet — completely free, no API key required
function buildJitsiUrl(roomId: string, displayName: string): string {
  return `https://meet.jit.si/${roomId}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(displayName)}`;
}

export default function TelemedicineScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  // Room ID derived from the appointment ID
  const roomId = `medimatch-${appointmentId}`;
  const displayName = 'Patient';
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
        originWhitelist={['*']}
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
