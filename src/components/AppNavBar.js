import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { confirmAction } from '../utils/confirm';
import styles from '../style/components/AppNavBarStyles';

// Tab metadata: label, and outline / filled icon pair.
export const NAV_ITEMS = {
  Home: { label: 'หน้าหลัก', icon: ['home-outline', 'home'] },
  Log: { label: 'บันทึกอาหาร', icon: ['add-circle-outline', 'add-circle'] },
  Trends: { label: 'แนวโน้ม', icon: ['stats-chart-outline', 'stats-chart'] },
  Profile: { label: 'โปรไฟล์', icon: ['person-outline', 'person'] },
};

function useTabPress(state, navigation) {
  return (route, focused) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };
}

function Brand({ compact = false }) {
  return (
    <View style={styles.brand} accessibilityRole="header">
      <View style={styles.brandMark}>
        <Ionicons name="leaf-outline" size={compact ? 18 : 20} color={colors.white} />
      </View>
      <Text style={styles.brandText}>CalTrack</Text>
    </View>
  );
}

function ProfileChip({ onPress, focused }) {
  const { profile, user } = useApp();
  const name = profile?.displayName || user?.displayName || 'โปรไฟล์';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`โปรไฟล์ ${name}`}
      accessibilityState={{ selected: focused }}
      style={({ pressed }) => [styles.profileChip, focused && styles.profileChipActive, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={18} color={colors.primary} />
      </View>
      <Text style={styles.profileName} numberOfLines={1}>{name}</Text>
    </Pressable>
  );
}

/** Phone: bottom tab bar with four destinations. */
function BottomBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const onPress = useTabPress(state, navigation);
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const item = NAV_ITEMS[route.name];
        if (!item) return null;
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => onPress(route, focused)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [styles.bottomItem, pressed && styles.pressed]}
          >
            <View style={[styles.bottomIcon, focused && styles.bottomIconActive]}>
              <Ionicons
                name={focused ? item.icon[1] : item.icon[0]}
                size={22}
                color={focused ? colors.primaryDark : colors.inkMuted}
              />
            </View>
            <Text style={[styles.bottomLabel, focused && styles.bottomLabelActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Tablet: top bar — brand, primary links, profile chip. */
function TopBar({ state, navigation }) {
  const onPress = useTabPress(state, navigation);
  const profileIndex = state.routes.findIndex((route) => route.name === 'Profile');
  return (
    <View style={styles.topBar} accessibilityRole="tablist">
      <Brand compact />
      <View style={styles.topLinks}>
        {state.routes.map((route, index) => {
          const item = NAV_ITEMS[route.name];
          if (!item || route.name === 'Profile') return null;
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              onPress={() => onPress(route, focused)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              style={({ pressed }) => [styles.topLink, focused && styles.topLinkActive, pressed && styles.pressed]}
            >
              <Text style={[styles.topLinkText, focused && styles.topLinkTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {profileIndex >= 0 && (
        <ProfileChip
          focused={state.index === profileIndex}
          onPress={() => onPress(state.routes[profileIndex], state.index === profileIndex)}
        />
      )}
    </View>
  );
}

/**
 * Desktop: full-width header above the side navigation — brand, tagline and
 * an account menu (profile / sign out). Rendered outside the tab navigator,
 * so it gets the stack navigation and opens the Profile tab through it.
 */
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
    <View style={styles.desktopTop}>
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

/** Desktop: left side navigation (the brand lives in DesktopTopBar). */
function SideBar({ state, navigation }) {
  const onPress = useTabPress(state, navigation);
  return (
    <View style={styles.sideBar}>
      <View style={styles.sideItems} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const item = NAV_ITEMS[route.name];
          if (!item) return null;
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              onPress={() => onPress(route, focused)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={item.label}
              style={({ pressed }) => [styles.sideItem, focused && styles.sideItemActive, pressed && styles.pressed]}
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
        <Text style={styles.sideNoteTitle}>ดูแลตัวเอง{'\n'}ทีละมื้อก็พอ</Text>
        <Text style={styles.sideNoteBody}>ไม่มีวันที่ต้องสมบูรณ์แบบ เริ่มจากสิ่งที่สะดวกสำหรับคุณได้เลย</Text>
      </View>
    </View>
  );
}

/** Custom tab bar that switches shape with the layout (see theme/layout). */
export default function AppNavBar({ layout, ...props }) {
  if (layout === 'desktop') return <SideBar {...props} />;
  if (layout === 'tablet') return <TopBar {...props} />;
  return <BottomBar {...props} />;
}
