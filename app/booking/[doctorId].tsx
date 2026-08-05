import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { useDoctorLive } from '../../src/hooks/useDoctors';
import { useAuth } from '../../src/hooks/useAuth';
import { bookAppointment, subscribeBookedSlotsRange } from '../../src/services/firebase/firestore';
import { scheduleAppointmentReminder } from '../../src/services/notifications/appointmentReminders';
import { getAvailableDates, formatAppointmentDate, todayISO } from '../../src/utils/formatDate';
import { bookableSlots, slotsForDate } from '../../src/utils/capacity';
import { showAlert } from '../../src/utils/alert';
import { useChatStore } from '../../src/store/chatStore';
import type { AppointmentType, AppointmentStatus } from '../../src/types/appointment';

function randomRoomId(): string {
  const bytes = Crypto.getRandomBytes(12);
  return 'mm-' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function BookingScreen() {
  const { doctorId, type: initialType } = useLocalSearchParams<{ doctorId: string; type?: string }>();
  // Live, so a doctor lowering today's limit shrinks the grid under an open screen.
  const { doctor, loading } = useDoctorLive(doctorId);
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { triageResult, suggestedSpecialty } = useChatStore();

  const [apptType, setApptType] = useState<AppointmentType>(
    initialType === 'telemedicine' ? 'telemedicine' : 'in-person',
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedByDate, setBookedByDate] = useState<Record<string, string[]>>({});
  const [attachSymptoms, setAttachSymptoms] = useState(!!triageResult);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookedStatus, setBookedStatus] = useState<AppointmentStatus>('confirmed');

  const doctorDays = doctor?.availableDays;
  const candidateDates = useMemo(
    () => (doctorDays ? getAvailableDates(doctorDays, 14) : []),
    [doctorDays],
  );

  // One range subscription covers the whole date strip, so a fully-booked day can
  // be marked up front and switching dates never shows the previous date's slots.
  useEffect(() => {
    if (!doctor || candidateDates.length === 0) return;
    const unsubscribe = subscribeBookedSlotsRange(
      doctor.id,
      candidateDates[0],
      candidateDates[candidateDates.length - 1],
      setBookedByDate,
      (e) => console.error('[booking] slot subscription failed:', e),
    );
    return unsubscribe;
  }, [doctor?.id, candidateDates]);

  // Slots left per date, after the capacity limit, existing bookings, and (for
  // today) the slots that have already passed.
  const openByDate = useMemo(() => {
    const now = new Date();
    const map: Record<string, string[]> = {};
    candidateDates.forEach((date) => {
      map[date] = bookableSlots(doctor, date, bookedByDate[date] ?? [], now);
    });
    return map;
  }, [doctor, candidateDates, bookedByDate]);

  // Today disappears once its chamber hours are over — "Full" would misdescribe it.
  const availableDates = useMemo(
    () => candidateDates.filter((d) => d !== todayISO() || openByDate[d]?.length > 0),
    [candidateDates, openByDate],
  );

  const openSlots = selectedDate ? openByDate[selectedDate] ?? [] : [];
  const bookedSlots = selectedDate ? bookedByDate[selectedDate] ?? [] : [];

  // A slot picked for one date must not stay selected after switching dates.
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  const fee = doctor ? (apptType === 'telemedicine' ? doctor.telemedicineFee : doctor.consultationFee) : 0;

  const handleConfirm = async () => {
    if (!user || !doctor || !selectedDate || !selectedSlot) return;
    // The screen can sit open across the lead-time boundary.
    if (!openSlots.includes(selectedSlot)) {
      showAlert(t('common.error'), t('booking.slot_expired'));
      setSelectedSlot(null);
      return;
    }
    setConfirming(true);
    try {
      const { appointmentId, status } = await bookAppointment({
        patientId: user.uid,
        doctorId: doctor.id,
        doctorUserId: doctor.userId ?? null,
        doctorNameEn: doctor.nameEn,
        doctorNameBn: doctor.nameBn,
        specialty: doctor.specialty,
        hospitalNameEn: doctor.hospitalNameEn,
        date: selectedDate,
        timeSlot: selectedSlot,
        type: apptType,
        fee,
        // status is decided inside bookAppointment from the doctor's autoConfirm
        // setting, read transactionally — the client's copy may be stale.
        chatSummary: attachSymptoms && triageResult ? triageResult.recommendation : null,
        possibleConditions: attachSymptoms && triageResult ? triageResult.conditions : null,
        severity: attachSymptoms && triageResult ? triageResult.severity : null,
        notes: '',
        telemedicineRoomId: apptType === 'telemedicine' ? randomRoomId() : null,
      });
      // Best-effort local reminder 1h before the visit (no-op on web).
      scheduleAppointmentReminder(appointmentId, selectedDate, selectedSlot, doctor.nameEn);
      setBookedStatus(status);
      setConfirmed(true);
    } catch (e: any) {
      // The live slot and doctor subscriptions refresh availability automatically.
      if (e.message === 'SLOT_TAKEN') {
        showAlert(t('common.error'), t('booking.slot_taken'));
        setSelectedSlot(null);
      } else if (e.message === 'DAY_FULL') {
        showAlert(t('common.error'), t('booking.day_full'));
        setSelectedSlot(null);
      } else if (e.message === 'DOCTOR_UNAVAILABLE' || e.message === 'DOCTOR_NOT_FOUND') {
        showAlert(t('common.error'), t('booking.doctor_unavailable'));
      } else {
        showAlert(t('common.error'), t('booking.booking_failed'));
      }
    } finally {
      setConfirming(false);
    }
  };

  if (loading || !doctor) {
    return <View className="flex-1 bg-slate-50 items-center justify-center"><Text className="text-slate-400">{t('common.loading')}</Text></View>;
  }

  if (confirmed) {
    return (
      <SafeAreaView className="flex-1 bg-white px-6">
        <View className="flex-1 items-center justify-center gap-5 w-full md:max-w-md md:self-center">
          <View className={`w-24 h-24 rounded-full items-center justify-center ${bookedStatus === 'confirmed' ? 'bg-green-100' : 'bg-amber-100'}`}>
            <Ionicons
              name={bookedStatus === 'confirmed' ? 'checkmark' : 'time-outline'}
              size={52}
              color={bookedStatus === 'confirmed' ? '#16A34A' : '#D97706'}
            />
          </View>
          <Text className="text-2xl font-bold text-slate-800 text-center">
            {t(bookedStatus === 'confirmed' ? 'booking.booking_confirmed' : 'booking.booking_requested')}
          </Text>
          <Text className="text-slate-500 text-center -mt-2">
            {t(bookedStatus === 'confirmed' ? 'booking.reminder_note' : 'booking.awaiting_confirmation')}
          </Text>
          <Card className="w-full p-5 gap-4 mt-2">
            <View className="flex-row justify-between"><Text className="text-slate-500">{t('booking.summary_doctor')}</Text><Text className="font-semibold text-slate-800">{doctor.nameEn}</Text></View>
            <View className="flex-row justify-between"><Text className="text-slate-500">{t('booking.summary_specialty')}</Text><Text className="font-semibold text-slate-800">{doctor.specialty}</Text></View>
            <View className="flex-row justify-between"><Text className="text-slate-500">{t('booking.summary_date')}</Text><Text className="font-semibold text-slate-800">{selectedDate ? formatAppointmentDate(selectedDate) : ''}</Text></View>
            <View className="flex-row justify-between"><Text className="text-slate-500">{t('booking.summary_time')}</Text><Text className="font-semibold text-slate-800">{selectedSlot}</Text></View>
            <View className="flex-row justify-between border-t border-slate-100 pt-3"><Text className="font-bold text-slate-700">{t('booking.total_fee')}</Text><Text className="font-bold text-primary-600">৳{fee}</Text></View>
          </Card>
        </View>
        <View className="pb-8 gap-3 w-full md:max-w-md md:self-center">
          <Button title={t('booking.back_to_home')} onPress={() => router.replace('/(tabs)/home')} fullWidth size="lg" />
          <TouchableOpacity onPress={() => router.replace('/(tabs)/appointments')}>
            <Text className="text-primary-600 font-semibold text-center">{t('booking.view_appointments')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <View className="w-full max-w-[760px] flex-1 self-center">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Doctor summary */}
        <Card className="p-4 flex-row gap-3 items-center">
          <Avatar uri={doctor.avatarUrl} name={doctor.nameEn} size={48} />
          <View className="flex-1">
            <Text className="font-bold text-slate-800">{doctor.nameEn}</Text>
            <Text className="text-primary-600 text-sm">{doctor.specialty}</Text>
            <Text className="text-slate-500 text-xs">{doctor.hospitalNameEn}</Text>
          </View>
        </Card>

        {/* Appointment type */}
        {doctor.telemedicineAvailable && (
          <View className="gap-2">
            <Text className="font-semibold text-slate-700">{t('booking.appointment_type')}</Text>
            <View className="flex-row gap-3">
              {(['in-person', 'telemedicine'] as AppointmentType[]).map((typ) => (
                <TouchableOpacity
                  key={typ}
                  onPress={() => setApptType(typ)}
                  className={`flex-1 border-2 rounded-xl p-3 gap-1 ${apptType === typ ? (typ === 'telemedicine' ? 'border-teal-500 bg-teal-50' : 'border-primary-500 bg-primary-50') : 'border-slate-200 bg-white'}`}
                >
                  <Ionicons name={typ === 'telemedicine' ? 'videocam' : 'business'} size={20} color={apptType === typ ? (typ === 'telemedicine' ? '#0D9488' : '#2563EB') : '#94A3B8'} />
                  <Text className={`text-sm font-medium ${apptType === typ ? (typ === 'telemedicine' ? 'text-teal-700' : 'text-primary-700') : 'text-slate-500'}`}>
                    {t(`booking.${typ === 'telemedicine' ? 'telemedicine' : 'in_person'}`)}
                  </Text>
                  <Text className={`text-base font-bold ${apptType === typ ? (typ === 'telemedicine' ? 'text-teal-700' : 'text-primary-700') : 'text-slate-600'}`}>
                    ৳{typ === 'telemedicine' ? doctor.telemedicineFee : doctor.consultationFee}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Fee notice */}
        <View className="bg-amber-50 rounded-xl px-4 py-3 flex-row gap-2">
          <Ionicons name="information-circle" size={16} color="#D97706" />
          <Text className="text-amber-700 text-sm flex-1">
            {t(apptType === 'telemedicine' ? 'doctors.telemedicine_fee_note' : 'doctors.fee_before_booking', { fee })}
          </Text>
        </View>

        {/* Date selection */}
        <View className="gap-2">
          <Text className="font-semibold text-slate-700">{t('booking.select_date')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableDates.map((date) => {
              const left = openByDate[date]?.length ?? 0;
              const full = left === 0;
              const active = selectedDate === date;
              return (
                <TouchableOpacity
                  key={date}
                  disabled={full}
                  onPress={() => setSelectedDate(date)}
                  className={`mr-2 px-3 py-2 rounded-xl border items-center ${full ? 'bg-slate-100 border-slate-200' : active ? 'bg-primary-500 border-primary-500' : 'bg-white border-slate-200'}`}
                >
                  <Text className={`text-xs font-medium ${full ? 'text-slate-400' : active ? 'text-white' : 'text-slate-600'}`}>
                    {formatAppointmentDate(date)}
                  </Text>
                  <Text className={`text-[10px] mt-0.5 ${full ? 'text-slate-400' : active ? 'text-white/80' : 'text-slate-400'}`}>
                    {full ? t('booking.full') : t('booking.slots_left', { count: left })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {availableDates.length === 0 && (
            <Text className="text-slate-400 text-sm">{t('booking.no_dates_available')}</Text>
          )}
        </View>

        {/* Time slots */}
        {selectedDate && (
          <View className="gap-2">
            <Text className="font-semibold text-slate-700">{t('booking.select_time')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {slotsForDate(doctor, selectedDate).map((slot) => {
                // Unavailable either because someone booked it or because it has
                // already passed today — both render the same, disabled.
                const taken = bookedSlots.includes(slot);
                const disabled = !openSlots.includes(slot);
                return (
                  <TouchableOpacity
                    key={slot}
                    disabled={disabled}
                    onPress={() => setSelectedSlot(slot)}
                    className={`px-4 py-2 rounded-xl border ${disabled ? 'bg-slate-100 border-slate-200 opacity-50' : selectedSlot === slot ? 'bg-primary-500 border-primary-500' : 'bg-white border-slate-200'}`}
                  >
                    <Text className={`text-sm font-medium ${disabled ? 'text-slate-400' : selectedSlot === slot ? 'text-white' : 'text-slate-700'}`}>
                      {slot}
                    </Text>
                    {taken && <Text className="text-[10px] text-slate-400 text-center">{t('booking.taken')}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            {openSlots.length === 0 && (
              <Text className="text-slate-400 text-sm">{t('booking.no_slots_left')}</Text>
            )}
          </View>
        )}

        {/* Attach symptom summary */}
        {triageResult && (
          <TouchableOpacity
            className="flex-row items-center gap-3 bg-white border border-slate-200 rounded-xl p-4"
            onPress={() => setAttachSymptoms(!attachSymptoms)}
          >
            <View className={`w-5 h-5 rounded border-2 items-center justify-center ${attachSymptoms ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`}>
              {attachSymptoms && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <View className="flex-1">
              <Text className="font-medium text-slate-700 text-sm">{t('booking.attach_symptoms')}</Text>
              <Text className="text-slate-500 text-xs">Severity: {triageResult.severity}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* CTA */}
      <View className="bg-white px-4 py-4 border-t border-slate-100 gap-2">
        {selectedSlot && (
          <View className="flex-row justify-between items-center">
            <Text className="text-slate-600 text-sm">{t('booking.total_fee')}</Text>
            <Text className="text-xl font-bold text-primary-600">৳{fee}</Text>
          </View>
        )}
        <Button
          title={t('booking.confirm_booking')}
          onPress={handleConfirm}
          loading={confirming}
          disabled={!selectedDate || !selectedSlot}
          fullWidth
          size="lg"
        />
      </View>
      </View>
    </SafeAreaView>
  );
}
