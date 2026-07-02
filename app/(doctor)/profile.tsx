import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { getDoctor, updateDoctorAvailability } from '../../src/services/firebase/firestore';
import { signOut } from '../../src/services/firebase/auth';
import { useAuth } from '../../src/hooks/useAuth';
import type { Doctor } from '../../src/types/doctor';

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const { appUser } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appUser?.doctorId) {
      getDoctor(appUser.doctorId).then(setDoctor);
    }
  }, [appUser?.doctorId]);

  const toggleAvailability = async (value: boolean) => {
    if (!doctor) return;
    setSaving(true);
    setDoctor({ ...doctor, isAvailable: value });
    try {
      await updateDoctorAvailability(doctor.id, value);
    } catch {
      setDoctor({ ...doctor, isAvailable: !value });
      Alert.alert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (!doctor) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-400">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card className="p-5 items-center gap-3">
          <Avatar uri={doctor.avatarUrl} name={doctor.nameEn} size={80} />
          <View className="items-center">
            <Text className="text-xl font-bold text-slate-800">{doctor.nameEn}</Text>
            <Text className="text-teal-600 font-medium">{doctor.specialty}</Text>
            <Text className="text-slate-500 text-sm mt-1">{doctor.hospitalNameEn}</Text>
            <Text className="text-slate-400 text-xs mt-1">
              {t('doctors.bmdc_reg')} {doctor.bmdcReg} · ★ {doctor.ratingAvg} ({doctor.reviewCount})
            </Text>
          </View>
        </Card>

        <Card className="p-5 gap-4">
          <View className="flex-row justify-between">
            <Text className="text-slate-500">{t('doctors.consultation_fee')}</Text>
            <Text className="font-semibold text-slate-800">৳{doctor.consultationFee}</Text>
          </View>
          {doctor.telemedicineAvailable && (
            <View className="flex-row justify-between">
              <Text className="text-slate-500">{t('doctors.telemedicine_fee')}</Text>
              <Text className="font-semibold text-slate-800">৳{doctor.telemedicineFee}</Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-slate-500">{t('doctors.available_days')}</Text>
            <Text className="font-semibold text-slate-800">{doctor.availableDays.join(', ')}</Text>
          </View>
        </Card>

        <Card className="p-5 flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-semibold text-slate-800">{t('doctor_portal.availability')}</Text>
            <Text className="text-slate-500 text-xs mt-0.5">{t('doctor_portal.available_for_booking')}</Text>
          </View>
          <Switch
            value={doctor.isAvailable}
            onValueChange={toggleAvailability}
            disabled={saving}
            trackColor={{ true: '#0D9488', false: '#CBD5E1' }}
            thumbColor="#fff"
          />
        </Card>

        <Button title={t('auth.logout')} onPress={() => signOut()} variant="secondary" fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}
