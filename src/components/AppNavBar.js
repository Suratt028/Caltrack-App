import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
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

/** Desktop: left side navigation. */
function SideBar({ state, navigation }) {
  const onPress = useTabPress(state, navigation);
  return (
    <View style={styles.sideBar}>
      <View style={styles.sideBrand}>
        <Brand />
      </View>
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
