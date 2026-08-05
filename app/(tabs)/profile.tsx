import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { DateField } from '../../src/components/ui/DateField';
import { GenderChips } from '../../src/components/ui/GenderChips';
import { SelectField } from '../../src/components/ui/SelectField';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import { updateUserProfile } from '../../src/services/firebase/auth';
import { useAuth } from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/store/authStore';
import { showAlert } from '../../src/utils/alert';
import { ageFromDob, formatDob } from '../../src/utils/formatDate';
import { BD_DIVISIONS } from '../../src/constants/divisions';
import type { Gender } from '../../src/types/user';

const DIVISION_NAMES = BD_DIVISIONS.map((d) => d.nameEn);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text className="text-slate-500">{label}</Text>
      <Text className="font-semibold text-slate-800 flex-1 text-right" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function PatientProfileScreen() {
  const { t } = useTranslation();
  const { appUser } = useAuth();
  const setAppUser = useAuthStore((s) => s.setAppUser);
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('');

  const startEditing = () => {
    if (!appUser) return;
    setDisplayName(appUser.displayName ?? '');
    setDateOfBirth(appUser.dateOfBirth ?? '');
    setGender(appUser.gender ?? '');
    setPhone(appUser.phone ?? '');
    setDivision(appUser.division ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!appUser) return;
    if (!displayName.trim()) {
      showAlert(t('common.error'), t('auth.full_name'));
      return;
    }
    // A birth date is optional here (legacy accounts may leave it blank), but a
    // typo must never reach the prescription form as a bogus age.
    if (dateOfBirth && ageFromDob(dateOfBirth) === null) {
      showAlert(t('common.error'), t('auth.dob_invalid'));
      return;
    }

    const patch = {
      displayName: displayName.trim(),
      dateOfBirth: dateOfBirth || null,
      gender: (gender || null) as Gender | null,
      phone: phone.trim() || null,
      division,
    };

    setSaving(true);
    try {
      await updateUserProfile(appUser.uid, patch);
      // Keep the in-memory profile in step; useAuthListener only refetches on
      // an auth-state change, so without this the UI would lag until re-login.
      setAppUser({ ...appUser, ...patch });
      setEditing(false);
      showAlert(t('profile.updated'));
    } catch {
      showAlert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (!appUser) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-400">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  const age = ageFromDob(appUser.dateOfBirth);
  const incomplete = !appUser.dateOfBirth || !appUser.gender;
  const dobDisplay = appUser.dateOfBirth
    ? `${formatDob(appUser.dateOfBirth)}${age !== null ? ` · ${age} ${t('profile.years')}` : ''}`
    : '—';

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ResponsiveContainer>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Card className="p-5 items-center gap-3">
            <Avatar name={appUser.displayName || appUser.email} size={80} />
            <View className="items-center">
              <Text className="text-xl font-bold text-slate-800">{appUser.displayName}</Text>
              <Text className="text-slate-500 text-sm mt-0.5">{appUser.email}</Text>
            </View>
          </Card>

          {incomplete && !editing && (
            <View className="flex-row items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Ionicons name="information-circle-outline" size={18} color="#B45309" />
              <Text className="flex-1 text-sm text-amber-800">{t('profile.incomplete')}</Text>
            </View>
          )}

          {editing ? (
            <Card className="p-5 gap-4">
              <Text className="font-semibold text-slate-800">{t('profile.personal_info')}</Text>
              <Input label={t('auth.full_name')} value={displayName} onChangeText={setDisplayName} />
              <DateField
                label={t('auth.date_of_birth')}
                value={dateOfBirth}
                onChange={setDateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
              />
              <GenderChips label={t('auth.gender')} value={gender} onChange={setGender} />
              <Input
                label={t('profile.phone')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="01XXXXXXXXX"
              />
              <View className="gap-1">
                <Text className="text-sm font-medium text-slate-700">{t('profile.division')}</Text>
                <SelectField
                  value={division}
                  options={DIVISION_NAMES}
                  placeholder={t('common.any')}
                  onChange={setDivision}
                />
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button title={t('common.cancel')} variant="secondary" onPress={() => setEditing(false)} fullWidth />
                </View>
                <View className="flex-1">
                  <Button title={t('common.save')} onPress={handleSave} loading={saving} fullWidth />
                </View>
              </View>
            </Card>
          ) : (
            <Card className="p-5 gap-4">
              <Text className="font-semibold text-slate-800">{t('profile.personal_info')}</Text>
              <Row label={t('auth.date_of_birth')} value={dobDisplay} />
              <Row
                label={t('auth.gender')}
                value={appUser.gender ? t(`prescriptions.gender_${appUser.gender}`) : '—'}
              />
              <Row label={t('profile.phone')} value={appUser.phone || '—'} />
              <Row label={t('profile.division')} value={appUser.division || '—'} />
              <Text className="text-xs text-slate-400">{t('profile.shared_with_doctor')}</Text>
              <Button title={t('profile.edit')} variant="secondary" onPress={startEditing} fullWidth />
            </Card>
          )}
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
