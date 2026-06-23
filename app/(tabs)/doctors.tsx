import React, { useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DoctorCard } from '../../src/components/doctors/DoctorCard';
import { DoctorFilter } from '../../src/components/doctors/DoctorFilter';
import { DoctorCardSkeleton } from '../../src/components/ui/Skeleton';
import { useDoctors } from '../../src/hooks/useDoctors';
import type { DoctorFilter as DoctorFilterType } from '../../src/types/doctor';
import type { Specialty } from '../../src/types/doctor';

export default function DoctorsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ specialty?: string }>();

  const [filter, setFilter] = useState<DoctorFilterType>({
    specialty: (params.specialty as Specialty) ?? '',
    division: '',
    telemedicineOnly: false,
  });

  const { doctors, loading, error, refetch } = useDoctors(filter);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
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
          data={doctors}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => <DoctorCard doctor={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center py-20 gap-2">
              <Text className="text-slate-400 text-base">{t('common.no_results')}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
