import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../ui/Avatar';
import { StarRating } from '../doctors/StarRating';
import { Skeleton } from '../ui/Skeleton';
import { getDoctors } from '../../services/firebase/firestore';
import type { Doctor, Specialty } from '../../types/doctor';

interface MatchedDoctorsProps {
  specialty: Specialty;
}

/**
 * Top-3 best-rated doctors for the triage-suggested specialty, rendered
 * inline in the SeverityCard so the patient can book in one tap.
 */
export function MatchedDoctors({ specialty }: MatchedDoctorsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);

  useEffect(() => {
    let active = true;
    getDoctors({ specialty })
      .then((all) => {
        if (active) setDoctors(all.slice(0, 3));
      })
      .catch(() => {
        if (active) setDoctors([]);
      });
    return () => { active = false; };
  }, [specialty]);

  if (doctors && doctors.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {t('chat.top_doctors')}
      </Text>

      {doctors === null
        ? [0, 1, 2].map((i) => (
            <View key={i} className="flex-row items-center gap-3 py-2">
              <Skeleton width={44} height={44} rounded />
              <View className="flex-1 gap-1.5">
                <Skeleton width="60%" height={12} />
                <Skeleton width="40%" height={10} />
              </View>
            </View>
          ))
        : doctors.map((d) => (
            <View
              key={d.id}
              className="flex-row items-center gap-3 border border-slate-100 rounded-xl p-3"
            >
              <Avatar uri={d.avatarUrl} name={d.nameEn} size={44} />
              <View className="flex-1 gap-0.5">
                <Text className="font-semibold text-slate-800 text-sm" numberOfLines={1}>
                  {d.nameEn}
                </Text>
                <View className="flex-row items-center gap-2">
                  <StarRating rating={d.ratingAvg} size={11} />
                  <Text className="text-slate-500 text-xs">৳{d.consultationFee}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/booking/${d.id}`)}
                activeOpacity={0.8}
                className="bg-primary-500 rounded-lg px-4 py-2"
              >
                <Text className="text-white text-xs font-semibold">{t('chat.book')}</Text>
              </TouchableOpacity>
            </View>
          ))}
    </View>
  );
}
