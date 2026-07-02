import React from 'react';
import { Platform, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useDoctors } from '../../src/hooks/useDoctors';
import { useIsDesktop } from '../../src/hooks/useIsDesktop';
import { VerifyEmailBanner } from '../../src/components/ui/VerifyEmailBanner';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import { Avatar } from '../../src/components/ui/Avatar';
import { StarRating } from '../../src/components/doctors/StarRating';
import { SPECIALTIES } from '../../src/constants/specialties';
import type { Doctor } from '../../src/types/doctor';

interface QuickAction {
  key: string;
  icon: string;
  color: string;
  bg: string;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'check_symptoms', icon: 'chatbubble-ellipses', color: '#2563EB', bg: '#DBEAFE', route: '/(tabs)/chat' },
  { key: 'find_doctors', icon: 'people', color: '#0D9488', bg: '#CCFBF1', route: '/(tabs)/doctors' },
  { key: 'my_appointments', icon: 'calendar', color: '#7C3AED', bg: '#EDE9FE', route: '/(tabs)/appointments' },
  { key: 'emergency', icon: 'alert-circle', color: '#DC2626', bg: '#FEE2E2', route: '/emergency' },
];

const cardShadow = Platform.select({
  web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' },
  default: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
});

function TopDoctorRow({ doctor }: { doctor: Doctor }) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      onPress={() => router.push(`/doctor/${doctor.id}`)}
      className="flex-row items-center gap-4 rounded-2xl bg-white p-4"
      style={cardShadow}
      activeOpacity={0.85}
    >
      <Avatar uri={doctor.avatarUrl} name={doctor.nameEn} size={64} />
      <View className="flex-1 gap-0.5">
        <Text className="font-bold text-slate-800">{doctor.nameEn}</Text>
        <Text className="text-sm text-slate-500">{doctor.specialty}</Text>
        <StarRating rating={doctor.ratingAvg} size={13} />
      </View>
      <View className="items-end">
        <Text className="font-bold text-slate-800">৳{doctor.consultationFee}</Text>
        <Text className="text-xs text-slate-400">{t('home.per_visit')}</Text>
      </View>
    </TouchableOpacity>
  );
}

function TopDoctorGridCard({ doctor }: { doctor: Doctor }) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View className="flex-1 min-w-[300px] rounded-2xl bg-white p-5" style={cardShadow}>
      <View className="flex-row items-center gap-4">
        <Avatar uri={doctor.avatarUrl} name={doctor.nameEn} size={64} />
        <View className="flex-1 gap-0.5">
          <Text className="font-bold text-slate-800">{doctor.nameEn}</Text>
          <Text className="text-sm text-slate-500">{doctor.specialty}</Text>
          <StarRating rating={doctor.ratingAvg} size={13} />
        </View>
      </View>
      <View className="mt-4 flex-row items-center justify-between">
        <Text className="font-semibold text-slate-700">৳{doctor.consultationFee} / {t('home.per_visit')}</Text>
        <TouchableOpacity
          onPress={() => router.push(`/doctor/${doctor.id}`)}
          className="rounded-xl bg-primary-500 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">{t('common.book_now')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const isBn = i18n.language === 'bn';
  const { appUser, user } = useAuth();
  const { doctors } = useDoctors({});
  const topDoctors = doctors.slice(0, 3);
  const name = appUser?.displayName ?? user?.displayName ?? 'there';
  const initial = name.charAt(0).toUpperCase();

  const searchBar = (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/doctors')}
      className="h-[52px] flex-row items-center gap-3 rounded-xl bg-white px-4"
      style={cardShadow}
      activeOpacity={0.8}
    >
      <Ionicons name="search" size={18} color="#94A3B8" />
      <Text className="text-slate-400">{t('home.search_placeholder')}</Text>
    </TouchableOpacity>
  );

  const aiCheckerBanner = (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/chat')}
      className="flex-row items-center justify-between rounded-2xl bg-primary-500 p-5"
      style={cardShadow}
      activeOpacity={0.9}
    >
      <View className="flex-1 pr-4">
        <Text className="text-base font-bold text-white">{t('home.ai_checker_title')}</Text>
        <Text className="mt-1 text-sm text-primary-100">{t('home.ai_checker_sub')}</Text>
      </View>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
        <Ionicons name="sparkles" size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  const specialtyChips = (
    <View className="gap-3">
      <Text className="text-base font-bold text-slate-800">{t('home.specialties')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2.5 pr-6">
          {SPECIALTIES.slice(0, 8).map((s) => (
            <TouchableOpacity
              key={s.value}
              onPress={() => router.push({ pathname: '/(tabs)/doctors', params: { specialty: s.value } })}
              className="h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4"
            >
              <Text className="text-sm font-medium text-slate-600">{isBn ? s.labelBn : s.labelEn}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const quickActions = (
    <View className="rounded-2xl bg-white p-4" style={cardShadow}>
      <Text className="mb-3 text-sm font-semibold text-slate-500">{t('home.quick_actions')}</Text>
      <View className="flex-row flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.key}
            onPress={() => router.push(action.route as any)}
            className={`items-center rounded-xl py-4 gap-2 ${isDesktop ? 'flex-1' : 'flex-1 min-w-[40%]'}`}
            style={{ backgroundColor: action.bg }}
            activeOpacity={0.8}
          >
            <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: action.color + '20' }}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text className="text-center text-sm font-medium" style={{ color: action.color }}>
              {t(`home.${action.key}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── Desktop layout (Figma frame 9:2) ──────────────────────────────────────
  if (isDesktop) {
    return (
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <ResponsiveContainer>
          <View className="gap-6 px-8 py-8">
            <VerifyEmailBanner />
            {/* Hero banner */}
            <View className="rounded-2xl bg-primary-500 px-8 py-8" style={cardShadow}>
              <Text className="text-sm text-primary-100">{t('home.greeting', { name })} 👋</Text>
              <Text className="mt-2 text-3xl font-bold text-white">{t('home.hero_tagline')}</Text>
            </View>

            {quickActions}
            {aiCheckerBanner}

            <View className="gap-4">
              <Text className="text-lg font-bold text-slate-800">{t('home.top_doctors')}</Text>
              <View className="flex-row flex-wrap gap-6">
                {topDoctors.map((d) => (
                  <TopDoctorGridCard key={d.id} doctor={d} />
                ))}
              </View>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    );
  }

  // ── Mobile layout (Figma frame 4:3) ───────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VerifyEmailBanner />

        {/* Greeting header */}
        <View className="flex-row items-center justify-between px-6 pt-5 pb-1">
          <View>
            <Text className="text-xl font-bold text-slate-800">{t('home.greeting', { name })}</Text>
            <Text className="mt-0.5 text-sm text-slate-500">{t('home.how_feeling')}</Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-500">
            <Text className="text-base font-bold text-white">{initial}</Text>
          </View>
        </View>

        <View className="gap-5 px-6 pt-4 pb-8">
          {searchBar}
          {aiCheckerBanner}
          {specialtyChips}

          <View className="gap-3">
            <Text className="text-base font-bold text-slate-800">{t('home.top_doctors')}</Text>
            {topDoctors.map((d) => (
              <TopDoctorRow key={d.id} doctor={d} />
            ))}
          </View>

          {/* Medicine Reminder shortcut */}
          <TouchableOpacity
            onPress={() => router.push('/medicines')}
            className="flex-row items-center gap-3 rounded-2xl bg-white p-4"
            style={cardShadow}
            activeOpacity={0.8}
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Ionicons name="alarm" size={20} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-slate-800">{t('medicines.title')}</Text>
              <Text className="text-xs text-slate-500">{t('medicines.add_reminder')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
