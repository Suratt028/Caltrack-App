import React from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import IconButton from './IconButton';
import styles from '../style/components/ScreenHeaderStyles';

/**
 * Consistent screen title block used by every top-level screen so headings,
 * subtitles and optional right-side content line up across the app.
 * Pass `onBack` on flow screens to show the back button left of the title.
 */
export default function ScreenHeader({ title, subtitle, right, children, onBack, backHint }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {!!onBack && (
          <IconButton
            icon="arrow-back"
            onPress={onBack}
            accessibilityLabel="ย้อนกลับ"
            accessibilityHint={backHint}
            style={styles.back}
          />
        )}
        <View style={styles.titleWrap}>
          {!!title && (
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          )}
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {!!right && <View style={styles.right}>{right}</View>}
      </View>
      {children}
    </View>
  );
}
