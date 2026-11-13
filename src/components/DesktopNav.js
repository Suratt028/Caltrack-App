import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { confirmAction } from '../utils/confirm';
import styles from '../style/components/DesktopNavStyles';

// Desktop web shell from the Figma "Desktop web home / trends" frames:
// a full-width top bar (brand · tagline · account menu) above a left side nav.

export const DESKTOP_NAV_ITEMS = {
  Home: { label: 'หน้าหลัก', icon: ['home-outline', 'home'] },
  Log: { label: 'บันทึกอาหาร', icon: ['add-circle-outline', 'add-circle'] },
  Scan: { label: 'สแกนอาหารด้วย AI', icon: ['scan-outline', 'scan'] },
  Trends: { label: 'แนวโน้ม', icon: ['stats-chart-outline', 'stats-chart'] },
  Profile: { label: 'โปรไฟล์', icon: ['person-outline', 'person'] },
};

function Brand() {
  return (
    <View style={styles.brand} accessibilityRole="header">
      <View style={styles.brandMark}>
        <Ionicons name="leaf-outline" size={20} color={colors.white} />
      </View>
      <Text style={styles.brandText}>CalTrack</Text>
    </View>
  );
}

/** Full-width header: brand, tagline, and an account menu (profile / sign out). */
export function DesktopTopBar({ onOpenProfile }) {
  const { profile, user, logout } = useApp();
  const [open, setOpen] = useState(false);
  const name = profile?.displayName || user?.displayName || 'บัญชีของฉัน';

  const signOut = () => {
    setOpen(false);
    confirmAction({
      title: 'ออกจากระบบ?',
      message: 'ข้อมูลที่บันทึกไว้ในบัญชีจะยังอยู่ เข้าสู่ระบบอีกครั้งเมื่อไหร่ก็ได้',
      confirmLabel: 'ออกจากระบบ',
      onConfirm: logout,
    });
  };

  return (
    <View style={styles.topBar}>
      <Brand />
      <Text style={styles.tagline} numberOfLines={1}>เพื่อนดูแลโภชนาการในทุกวันของคุณ</Text>
      <View style={styles.menuAnchor}>
        <Pressable
          onPress={() => setOpen((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={`เมนูบัญชี ${name}`}
          accessibilityState={{ expanded: open }}
          style={({ pressed }) => [styles.profileChip, open && styles.profileChipActive, pressed && styles.pressed]}
        >
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.profileName} numberOfLines={1}>{name}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.ink} />
        </Pressable>
        {open && (
          <View style={styles.menu} accessibilityRole="menu">
            <Pressable
              onPress={() => {
                setOpen(false);
                onOpenProfile();
              }}
              accessibilityRole="menuitem"
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <Ionicons name="person-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.menuText}>โปรไฟล์และเป้าหมาย</Text>
            </Pressable>
            <Pressable
              onPress={signOut}
              accessibilityRole="menuitem"
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.menuText}>ออกจากระบบ</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

/** Left side navigation; used as the tab bar on desktop web. */
export function DesktopSideBar({ state, navigation }) {
  return (
    <View style={styles.sideBar}>
      <View style={styles.sideItems} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const item = DESKTOP_NAV_ITEMS[route.name];
          if (!item) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={item.label}
              style={({ pressed, hovered }) => [
                styles.sideItem,
                hovered && !focused && styles.sideItemHover,
                focused && styles.sideItemActive,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={focused ? item.icon[1] : item.icon[0]}
                size={20}
                color={focused ? colors.primaryDark : colors.inkMuted}
              />
              <Text style={[styles.sideLabel, focused && styles.sideLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.sideNote}>
        <Ionicons name="leaf-outline" size={22} color={colors.primary} />
        <Text style={styles.sideNoteTitle}>{'ดูแลตัวเอง\nทีละมื้อก็พอ'}</Text>
        <Text style={styles.sideNoteBody}>ไม่มีวันที่ต้องสมบูรณ์แบบ เริ่มจากสิ่งที่สะดวกสำหรับคุณได้เลย</Text>
      </View>
    </View>
  );
}
