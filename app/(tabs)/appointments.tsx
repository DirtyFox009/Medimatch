import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { SeverityBadge } from '../../src/components/ui/Badge';
import { subscribeUserAppointments, cancelAppointment, hasReviewed } from '../../src/services/firebase/firestore';
import { cancelAppointmentReminder } from '../../src/services/notifications/appointmentReminders';
import { ReviewModal } from '../../src/components/reviews/ReviewModal';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import { useAuth } from '../../src/hooks/useAuth';
import { formatAppointmentDate } from '../../src/utils/formatDate';
import type { Appointment } from '../../src/types/appointment';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-green-600',
  pending: 'text-amber-600',
  cancelled: 'text-red-500',
  completed: 'text-slate-500',
};

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);

  // Real-time: doctor confirmations/completions appear without a refresh.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeUserAppointments(user.uid, (data) => {
      setAppointments(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  // Check which completed appointments already have a review (id == appointment id).
  useEffect(() => {
    const unchecked = appointments.filter((a) => a.status === 'completed' && reviewed[a.id] === undefined);
    if (unchecked.length === 0) return;
    Promise.all(
      unchecked.map(async (a) => [a.id, await hasReviewed(a.doctorId, a.id)] as const),
    ).then((entries) => {
      setReviewed((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
  }, [appointments]);

  const upcoming = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  const past = appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled');
  const displayed = tab === 'upcoming' ? upcoming : past;

  const handleCancel = (appointment: Appointment) => {
    Alert.alert(
      t('appointments.cancel_appointment'),
      t('appointments.cancel_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await cancelAppointment(appointment);
            cancelAppointmentReminder(appointment.id);
            // Snapshot listener delivers the status change.
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ResponsiveContainer>
      {/* Tab toggle */}
      <View className="flex-row bg-white border-b border-slate-100 px-4">
        {(['upcoming', 'past'] as const).map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            onPress={() => setTab(tabKey)}
            className={`flex-1 py-3 items-center border-b-2 ${tab === tabKey ? 'border-primary-500' : 'border-transparent'}`}
          >
            <Text className={`font-medium ${tab === tabKey ? 'text-primary-600' : 'text-slate-500'}`}>
              {t(`appointments.${tabKey}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text className="text-slate-400 mt-3">{t('appointments.no_appointments')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="p-4 gap-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 gap-0.5">
                <Text className="font-bold text-slate-800 text-base">{item.doctorNameEn}</Text>
                <Text className="text-primary-600 text-sm">{item.specialty}</Text>
                <Text className="text-slate-500 text-xs">{item.hospitalNameEn}</Text>
              </View>
              <Text className={`text-xs font-semibold capitalize ${STATUS_COLORS[item.status]}`}>
                {t(`appointments.status_${item.status}`)}
              </Text>
            </View>

            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text className="text-slate-600 text-sm">{formatAppointmentDate(item.date)}</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text className="text-slate-600 text-sm">{item.timeSlot}</Text>
              </View>
              {item.type === 'telemedicine' && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="videocam" size={13} color="#0D9488" />
                  <Text className="text-teal-700 text-xs">Video</Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
              <Text className="text-slate-800 font-semibold">৳{item.fee}</Text>
              <View className="flex-row gap-2">
                {item.type === 'telemedicine' && item.status === 'confirmed' && (
                  <TouchableOpacity
                    onPress={() => router.push(`/telemedicine/${item.id}`)}
                    className="bg-teal-500 rounded-lg px-3 py-1.5"
                  >
                    <Text className="text-white text-xs font-medium">{t('appointments.join_telemedicine')}</Text>
                  </TouchableOpacity>
                )}
                {(item.status === 'confirmed' || item.status === 'pending') && (
                  <TouchableOpacity
                    onPress={() => handleCancel(item)}
                    className="border border-red-300 rounded-lg px-3 py-1.5"
                  >
                    <Text className="text-red-500 text-xs font-medium">{t('common.cancel')}</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'completed' && reviewed[item.id] === false && (
                  <TouchableOpacity
                    onPress={() => setReviewTarget(item)}
                    className="bg-amber-500 rounded-lg px-3 py-1.5 flex-row items-center gap-1"
                  >
                    <Ionicons name="star" size={12} color="#fff" />
                    <Text className="text-white text-xs font-medium">{t('reviews.rate_doctor')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Card>
        )}
      />

      <ReviewModal
        appointment={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmitted={(id) => setReviewed((prev) => ({ ...prev, [id]: true }))}
      />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
