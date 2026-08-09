import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../hooks/useNotifications';

/** Header bell with an unread badge. Tapping opens the notification list. */
export function NotificationBell({ tint = '#475569' }: { tint?: string }) {
  const router = useRouter();
  const { unread } = useNotifications();

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      className="mr-2 bg-slate-100 rounded-full w-8 h-8 items-center justify-center"
      accessibilityLabel="Notifications"
    >
      <Ionicons name="notifications-outline" size={18} color={tint} />
      {unread > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 px-1 items-center justify-center">
          <Text className="text-white text-[10px] font-bold">{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
