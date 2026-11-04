import React, { forwardRef } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentMaxWidth, useLayout } from '../theme/layout';
import styles from '../style/components/ScreenStyles';

/**
 * Page scaffold shared by every app screen: safe area, scrolling, the
 * responsive gutter and a centred content column.
 *
 * variant "dashboard" grows with the layout (Home, Trends); "flow" stays a
 * readable single column (Log, Portion, Scan).
 */
const Screen = forwardRef(function Screen(
  { children, variant = 'dashboard', scroll = true, contentStyle, keyboardShouldPersistTaps = 'handled', footer },
  ref
) {
  const { layout, gutter } = useLayout();
  const maxWidth = variant === 'flow' ? contentMaxWidth.flow : contentMaxWidth[layout];
  const column = [styles.column, { maxWidth, paddingHorizontal: gutter }, contentStyle];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? (
        <ScrollView
          ref={ref}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
        >
          <View style={column}>{children}</View>
        </ScrollView>
      ) : (
        <View style={column}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
});

export default Screen;
