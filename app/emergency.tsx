import React from 'react';
import { Platform, View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../src/components/ui/Card';
import { HospitalMap } from '../src/components/maps/HospitalMap';
import { useNearbyHospitals } from '../src/hooks/useNearbyHospitals';
import { useChatStore } from '../src/store/chatStore';

const FIRST_AID: Record<string, string[]> = {
  Severe: [
    'Keep the person calm and still',
    'Do not give food or water',
    'Loosen tight clothing',
    'Stay with them until help arrives',
    'If unconscious and breathing, place in recovery position',
  ],
  Moderate: [
    'Rest and monitor symptoms',
    'Stay hydrated with clean water',
    'Avoid strenuous activity',
    'Seek medical attention within 24 hours',
  ],
  Mild: [
    'Rest at home',
    'Stay hydrated',
    'Over-the-counter medication may help',
    'See a doctor if symptoms worsen or persist beyond 3 days',
  ],
};

export default function EmergencyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hospitals, userLocation, locationStatus } = useNearbyHospitals();
  const { triageResult } = useChatStore();

  const severity = triageResult?.severity ?? 'Severe';
  const firstAidSteps = FIRST_AID[severity] ?? FIRST_AID.Severe;
  const firstAid = triageResult?.firstAid;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-red-600 px-6 pt-4 pb-5 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">{t('emergency.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Emergency call buttons */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => Linking.openURL('tel:999')}
            className="bg-red-600 rounded-2xl py-5 flex-row items-center justify-center gap-3 shadow-lg"
            style={Platform.select({ web: { boxShadow: '0px 4px 8px rgba(220,38,38,0.4)' }, default: { elevation: 4, shadowColor: '#DC2626', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } } })}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={28} color="#fff" />
            <View>
              <Text className="text-white text-xl font-bold">{t('emergency.call_999')}</Text>
              <Text className="text-red-200 text-xs">National Emergency</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('tel:199')}
            className="bg-orange-500 rounded-2xl py-4 flex-row items-center justify-center gap-3"
            activeOpacity={0.85}
          >
            <Ionicons name="car" size={22} color="#fff" />
            <Text className="text-white text-lg font-bold">{t('emergency.call_ambulance')}</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <Card className="overflow-hidden">
          <View className="px-4 py-3 border-b border-slate-100">
            <Text className="font-semibold text-slate-700">{t('emergency.nearby_hospitals')}</Text>
            {locationStatus === 'denied' && (
              <Text className="text-xs text-amber-600 mt-0.5">{t('emergency.location_denied')}</Text>
            )}
            {locationStatus === 'loading' && (
              <Text className="text-xs text-slate-500 mt-0.5">{t('emergency.locating')}</Text>
            )}
          </View>
          <HospitalMap hospitals={hospitals} userLocation={userLocation} height={220} />
        </Card>

        {/* Hospital list */}
        <View className="gap-2">
          {hospitals.map((h) => (
            <Card key={h.id} className="p-3 flex-row items-start gap-3">
              <View className={`w-8 h-8 rounded-lg items-center justify-center ${h.emergencyAvailable ? 'bg-red-100' : 'bg-slate-100'}`}>
                <Ionicons name="medical" size={16} color={h.emergencyAvailable ? '#DC2626' : '#94A3B8'} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-medium text-slate-800 text-sm">{h.nameEn}</Text>
                {h.distance !== undefined && (
                  <Text className="text-slate-500 text-xs">{t('emergency.distance', { km: h.distance.toFixed(1) })}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${h.phone}`)}
                className="bg-primary-50 rounded-lg px-2 py-1.5"
              >
                <Ionicons name="call" size={16} color="#2563EB" />
              </TouchableOpacity>
            </Card>
          ))}
        </View>

        {/* First Aid */}
        <Card className="p-4 gap-3">
          <Text className="font-semibold text-slate-700">{t('emergency.first_aid')}</Text>
          {firstAid && (
            <Text className="text-slate-600 text-sm leading-relaxed">{firstAid}</Text>
          )}
          <View className="gap-2">
            {firstAidSteps.map((step, i) => (
              <View key={i} className="flex-row gap-2 items-start">
                <View className="w-5 h-5 rounded-full bg-red-100 items-center justify-center mt-0.5">
                  <Text className="text-red-700 text-xs font-bold">{i + 1}</Text>
                </View>
                <Text className="flex-1 text-slate-700 text-sm">{step}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
