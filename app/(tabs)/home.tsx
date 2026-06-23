import React from 'react';
import { Platform, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';

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

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { appUser, user } = useAuth();
  const name = appUser?.displayName ?? user?.displayName ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="bg-primary-500 px-6 pt-6 pb-10">
          <Text className="text-primary-100 text-sm mb-1">{t('home.greeting', { name })}</Text>
          <Text className="text-white text-2xl font-bold">{t('tagline')}</Text>
        </View>

        <View className="px-4 -mt-5 gap-4">
          {/* Quick Actions */}
          <View className="bg-white rounded-2xl p-4 shadow-sm" style={Platform.select({ web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.08)' }, default: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } } })}>
            <Text className="text-sm font-semibold text-slate-500 mb-3">{t('home.quick_actions')}</Text>
            <View className="flex-row flex-wrap gap-3">
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  onPress={() => router.push(action.route as any)}
                  className="flex-1 min-w-[40%] items-center rounded-xl py-4 gap-2"
                  style={{ backgroundColor: action.bg }}
                  activeOpacity={0.8}
                >
                  <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: action.color + '20' }}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text className="text-sm font-medium text-center" style={{ color: action.color }}>
                    {t(`home.${action.key}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medicine Reminder shortcut */}
          <TouchableOpacity
            onPress={() => router.push('/medicines')}
            className="bg-white rounded-2xl p-4 flex-row items-center gap-3 shadow-sm"
            style={Platform.select({ web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' }, default: { elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } } })}
            activeOpacity={0.8}
          >
            <View className="w-10 h-10 rounded-xl bg-amber-100 items-center justify-center">
              <Ionicons name="alarm" size={20} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-slate-800">{t('medicines.title')}</Text>
              <Text className="text-slate-500 text-xs">{t('medicines.add_reminder')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
