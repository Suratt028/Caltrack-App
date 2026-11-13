import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import styles from '../style/components/NoticeCardStyles';

// One scheduled notice from the admin (planned maintenance, app update, news).
const KIND_STYLE = {
  maintenance: { icon: 'construct-outline', label: 'ปิดปรับปรุงระบบ', tint: colors.turmericDark, soft: colors.turmericSoft },
  update: { icon: 'rocket-outline', label: 'อัปเดตแอป', tint: colors.skyDark, soft: colors.skySoft },
  info: { icon: 'megaphone-outline', label: 'ข่าวสาร', tint: colors.primary, soft: colors.mint },
};

const sameDay = (a, b) => a.toDateString() === b.toDateString();
const time = (d) => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
const day = (d) => d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });

/** "ศ. 20 พ.ย. 22:00–23:00" or a two-day range. */
export function noticeWindow(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return sameDay(start, end)
    ? `${day(start)} ${time(start)}–${time(end)} น.`
    : `${day(start)} ${time(start)} – ${day(end)} ${time(end)} น.`;
}

export default function NoticeCard({ notice, onDismiss, style }) {
  const kind = KIND_STYLE[notice.kind] || KIND_STYLE.info;
  const live = notice.status === 'live';
  return (
    <View
      style={[styles.card, { backgroundColor: kind.soft, borderColor: kind.tint }, style]}
      accessibilityRole="alert"
      accessibilityLabel={`${kind.label}: ${notice.title}. ${noticeWindow(notice.startsAt, notice.endsAt)}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name={kind.icon} size={20} color={kind.tint} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.kind, { color: kind.tint }]}>{live ? `${kind.label} · กำลังดำเนินการ` : kind.label}</Text>
        <Text style={styles.title}>{notice.title}</Text>
        {!!notice.message && <Text style={styles.message}>{notice.message}</Text>}
        <View style={styles.whenRow}>
          <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
          <Text style={styles.when}>{noticeWindow(notice.startsAt, notice.endsAt)}</Text>
        </View>
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="ปิดประกาศนี้"
          style={styles.close}
        >
          <Ionicons name="close" size={18} color={colors.inkMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
