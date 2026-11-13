import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { REMINDER_COPY, reminderTimes } from '../utils/noLogReminder';

// Local notifications only (no server): "nothing logged yet today" at 20:00.
// The web build has no notifications, so everything here is a no-op there.
const PREF_KEY = 'caltrack-no-log-reminder';
const REMINDER_TAG = 'no-log-reminder';
const CHANNEL_ID = 'daily-reminders';

export const remindersSupported = Platform.OS !== 'web';

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function getReminderEnabled() {
  try {
    const saved = await AsyncStorage.getItem(PREF_KEY);
    return saved == null ? true : saved === 'on';
  } catch {
    return true;
  }
}

export async function setReminderEnabled(enabled) {
  try {
    await AsyncStorage.setItem(PREF_KEY, enabled ? 'on' : 'off');
  } catch {
    // Not persisted; the choice still applies until the app restarts.
  }
}

/** Asks once; returns whether notifications are allowed. */
export async function ensureReminderPermission({ ask = true } = {}) {
  if (!remindersSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!ask || current.canAskAgain === false) return false;
  const next = await Notifications.requestPermissionsAsync();
  return Boolean(next.granted);
}

async function cancelOurReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content?.data?.tag === REMINDER_TAG)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}

/**
 * Replace our scheduled reminders with fresh ones for the coming week,
 * skipping days that already have food logged.
 */
export async function rescheduleNoLogReminders(logsByDay, { ask = true } = {}) {
  if (!remindersSupported) return { scheduled: 0, reason: 'web' };
  await cancelOurReminders();
  if (!(await getReminderEnabled())) return { scheduled: 0, reason: 'off' };
  if (!(await ensureReminderPermission({ ask }))) return { scheduled: 0, reason: 'denied' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'แจ้งเตือนบันทึกอาหาร',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const times = reminderTimes(logsByDay);
  await Promise.all(
    times.map((date) =>
      Notifications.scheduleNotificationAsync({
        content: { ...REMINDER_COPY, data: { tag: REMINDER_TAG, screen: 'Log' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
      })
    )
  );
  return { scheduled: times.length, reason: 'ok' };
}

export async function clearNoLogReminders() {
  if (remindersSupported) await cancelOurReminders();
}
