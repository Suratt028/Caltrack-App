import React, { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import styles from '../style/components/SkeletonRowsStyles';

/**
 * Placeholder cards shown while a list loads, so the layout doesn't jump.
 * Announced once to screen readers via `label`.
 */
export default function SkeletonRows({ count = 3, label = 'กำลังโหลด' }) {
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0.55, duration: 650, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityLiveRegion="polite">
      {Array.from({ length: count }, (_, index) => (
        <Animated.View key={index} style={[styles.row, { opacity: pulse }]}>
          <View style={styles.tile} />
          <View style={styles.lines}>
            <View style={[styles.line, styles.lineWide]} />
            <View style={[styles.line, styles.lineShort]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
