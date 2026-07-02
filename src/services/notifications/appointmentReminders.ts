import { Platform } from 'react-native';

// Conditionally required so Metro excludes expo-notifications from the web
// bundle — the web polyfill fires unsupported-API warnings at import time.
const Notifications =
  Platform.OS !== 'web'
    ? (require('expo-notifications') as typeof import('expo-notifications'))
    : null;

const REMINDER_LEAD_MS = 60 * 60 * 1000; // 1 hour before the appointment

function reminderIdentifier(appointmentId: string): string {
  return `appt-${appointmentId}`;
}

/**
 * Schedules a local notification 1 hour before the appointment. No-op on web,
 * for past dates, or when permission is denied — booking never fails because
 * of a reminder.
 */
export async function scheduleAppointmentReminder(
  appointmentId: string,
  date: string, // YYYY-MM-DD
  timeSlot: string, // HH:MM
  doctorName: string,
): Promise<void> {
  if (!Notifications) return;
  try {
    const fireAt = new Date(`${date}T${timeSlot}:00`).getTime() - REMINDER_LEAD_MS;
    if (Number.isNaN(fireAt) || fireAt <= Date.now()) return;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      identifier: reminderIdentifier(appointmentId),
      content: {
        title: 'Upcoming appointment',
        body: `${doctorName} — today at ${timeSlot}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
      },
    });
  } catch (e) {
    console.warn('[appointmentReminders] schedule failed:', e);
  }
}

export async function cancelAppointmentReminder(appointmentId: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderIdentifier(appointmentId));
  } catch {
    // Nothing scheduled — fine.
  }
}
