import React from 'react';
import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, Text } from 'react-native';
import i18n from '../../src/i18n';
import { DesktopShell, type ShellNavItem } from '../../src/components/layout/DesktopShell';
import { useIsDesktop } from '../../src/hooks/useIsDesktop';

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

// Teal accent visually distinguishes the doctor portal from the patient app.
export default function DoctorLayout() {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const segments = useSegments();
  const activeTab = (segments[1] as string) ?? 'appointments';

  const navItems: ShellNavItem[] = [
    { key: 'appointments', label: t('doctor_portal.dashboard'), icon: 'calendar', route: '/(doctor)/appointments' },
    { key: 'profile', label: t('doctor_portal.profile'), icon: 'person', route: '/(doctor)/profile' },
  ];

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: !isDesktop,
        tabBarActiveTintColor: '#0D9488',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: isDesktop
          ? { display: 'none' }
          : { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 4 },
        headerRight: () => <LanguageToggle />,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', color: '#1E293B' },
      }}
    >
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('doctor_portal.dashboard'),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('doctor_portal.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );

  if (!isDesktop) return tabs;

  return (
    <DesktopShell
      items={navItems}
      activeKey={activeTab}
      title={activeTab === 'profile' ? t('doctor_portal.profile') : t('doctor_portal.dashboard')}
      accent="teal"
      showEmergency={false}
    >
      {tabs}
    </DesktopShell>
  );
}
