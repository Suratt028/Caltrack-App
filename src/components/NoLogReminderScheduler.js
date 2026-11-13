import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useFoodLogs } from '../data/useUserData';
import { remindersSupported, rescheduleNoLogReminders } from '../services/reminderService';

/**
 * Renders nothing. While signed in, keeps the week's "nothing logged yet"
 * reminders in step with the food log, and opens the Log tab when one is tapped.
 */
export default function NoLogReminderScheduler() {
  const { logsByDay } = useFoodLogs();
  const navigation = useNavigation();
  const asked = useRef(false);

  // Key on which days have entries so unrelated edits don't reschedule.
  const loggedDays = Object.keys(logsByDay || {})
    .filter((key) => (logsByDay[key] || []).length > 0)
    .sort()
    .join(',');

  useEffect(() => {
    if (!remindersSupported) return;
    const ask = !asked.current;
    asked.current = true;
    rescheduleNoLogReminders(logsByDay, { ask }).catch((error) =>
      console.warn('No-log reminders could not be scheduled:', error?.message)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedDays]);

  useEffect(() => {
    if (!remindersSupported) return undefined;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response?.notification?.request?.content?.data?.screen === 'Log') {
        navigation.navigate('Tabs', { screen: 'Log' });
      }
    });
    return () => sub.remove();
  }, [navigation]);

  return null;
}
