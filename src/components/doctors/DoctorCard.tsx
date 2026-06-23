import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { StarRating } from './StarRating';
import type { Doctor } from '../../types/doctor';

interface DoctorCardProps {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/doctor/${doctor.id}`)}
      activeOpacity={0.85}
    >
      <Card className="p-4 mb-3">
        <View className="flex-row gap-3">
          <Avatar uri={doctor.avatarUrl} name={doctor.nameEn} size={56} />

          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-base font-bold text-slate-800">{doctor.nameEn}</Text>
              {doctor.isVerified && (
                <View className="flex-row items-center gap-0.5">
                  <Ionicons name="shield-checkmark" size={14} color="#0EA5E9" />
                  <Text className="text-sky-600 text-xs font-medium">{t('doctors.verified')}</Text>
                </View>
              )}
            </View>

            <Text className="text-primary-600 text-sm font-medium">{doctor.specialty}</Text>

            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={12} color="#64748B" />
              <Text className="text-slate-500 text-xs">
                {doctor.hospitalNameEn}, {doctor.division}
              </Text>
            </View>

            <StarRating rating={doctor.ratingAvg} count={doctor.reviewCount} />
          </View>
        </View>

        {/* Fee row — always visible before booking */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <View className="gap-0.5">
            <Text className="text-xs text-slate-500">{t('doctors.consultation_fee')}</Text>
            <Text className="text-base font-bold text-slate-800">৳{doctor.consultationFee}</Text>
          </View>

          <View className="flex-row gap-2 items-center">
            {doctor.telemedicineAvailable && (
              <View className="flex-row items-center gap-1 bg-teal-50 px-2 py-1 rounded-lg">
                <Ionicons name="videocam" size={12} color="#0D9488" />
                <Text className="text-teal-700 text-xs font-medium">Telemedicine</Text>
              </View>
            )}
            <Badge label={t('common.book_now')} color="blue" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
