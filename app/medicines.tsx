import React, { useState, useEffect } from 'react';
import { Platform, View, Text, FlatList, TouchableOpacity, Modal, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
// Conditionally required so Metro excludes expo-notifications from the web bundle —
// the web polyfill fires unsupported-API warnings at import time.
const Notifications =
  Platform.OS !== 'web'
    ? (require('expo-notifications') as typeof import('expo-notifications'))
    : null;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { getUserMedicines, saveMedicine, updateMedicine, deleteMedicine } from '../src/services/firebase/firestore';
import { useAuth } from '../src/hooks/useAuth';
import { showAlert } from '../src/utils/alert';
import type { MedicineReminder, ReminderFrequency } from '../src/types/medicine';

const FREQUENCY_OPTIONS: { value: ReminderFrequency; times: string[] }[] = [
  { value: 'daily', times: ['08:00'] },
  { value: 'twice_daily', times: ['08:00', '20:00'] },
  { value: 'thrice_daily', times: ['08:00', '14:00', '20:00'] },
  { value: 'weekly', times: ['09:00'] },
  { value: 'custom', times: [] },
];

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseCustomTimes(input: string): string[] | null {
  const times = input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (times.length === 0 || times.some((v) => !TIME_RE.test(v))) return null;
  // Normalise "8:00" → "08:00" so display and scheduling stay consistent.
  return times.map((v) => (v.length === 4 ? `0${v}` : v));
}

async function scheduleMedicineNotifications(
  medicineName: string,
  times: string[],
): Promise<string[]> {
  if (!Notifications) return [];
  const ids: string[] = [];
  for (const time of times) {
    const [hour, minute] = time.split(':').map(Number);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medicine Reminder',
        body: `Time to take ${medicineName}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    ids.push(id);
  }
  return ids;
}

async function cancelMedicineNotifications(ids: string[]): Promise<void> {
  if (!Notifications) return;
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

export default function MedicinesScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<MedicineReminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<ReminderFrequency>('daily');
  const [customTimes, setCustomTimes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserMedicines(user.uid).then(async (meds) => {
      // Reminders past their end date are deactivated on load — DAILY triggers
      // have no native end date, so this is where expiry is enforced.
      const today = new Date().toISOString().split('T')[0];
      const expired = meds.filter((m) => m.isActive && m.endDate && m.endDate < today);
      for (const m of expired) {
        await cancelMedicineNotifications(m.notificationIds);
        await updateMedicine(user.uid, m.id, { isActive: false, notificationIds: [] });
      }
      setMedicines(
        meds.map((m) =>
          expired.some((e) => e.id === m.id) ? { ...m, isActive: false, notificationIds: [] } : m,
        ),
      );
    });
  }, [user]);

  const openModal = () => {
    setName('');
    setDosage('');
    setFrequency('daily');
    setCustomTimes('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;

    let times: string[];
    if (frequency === 'custom') {
      const parsed = parseCustomTimes(customTimes);
      if (!parsed) {
        showAlert(t('medicines.invalid_times'), t('medicines.times_hint'));
        return;
      }
      times = parsed;
    } else {
      times = FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.times ?? ['08:00'];
    }

    const start = startDate.trim() || new Date().toISOString().split('T')[0];
    const end = endDate.trim() || null;
    if (!DATE_RE.test(start) || (end && (!DATE_RE.test(end) || end < start))) {
      showAlert(t('medicines.invalid_dates'));
      return;
    }

    setSaving(true);
    try {
      const status = Notifications ? (await Notifications.requestPermissionsAsync()).status : 'undetermined';
      const notificationIds = status === 'granted' ? await scheduleMedicineNotifications(name, times) : [];

      const data = {
        userId: user.uid,
        medicineName: name,
        dosage,
        frequency,
        times,
        startDate: start,
        endDate: end,
        notes: '',
        isActive: true,
        notificationIds,
      };
      const id = await saveMedicine(user.uid, data);
      setMedicines((prev) => [{ id, ...data, createdAt: new Date() }, ...prev]);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (med: MedicineReminder) => {
    if (!user) return;
    showAlert(t('common.delete'), t('medicines.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await cancelMedicineNotifications(med.notificationIds);
          await deleteMedicine(user.uid, med.id);
          setMedicines((prev) => prev.filter((m) => m.id !== med.id));
        },
      },
    ]);
  };

  const handleToggle = async (med: MedicineReminder) => {
    if (!user) return;
    if (med.isActive) {
      await cancelMedicineNotifications(med.notificationIds);
      await updateMedicine(user.uid, med.id, { isActive: false, notificationIds: [] });
      setMedicines((prev) => prev.map((m) => m.id === med.id ? { ...m, isActive: false, notificationIds: [] } : m));
    } else {
      const ids = await scheduleMedicineNotifications(med.medicineName, med.times);
      await updateMedicine(user.uid, med.id, { isActive: true, notificationIds: ids });
      setMedicines((prev) => prev.map((m) => m.id === med.id ? { ...m, isActive: true, notificationIds: ids } : m));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <FlatList
        data={medicines}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <Button title={t('medicines.add_reminder')} onPress={openModal} fullWidth className="mb-4" />
        }
        ListEmptyComponent={
          <View className="items-center py-16 gap-3">
            <Ionicons name="alarm-outline" size={48} color="#CBD5E1" />
            <Text className="text-slate-400">{t('medicines.no_medicines')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="p-4 gap-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 gap-0.5">
                <Text className="font-bold text-slate-800">{item.medicineName}</Text>
                {item.dosage ? <Text className="text-slate-500 text-sm">{item.dosage}</Text> : null}
                <Text className="text-slate-400 text-xs capitalize">{item.frequency.replace('_', ' ')} — {item.times.join(', ')}</Text>
                <Text className="text-slate-400 text-xs">
                  {item.startDate}{item.endDate ? ` → ${item.endDate}` : ''}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Switch
                  value={item.isActive}
                  onValueChange={() => handleToggle(item)}
                  trackColor={{ true: '#0D9488' }}
                />
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />

      {/* Add modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
            <Text className="text-lg font-bold text-slate-800">{t('medicines.add_reminder')}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <Input label={t('medicines.medicine_name')} placeholder="e.g. Paracetamol" value={name} onChangeText={setName} />
            <Input label={t('medicines.dosage')} placeholder="e.g. 500mg" value={dosage} onChangeText={setDosage} />

            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700">{t('medicines.frequency')}</Text>
              {FREQUENCY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setFrequency(opt.value)}
                  className={`flex-row items-center justify-between border rounded-xl px-4 py-3 ${frequency === opt.value ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white'}`}
                >
                  <Text className={`font-medium ${frequency === opt.value ? 'text-primary-700' : 'text-slate-600'}`}>
                    {t(`medicines.${opt.value}`)}
                  </Text>
                  <Text className="text-slate-400 text-xs">{opt.times.join(', ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {frequency === 'custom' && (
              <Input
                label={t('medicines.reminder_times')}
                placeholder={t('medicines.times_hint')}
                value={customTimes}
                onChangeText={setCustomTimes}
                autoCapitalize="none"
              />
            )}

            <Input
              label={t('medicines.start_date')}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
            />
            <Input
              label={t('medicines.end_date')}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
            />

            <Button title={t('common.save')} onPress={handleSave} loading={saving} fullWidth size="lg" />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
