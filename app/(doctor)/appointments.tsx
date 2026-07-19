import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import {
  subscribeDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} from '../../src/services/firebase/firestore';
import { useAuth } from '../../src/hooks/useAuth';
import { useDoctorPrescriptions } from '../../src/hooks/usePrescriptions';
import { showAlert } from '../../src/utils/alert';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import { formatAppointmentDate } from '../../src/utils/formatDate';
import type { Appointment } from '../../src/types/appointment';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-green-600',
  pending: 'text-amber-600',
  cancelled: 'text-red-500',
  completed: 'text-slate-500',
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function PrescriptionButton({
  hasPrescription,
  appointmentId,
}: {
  hasPrescription: boolean;
  appointmentId: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  return hasPrescription ? (
    <TouchableOpacity
      onPress={() => router.push(`/prescription/${appointmentId}`)}
      className="border border-teal-500 rounded-lg px-3 py-2 flex-row items-center gap-1"
    >
      <Ionicons name="document-text-outline" size={12} color="#0D9488" />
      <Text className="text-teal-600 text-xs font-semibold">{t('prescriptions.view')}</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      onPress={() => router.push(`/prescription/new?appointmentId=${appointmentId}`)}
      className="bg-teal-600 rounded-lg px-3 py-2 flex-row items-center gap-1"
    >
      <Ionicons name="document-text" size={12} color="#fff" />
      <Text className="text-white text-xs font-semibold">{t('prescriptions.write')}</Text>
    </TouchableOpacity>
  );
}

export default function DoctorAppointmentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { byAppointmentId } = useDoctorPrescriptions();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeDoctorAppointments(user.uid, setAppointments);
    return unsubscribe;
  }, [user]);

  const sections = useMemo(() => {
    const today = todayStr();
    const active = (a: Appointment) => a.status === 'pending' || a.status === 'confirmed';
    const todayList = appointments.filter((a) => active(a) && a.date === today);
    const upcomingList = appointments.filter((a) => active(a) && a.date > today);
    const pastList = appointments.filter((a) => !active(a) || a.date < today);
    return [
      { title: t('doctor_portal.today'), data: todayList, emptyKey: 'no_appointments_today' },
      { title: t('doctor_portal.upcoming'), data: upcomingList },
      { title: t('doctor_portal.past'), data: pastList },
    ].filter((s) => s.data.length > 0 || s.emptyKey);
  }, [appointments, t]);

  const act = async (fn: () => Promise<void>, id: string) => {
    setBusyId(id);
    try {
      await fn();
    } catch {
      showAlert(t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (appointment: Appointment) => {
    showAlert(t('appointments.cancel_appointment'), t('appointments.cancel_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => act(() => cancelAppointment(appointment), appointment.id),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ResponsiveContainer>
      <SectionList
        sections={sections}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View className="pt-2 pb-1 flex-row items-center justify-between">
            <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">{section.title}</Text>
            {section.data.length === 0 && section.emptyKey && (
              <Text className="text-xs text-slate-400">{t(`doctor_portal.${section.emptyKey}`)}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text className="text-slate-400 mt-3">{t('appointments.no_appointments')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="p-4 gap-3 mb-1">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold text-slate-800 text-base">{formatAppointmentDate(item.date)}</Text>
                  <Text className="text-slate-600">{item.timeSlot}</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Ionicons
                    name={item.type === 'telemedicine' ? 'videocam' : 'business'}
                    size={13}
                    color={item.type === 'telemedicine' ? '#0D9488' : '#64748B'}
                  />
                  <Text className="text-slate-500 text-xs">
                    {t(`booking.${item.type === 'telemedicine' ? 'telemedicine' : 'in_person'}`)} · ৳{item.fee}
                  </Text>
                </View>
              </View>
              <Text className={`text-xs font-semibold capitalize ${STATUS_COLORS[item.status]}`}>
                {t(`appointments.status_${item.status}`)}
              </Text>
            </View>

            {(item.severity || item.chatSummary) && (
              <View className="bg-slate-50 rounded-xl px-3 py-2 gap-1">
                {item.severity && (
                  <Text className="text-xs font-semibold text-slate-600">
                    {t('doctor_portal.severity')}: {item.severity}
                  </Text>
                )}
                {item.chatSummary && (
                  <Text className="text-xs text-slate-500">{item.chatSummary}</Text>
                )}
              </View>
            )}

            {(item.status === 'pending' || item.status === 'confirmed') && (
              <View className="flex-row gap-2 pt-2 border-t border-slate-100">
                {item.status === 'pending' && (
                  <TouchableOpacity
                    disabled={busyId === item.id}
                    onPress={() => act(() => updateAppointmentStatus(item.id, 'confirmed'), item.id)}
                    className="bg-teal-500 rounded-lg px-3 py-2"
                  >
                    <Text className="text-white text-xs font-semibold">{t('doctor_portal.confirm')}</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'confirmed' && (
                  <>
                    {item.type === 'telemedicine' && (
                      <TouchableOpacity
                        onPress={() => router.push(`/telemedicine/${item.id}`)}
                        className="bg-teal-500 rounded-lg px-3 py-2 flex-row items-center gap-1"
                      >
                        <Ionicons name="videocam" size={12} color="#fff" />
                        <Text className="text-white text-xs font-semibold">{t('doctor_portal.join_call')}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      disabled={busyId === item.id}
                      onPress={() => act(() => updateAppointmentStatus(item.id, 'completed'), item.id)}
                      className="bg-slate-700 rounded-lg px-3 py-2"
                    >
                      <Text className="text-white text-xs font-semibold">{t('doctor_portal.mark_complete')}</Text>
                    </TouchableOpacity>
                    <PrescriptionButton
                      hasPrescription={!!byAppointmentId[item.id]}
                      appointmentId={item.id}
                    />
                  </>
                )}
                <TouchableOpacity
                  disabled={busyId === item.id}
                  onPress={() => handleCancel(item)}
                  className="border border-red-300 rounded-lg px-3 py-2"
                >
                  <Text className="text-red-500 text-xs font-semibold">{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === 'completed' && (
              <View className="flex-row gap-2 pt-2 border-t border-slate-100">
                <PrescriptionButton
                  hasPrescription={!!byAppointmentId[item.id]}
                  appointmentId={item.id}
                />
              </View>
            )}
          </Card>
        )}
      />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
