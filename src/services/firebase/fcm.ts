import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

// Conditionally required so Metro excludes expo-notifications from the web
// bundle — the web polyfill fires unsupported-API warnings at import time.
const Notifications =
  Platform.OS !== 'web'
    ? (require('expo-notifications') as typeof import('expo-notifications'))
    : null;

/**
 * Stores the device's Expo push token on the user profile. Remote push needs
 * a dev/EAS build (it's unavailable in Expo Go since SDK 53) and a sender
 * backend, so today this is future-proofing — callers must treat failures as
 * non-fatal.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!Notifications) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await updateDoc(doc(db, 'users', userId), { fcmToken: token });
}

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
