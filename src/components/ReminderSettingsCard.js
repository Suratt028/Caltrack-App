import React, { useEffect, useState } from 'react';
import { View, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import Card from './Card';
import { colors } from '../theme/colors';
import { useFoodLogs } from '../data/useUserData';
import {
  getReminderEnabled,
  remindersSupported,
  rescheduleNoLogReminders,
  setReminderEnabled,
} from '../services/reminderService';
import { REMINDER_HOUR } from '../utils/noLogReminder';
import styles from '../style/components/ReminderSettingsCardStyles';

/** Profile card: turn the evening "nothing logged yet" reminder on or off. */
export default function ReminderSettingsCard({ style }) {
  const { logsByDay } = useFoodLogs();
  const [enabled, setEnabled] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getReminderEnabled().then(setEnabled);
  }, []);

  const toggle = async (next) => {
    setBusy(true);
    setEnabled(next);
    await setReminderEnabled(next);
    try {
      const result = await rescheduleNoLogReminders(logsByDay, { ask: next });
      setDenied(next && result.reason === 'denied');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={style}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>แจ้งเตือนเมื่อยังไม่ได้บันทึก</Text>
          <Text style={styles.subtitle}>
            {remindersSupported
              ? `เตือนเวลา ${REMINDER_HOUR}:00 เฉพาะวันที่ยังไม่มีบันทึกอาหาร`
              : 'ใช้ได้บนแอปมือถือ (iOS / Android)'}
          </Text>
        </View>
        <Switch
          value={remindersSupported && enabled}
          onValueChange={toggle}
          disabled={!remindersSupported || busy}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
          accessibilityLabel="แจ้งเตือนเมื่อยังไม่ได้บันทึกอาหาร"
        />
      </View>
      {denied && (
        <Text style={styles.denied} onPress={() => Linking.openSettings()}>
          ยังไม่ได้อนุญาตการแจ้งเตือน แตะเพื่อเปิดการตั้งค่า
        </Text>
      )}
    </Card>
  );
}
