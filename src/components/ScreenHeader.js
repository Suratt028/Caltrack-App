import React from 'react';
import { View, Text } from 'react-native';
import styles from '../style/components/ScreenHeaderStyles';

/**
 * Consistent screen title block used by every top-level screen so headings,
 * subtitles and optional right-side content line up across the app.
 */
export default function ScreenHeader({ title, subtitle, right, children }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.titleWrap}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {!!right && <View style={styles.right}>{right}</View>}
      </View>
      {children}
    </View>
  );
}
