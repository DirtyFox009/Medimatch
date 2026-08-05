import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { SelectField } from '../../src/components/ui/SelectField';
import { getDoctor, updateDoctorAvailability, updateDoctorProfile } from '../../src/services/firebase/firestore';
import { signOut } from '../../src/services/firebase/auth';
import { useAuth } from '../../src/hooks/useAuth';
import { showAlert } from '../../src/utils/alert';
import {
  readCapacity,
  generateSlots,
  formatHHMM,
  MAX_DAILY_PATIENTS,
} from '../../src/utils/capacity';
import type { Doctor } from '../../src/types/doctor';

// Bangladeshi working week starts on Saturday.
const WEEK_DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Half-hour chamber start options, 06:00 → 21:30.
const START_OPTIONS = Array.from({ length: 32 }, (_, i) => formatHHMM(6 * 60 + i * 30));
const DURATION_OPTIONS = ['10', '15', '20', '30', '45', '60'];

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

  // Chamber capacity — its own card and its own save.
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [chamberStart, setChamberStart] = useState('09:00');
  const [slotDuration, setSlotDuration] = useState('30');
  const [dailyLimit, setDailyLimit] = useState('');
  const [autoConfirm, setAutoConfirm] = useState(true);

  useEffect(() => {
    if (appUser?.doctorId) {
      getDoctor(appUser.doctorId).then(setDoctor);
    }
  }, [appUser?.doctorId]);

  const capacity = readCapacity(doctor);

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

  const startEditingCapacity = () => {
    if (!doctor) return;
    setChamberStart(capacity.chamberStart);
    setSlotDuration(String(capacity.slotDurationMins));
    setDailyLimit(String(capacity.dailyPatientLimit));
    setAutoConfirm(capacity.autoConfirm);
    setEditingCapacity(true);
  };

  // Live preview of the slots the current inputs would generate.
  const previewSlots = generateSlots(chamberStart, Number(slotDuration), Number(dailyLimit));

  const handleSaveCapacity = async () => {
    if (!doctor) return;
    const limit = Number(dailyLimit);
    const duration = Number(slotDuration);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_DAILY_PATIENTS) {
      showAlert(t('common.error'), t('doctor_portal.patients_per_day_invalid', { max: MAX_DAILY_PATIENTS }));
      return;
    }
    const timeSlots = generateSlots(chamberStart, duration, limit);
    if (timeSlots.length === 0) {
      showAlert(t('common.error'), t('doctor_portal.chamber_start_invalid'));
      return;
    }

    const data = {
      autoConfirm,
      chamberStart,
      slotDurationMins: duration,
      dailyPatientLimit: timeSlots.length,
      timeSlots,
    };
    setSaving(true);
    try {
      await updateDoctorProfile(doctor.id, data);
      setDoctor({ ...doctor, ...data });
      setEditingCapacity(false);
      showAlert(t('doctor_portal.profile_updated'));
    } catch {
      showAlert(t('common.error'));
    } finally {
      setSaving(false);
    }
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
    // With no working days a patient's booking screen has no dates to offer.
    if (availableDays.length === 0) {
      showAlert(t('common.error'), t('doctors.pick_a_day'));
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

        {/* Chamber & capacity — generates the slot grid patients book from. */}
        {editingCapacity ? (
          <Card className="p-5 gap-4">
            <Text className="font-semibold text-slate-800">{t('doctor_portal.capacity')}</Text>

            <View className="gap-1.5">
              <Text className="text-sm font-medium text-slate-700">{t('doctor_portal.chamber_start')}</Text>
              <SelectField value={chamberStart} options={START_OPTIONS} onChange={setChamberStart} />
            </View>

            <View className="gap-1.5">
              <Text className="text-sm font-medium text-slate-700">{t('doctor_portal.minutes_per_patient')}</Text>
              <SelectField value={slotDuration} options={DURATION_OPTIONS} onChange={setSlotDuration} />
            </View>

            <Input
              label={t('doctor_portal.patients_per_day')}
              keyboardType="numeric"
              value={dailyLimit}
              onChangeText={setDailyLimit}
            />

            <View className="bg-teal-50 rounded-xl px-4 py-3 gap-1">
              <Text className="text-teal-800 text-sm font-medium">
                {previewSlots.length > 0
                  ? t('doctor_portal.slot_preview', {
                      count: previewSlots.length,
                      first: previewSlots[0],
                      last: previewSlots[previewSlots.length - 1],
                    })
                  : t('doctor_portal.chamber_start_invalid')}
              </Text>
              {previewSlots.length > 0 && (
                <Text className="text-teal-700 text-xs">
                  {previewSlots.slice(0, 6).join(' · ')}
                  {previewSlots.length > 6 ? ' …' : ''}
                </Text>
              )}
            </View>

            <Text className="text-slate-500 text-xs">{t('doctor_portal.regenerate_warning')}</Text>

            <View className="flex-row items-center justify-between border-t border-slate-100 pt-4">
              <View className="flex-1 pr-4">
                <Text className="text-sm font-medium text-slate-700">{t('doctor_portal.auto_confirm')}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">{t('doctor_portal.auto_confirm_hint')}</Text>
              </View>
              <Switch value={autoConfirm} onValueChange={setAutoConfirm} trackColor={{ true: '#0D9488' }} />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title={t('common.cancel')} variant="secondary" onPress={() => setEditingCapacity(false)} fullWidth />
              </View>
              <View className="flex-1">
                <Button title={t('common.save')} onPress={handleSaveCapacity} loading={saving} fullWidth />
              </View>
            </View>
          </Card>
        ) : (
          <Card className="p-5 gap-4">
            <Text className="font-semibold text-slate-800">{t('doctor_portal.capacity')}</Text>
            <View className="flex-row justify-between">
              <Text className="text-slate-500">{t('doctor_portal.patients_per_day')}</Text>
              <Text className="font-semibold text-slate-800">{capacity.dailyPatientLimit}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-500">{t('doctor_portal.chamber_hours')}</Text>
              <Text className="font-semibold text-slate-800">
                {doctor.timeSlots.length > 0
                  ? `${doctor.timeSlots[0]} – ${doctor.timeSlots[doctor.timeSlots.length - 1]}`
                  : '—'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-500">{t('doctor_portal.minutes_per_patient')}</Text>
              <Text className="font-semibold text-slate-800">{capacity.slotDurationMins}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-500">{t('doctor_portal.auto_confirm')}</Text>
              <View className={`px-2.5 py-1 rounded-full ${capacity.autoConfirm ? 'bg-green-100' : 'bg-amber-100'}`}>
                <Text className={`text-xs font-semibold ${capacity.autoConfirm ? 'text-green-700' : 'text-amber-700'}`}>
                  {t(capacity.autoConfirm ? 'common.on' : 'common.off')}
                </Text>
              </View>
            </View>
            <Button title={t('doctor_portal.edit_capacity')} variant="secondary" onPress={startEditingCapacity} fullWidth />
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
            disabled={saving || editing || editingCapacity}
            trackColor={{ true: '#0D9488', false: '#CBD5E1' }}
            thumbColor="#fff"
          />
        </Card>

        <Button title={t('auth.logout')} onPress={() => signOut()} variant="secondary" fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}
