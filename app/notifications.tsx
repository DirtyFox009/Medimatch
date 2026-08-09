import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../src/components/ui/Card';
import { ResponsiveContainer } from '../src/components/layout/ResponsiveContainer';
import { useNotifications } from '../src/hooks/useNotifications';
import { formatAppointmentDate } from '../src/utils/formatDate';
import type { NotificationKind } from '../src/utils/notifications';

const ICONS: Record<NotificationKind, { name: string; color: string; bg: string }> = {
  new_booking: { name: 'calendar', color: '#0D9488', bg: 'bg-teal-100' },
  confirmed: { name: 'checkmark-circle', color: '#16A34A', bg: 'bg-green-100' },
  cancelled: { name: 'close-circle', color: '#EF4444', bg: 'bg-red-100' },
  completed: { name: 'clipboard', color: '#64748B', bg: 'bg-slate-100' },
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items, markSeen } = useNotifications();

  // Opening the list is what marks it read.
  useEffect(() => {
    markSeen();
  }, [markSeen]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ResponsiveContainer>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <View className="items-center py-20 gap-2">
              <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
              <Text className="text-slate-400">{t('notifications.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const icon = ICONS[item.kind];
            return (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/appointments')}
                activeOpacity={0.7}
              >
                <Card
                  className={`p-4 flex-row items-start gap-3 ${item.unread ? 'border-l-4 border-l-primary-500' : ''}`}
                >
                  <View className={`w-10 h-10 rounded-xl items-center justify-center ${icon.bg}`}>
                    <Ionicons name={icon.name as any} size={20} color={icon.color} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className={`text-sm text-slate-800 ${item.unread ? 'font-bold' : 'font-semibold'}`}>
                      {t(`notifications.${item.kind}`, { name: item.personName })}
                    </Text>
                    <Text className="text-slate-500 text-xs">
                      {formatAppointmentDate(item.date)} · {item.timeSlot}
                    </Text>
                  </View>
                  {item.unread && <View className="w-2 h-2 rounded-full bg-primary-500 mt-1.5" />}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
