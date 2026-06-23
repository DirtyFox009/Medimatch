import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { StarRating } from '../../src/components/doctors/StarRating';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useDoctor } from '../../src/hooks/useDoctors';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { doctor, reviews, loading } = useDoctor(id);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isBn = i18n.language === 'bn';

  if (loading || !doctor) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4 gap-4" edges={['bottom']}>
        <Skeleton height={100} />
        <Skeleton height={60} />
        <Skeleton height={80} />
      </SafeAreaView>
    );
  }

  const name = isBn ? doctor.nameBn : doctor.nameEn;
  const hospital = isBn ? doctor.hospitalNameBn : doctor.hospitalNameEn;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="bg-white px-6 py-6 gap-4">
          <View className="flex-row gap-4 items-start">
            <Avatar uri={doctor.avatarUrl} name={doctor.nameEn} size={80} />
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-2 flex-wrap">
                <Text className="text-xl font-bold text-slate-800">{name}</Text>
                {doctor.isVerified && (
                  <View className="flex-row items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-full">
                    <Ionicons name="shield-checkmark" size={12} color="#0EA5E9" />
                    <Text className="text-sky-600 text-xs font-semibold">{t('doctors.verified')}</Text>
                  </View>
                )}
              </View>
              <Text className="text-primary-600 font-medium">{doctor.specialty}</Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="location-outline" size={12} color="#64748B" />
                <Text className="text-slate-500 text-sm">{hospital}</Text>
              </View>
              <StarRating rating={doctor.ratingAvg} count={doctor.reviewCount} size={16} />
            </View>
          </View>

          {/* BMDC registration — trust signal */}
          <View className="bg-sky-50 rounded-xl px-3 py-2 flex-row items-center gap-2">
            <Ionicons name="ribbon" size={14} color="#0EA5E9" />
            <Text className="text-sky-700 text-xs">
              {t('doctors.bmdc_reg')}: <Text className="font-bold">{doctor.bmdcReg}</Text>
            </Text>
          </View>

          {/* Qualifications */}
          <View className="gap-1">
            <Text className="text-xs font-semibold text-slate-500 uppercase">{t('doctors.qualifications')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {doctor.qualifications.map((q, i) => (
                <Badge key={i} label={q} color="blue" />
              ))}
            </View>
          </View>
        </View>

        {/* Fee card — prominently shown before booking */}
        <View className="mx-4 mt-4">
          <Card className="overflow-hidden">
            <View className="bg-slate-50 px-4 py-3 border-b border-slate-100">
              <Text className="font-semibold text-slate-700">Consultation Fees</Text>
            </View>
            <View className="p-4 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="business" size={16} color="#64748B" />
                  <Text className="text-slate-600">{t('booking.in_person')}</Text>
                </View>
                <Text className="text-lg font-bold text-slate-800">৳{doctor.consultationFee}</Text>
              </View>
              {doctor.telemedicineAvailable && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="videocam" size={16} color="#0D9488" />
                    <Text className="text-slate-600">{t('booking.telemedicine')}</Text>
                  </View>
                  <Text className="text-lg font-bold text-teal-700">৳{doctor.telemedicineFee}</Text>
                </View>
              )}
              <Text className="text-xs text-slate-400">Payable at appointment. No online payment required to book.</Text>
            </View>
          </Card>
        </View>

        {/* Available days */}
        <View className="mx-4 mt-4">
          <Card className="p-4 gap-2">
            <Text className="text-xs font-semibold text-slate-500 uppercase">{t('doctors.available_days')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {doctor.availableDays.map((d) => (
                <View key={d} className="bg-primary-50 px-3 py-1 rounded-full">
                  <Text className="text-primary-700 text-sm font-medium">{d}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Reviews */}
        {reviews.length > 0 && (
          <View className="mx-4 mt-4 mb-4">
            <Card className="p-4 gap-3">
              <Text className="font-semibold text-slate-700">{t('doctors.reviews')} ({reviews.length})</Text>
              {reviews.slice(0, 3).map((r) => (
                <View key={r.id} className="gap-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-medium text-slate-700 text-sm">{r.patientName}</Text>
                    <StarRating rating={r.rating} size={12} />
                  </View>
                  <Text className="text-slate-500 text-sm">{r.comment}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>

      {/* Sticky CTA */}
      <View className="bg-white px-4 py-4 border-t border-slate-100 gap-3">
        <Button
          title={t('doctors.book_in_person')}
          onPress={() => router.push({ pathname: '/booking/[doctorId]', params: { doctorId: doctor.id, type: 'in-person' } })}
          fullWidth
        />
        {doctor.telemedicineAvailable && (
          <Button
            title={t('doctors.book_telemedicine')}
            variant="secondary"
            onPress={() => router.push({ pathname: '/booking/[doctorId]', params: { doctorId: doctor.id, type: 'telemedicine' } })}
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}
