import React, { useState, useEffect } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DoctorCard } from '../../src/components/doctors/DoctorCard';
import { DoctorFilter } from '../../src/components/doctors/DoctorFilter';
import { DoctorCardSkeleton } from '../../src/components/ui/Skeleton';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import { useDoctors } from '../../src/hooks/useDoctors';
import { useGridColumns } from '../../src/hooks/useIsDesktop';
import { useChatStore } from '../../src/store/chatStore';
import type { DoctorFilter as DoctorFilterType } from '../../src/types/doctor';
import type { Specialty } from '../../src/types/doctor';

export default function DoctorsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ specialty?: string }>();
  const { pendingSpecialty, setPendingSpecialty } = useChatStore();
  const numColumns = useGridColumns();

  const [filter, setFilter] = useState<DoctorFilterType>({
    specialty: (params.specialty as Specialty) ?? '',
    division: '',
    telemedicineOnly: false,
  });

  // Route param updates when a home-screen specialty chip is tapped while
  // this tab is already mounted.
  useEffect(() => {
    if (params.specialty) {
      setFilter((f) => ({ ...f, specialty: params.specialty as Specialty }));
    }
  }, [params.specialty]);

  // Apply specialty written by SeverityCard. useEffect (not useFocusEffect) is used
  // because bottom tabs stay mounted — the Zustand value updates before the re-render
  // that would refresh useFocusEffect's callbackRef, so we react to the store value
  // directly instead of relying on focus-event timing.
  useEffect(() => {
    if (pendingSpecialty) {
      setFilter((f) => ({ ...f, specialty: pendingSpecialty as Specialty }));
      setPendingSpecialty(null);
    }
  }, [pendingSpecialty]);

  const { doctors, loading, error, refetch } = useDoctors(filter);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ResponsiveContainer>
        <DoctorFilter filter={filter} onChange={setFilter} />

        {loading ? (
          <View className="px-4 pt-4">
            {Array.from({ length: 4 }).map((_, i) => <DoctorCardSkeleton key={i} />)}
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="text-slate-500">{t('common.error')}</Text>
          </View>
        ) : (
          <FlatList
            // RN requires a remount when numColumns changes.
            key={numColumns}
            numColumns={numColumns}
            data={doctors}
            keyExtractor={(d) => d.id}
            renderItem={({ item }) => (
              <View className="flex-1" style={numColumns > 1 ? { maxWidth: `${100 / numColumns}%` } : undefined}>
                <DoctorCard doctor={item} />
              </View>
            )}
            columnWrapperStyle={numColumns > 1 ? { gap: 16 } : undefined}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="items-center py-20 gap-2">
                <Text className="text-slate-400 text-base">{t('common.no_results')}</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
