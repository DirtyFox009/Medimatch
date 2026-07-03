import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../services/firebase/auth';
import { showAlert } from '../../utils/alert';

export interface ShellNavItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

interface DesktopShellProps {
  items: ShellNavItem[];
  activeKey: string;
  title: string;
  /** Patient app is blue; doctor portal is teal. */
  accent?: 'blue' | 'teal';
  showEmergency?: boolean;
  children: React.ReactNode;
}

const ACCENT = {
  blue: { text: 'text-primary-600', bg: 'bg-primary-50', hex: '#2563EB' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-50', hex: '#0D9488' },
};

function LanguagePill() {
  const { i18n: i18nHook } = useTranslation();
  const isEn = i18nHook.language === 'en';
  return (
    <TouchableOpacity
      onPress={() => i18n.changeLanguage(isEn ? 'bn' : 'en')}
      className="rounded-full border border-slate-200 bg-white px-3 py-1.5"
    >
      <Text className="text-sm font-medium text-slate-700">{isEn ? 'EN/বাং' : 'বাং/EN'}</Text>
    </TouchableOpacity>
  );
}

/**
 * Sidebar (240px) + top bar (76px) web shell, matching the Figma desktop
 * frames. Rendered only when useIsDesktop() is true.
 */
export function DesktopShell({
  items,
  activeKey,
  title,
  accent = 'blue',
  showEmergency = true,
  children,
}: DesktopShellProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { appUser, user } = useAuth();
  const colors = ACCENT[accent];
  const initial = (appUser?.displayName ?? user?.displayName ?? 'U').charAt(0).toUpperCase();

  const confirmLogout = () => {
    showAlert(t('auth.logout'), t('auth.logout_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View className="flex-1 flex-row bg-slate-50">
      {/* Sidebar */}
      <View
        className="w-60 border-r border-slate-200 bg-white px-4 py-7"
        style={Platform.select({ web: { boxShadow: '1px 0 4px rgba(0,0,0,0.03)' }, default: {} })}
      >
        <View className="flex-row items-center gap-3 px-1 pb-10">
          <View className={`h-9 w-9 items-center justify-center rounded-xl ${accent === 'teal' ? 'bg-teal-500' : 'bg-primary-500'}`}>
            <Ionicons name="medkit" size={20} color="#fff" />
          </View>
          <Text className="text-lg font-bold text-slate-800">MediMatch</Text>
        </View>

        <View className="gap-2">
          {items.map((item) => {
            const active = item.key === activeKey;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => router.push(item.route as any)}
                className={`h-11 flex-row items-center gap-4 rounded-xl px-4 ${active ? colors.bg : ''}`}
              >
                <Ionicons name={item.icon} size={18} color={active ? colors.hex : '#64748B'} />
                <Text className={`font-medium ${active ? colors.text : 'text-slate-600'}`}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-1" />

        {showEmergency && (
          <TouchableOpacity
            onPress={() => router.push('/emergency')}
            className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-100"
          >
            <Ionicons name="warning" size={16} color="#DC2626" />
            <Text className="font-semibold text-red-600">{t('home.emergency')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main column */}
      <View className="flex-1">
        <View className="h-[76px] flex-row items-center justify-between border-b border-slate-200 bg-white px-8">
          <Text className="text-xl font-bold text-slate-800">{title}</Text>
          <View className="flex-row items-center gap-4">
            <LanguagePill />
            <TouchableOpacity
              onPress={confirmLogout}
              className="flex-row items-center gap-1.5 rounded-full border border-slate-200 px-2 py-1"
            >
              <View className={`h-8 w-8 items-center justify-center rounded-full ${accent === 'teal' ? 'bg-teal-500' : 'bg-primary-500'}`}>
                <Text className="text-sm font-bold text-white">{initial}</Text>
              </View>
              <Ionicons name="log-out-outline" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-1">{children}</View>
      </View>
    </View>
  );
}
