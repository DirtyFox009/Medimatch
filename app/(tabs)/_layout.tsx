import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import i18n from '../../src/i18n';

function LanguageToggle() {
  const { i18n: i18nHook } = useTranslation();
  const isEn = i18nHook.language === 'en';
  return (
    <TouchableOpacity
      onPress={() => i18n.changeLanguage(isEn ? 'bn' : 'en')}
      className="mr-4 bg-slate-100 rounded-full px-3 py-1"
    >
      <Text className="text-slate-700 font-medium text-sm">{isEn ? 'বাং' : 'EN'}</Text>
    </TouchableOpacity>
  );
}

function EmergencyButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/emergency')}
      className="mr-2 bg-red-600 rounded-full w-8 h-8 items-center justify-center"
    >
      <Ionicons name="alert-circle" size={18} color="#fff" />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 4 },
        headerRight: () => (
          <View className="flex-row items-center">
            <EmergencyButton />
            <LanguageToggle />
          </View>
        ),
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', color: '#1E293B' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('nav.chat'),
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: t('nav.doctors'),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('nav.appointments'),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: t('nav.records'),
          tabBarIcon: ({ color, size }) => <Ionicons name="folder" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
