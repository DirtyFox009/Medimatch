import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserRecords } from '../../src/services/firebase/firestore';
import { useAuth } from '../../src/hooks/useAuth';
import { RecordCard } from '../../src/components/records/RecordCard';
import { RecordFileModal } from '../../src/components/records/RecordFileModal';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import type { MedicalRecord } from '../../src/types/record';

export default function PatientRecordsScreen() {
  const { t } = useTranslation();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const { appUser, isLoading } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewing, setViewing] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    getUserRecords(patientId)
      .then((data) => {
        if (active) setRecords(data);
      })
      .catch((e) => {
        console.error('[PatientRecords] load error:', e);
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [patientId]);

  // Doctor-only screen — patients reach their own records via the Records tab.
  if (!isLoading && appUser && appUser.role !== 'doctor') {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ResponsiveContainer>
        <View className="bg-white px-4 py-3 border-b border-slate-100">
          <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {t('patient_records.title')}
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">{t('patient_records.subtitle')}</Text>
        </View>

        {loading || isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0D9488" />
          </View>
        ) : (
          <FlatList
            data={records}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            ListEmptyComponent={
              <View className="items-center py-20 gap-2">
                <Ionicons
                  name={error ? 'alert-circle-outline' : 'folder-open-outline'}
                  size={48}
                  color="#CBD5E1"
                />
                <Text className="text-slate-400 text-center px-8">
                  {error ? t('common.error') : t('patient_records.no_records')}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <RecordCard record={item} onView={() => setViewing(item)} />
            )}
          />
        )}
      </ResponsiveContainer>

      <RecordFileModal record={viewing} onClose={() => setViewing(null)} />
    </SafeAreaView>
  );
}
