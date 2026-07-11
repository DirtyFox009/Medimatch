import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { getDoctor, updateDoctorAvailability, updateDoctorProfile } from '../../src/services/firebase/firestore';
import { signOut } from '../../src/services/firebase/auth';
import { useAuth } from '../../src/hooks/useAuth';
import { showAlert } from '../../src/utils/alert';
import type { Doctor } from '../../src/types/doctor';

// Bangladeshi working week starts on Saturday.
const WEEK_DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const { appUser } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [hospitalEn, setHospitalEn] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [telemedicineFee, setTelemedicineFee] = useState('');
  const [telemedicineAvailable, setTelemedicineAvailable] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  useEffect(() => {
    if (appUser?.doctorId) {
      getDoctor(appUser.doctorId).then(setDoctor);
    }
  }, [appUser?.doctorId]);

  const startEditing = () => {
    if (!doctor) return;
    setHospitalEn(doctor.hospitalNameEn);
    setQualifications(doctor.qualifications.join(', '));
    setConsultationFee(String(doctor.consultationFee));
    setTelemedicineFee(String(doctor.telemedicineFee));
    setTelemedicineAvailable(doctor.telemedicineAvailable);
    setAvailableDays([...doctor.availableDays]);
    setEditing(true);
  };

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSaveProfile = async () => {
    if (!doctor) return;
    const consultation = Number(consultationFee);
    const telemedicine = Number(telemedicineFee);
    if (!Number.isFinite(consultation) || consultation < 0 || !Number.isFinite(telemedicine) || telemedicine < 0) {
      showAlert(t('common.error'), t('doctors.consultation_fee'));
      return;
    }

    const data = {
      hospitalNameEn: hospitalEn.trim() || doctor.hospitalNameEn,
      qualifications: qualifications
        .split(',')
        .map((q) => q.trim())
        .filter(Boolean),
      consultationFee: consultation,
      telemedicineFee: telemedicine,
      telemedicineAvailable,
      // Keep chip order stable regardless of tap order.
      availableDays: WEEK_DAYS.filter((d) => availableDays.includes(d)),
    };

    setSaving(true);
    try {
      await updateDoctorProfile(doctor.id, data);
      setDoctor({ ...doctor, ...data });
      setEditing(false);
      showAlert(t('doctor_portal.profile_updated'));
    } catch {
      showAlert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (value: boolean) => {
    if (!doctor) return;
    setSaving(true);
    setDoctor({ ...doctor, isAvailable: value });
    try {
      await updateDoctorAvailability(doctor.id, value);
    } catch {
      setDoctor({ ...doctor, isAvailable: !value });
      showAlert(t('common.error'));
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
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
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

        {editing ? (
          <Card className="p-5 gap-4">
            <Text className="font-semibold text-slate-800">{t('doctor_portal.edit_profile')}</Text>
            <Input
              label={t('records.hospital_name')}
              value={hospitalEn}
              onChangeText={setHospitalEn}
            />
            <Input
              label={t('doctors.qualifications')}
              placeholder={t('doctor_portal.qualifications_hint')}
              value={qualifications}
              onChangeText={setQualifications}
            />
            <Input
              label={t('doctors.consultation_fee')}
              keyboardType="numeric"
              value={consultationFee}
              onChangeText={setConsultationFee}
            />
            <Input
              label={t('doctors.telemedicine_fee')}
              keyboardType="numeric"
              value={telemedicineFee}
              onChangeText={setTelemedicineFee}
            />
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-600">{t('booking.telemedicine')}</Text>
              <Switch
                value={telemedicineAvailable}
                onValueChange={setTelemedicineAvailable}
                trackColor={{ true: '#0D9488' }}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700">{t('doctors.available_days')}</Text>
              <View className="flex-row flex-wrap gap-2">
                {WEEK_DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full border ${availableDays.includes(day) ? 'bg-teal-600 border-teal-600' : 'border-slate-200 bg-white'}`}
                  >
                    <Text className={`text-sm font-medium ${availableDays.includes(day) ? 'text-white' : 'text-slate-600'}`}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title={t('common.cancel')} variant="secondary" onPress={() => setEditing(false)} fullWidth />
              </View>
              <View className="flex-1">
                <Button title={t('common.save')} onPress={handleSaveProfile} loading={saving} fullWidth />
              </View>
            </View>
          </Card>
        ) : (
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
            <View className="flex-row justify-between">
              <Text className="text-slate-500">{t('doctors.qualifications')}</Text>
              <Text className="font-semibold text-slate-800 flex-1 text-right" numberOfLines={2}>
                {doctor.qualifications.join(', ')}
              </Text>
            </View>
            <Button title={t('doctor_portal.edit_profile')} variant="secondary" onPress={startEditing} fullWidth />
          </Card>
        )}

        <Card className="p-5 flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-semibold text-slate-800">{t('doctor_portal.availability')}</Text>
            <Text className="text-slate-500 text-xs mt-0.5">{t('doctor_portal.available_for_booking')}</Text>
          </View>
          <Switch
            value={doctor.isAvailable}
            onValueChange={toggleAvailability}
            disabled={saving || editing}
            trackColor={{ true: '#0D9488', false: '#CBD5E1' }}
            thumbColor="#fff"
          />
        </Card>

        <Button title={t('auth.logout')} onPress={() => signOut()} variant="secondary" fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}
