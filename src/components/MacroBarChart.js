import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';
import styles from '../style/components/MacroBarChartStyles';

const CHART_HEIGHT = 190;
const PAD = { top: 10, right: 8, bottom: 26, left: 36 };
const MIN_CHART_WIDTH = 240;

const MACROS = [
  { key: 'protein', label: 'โปรตีน', color: colors.protein },
  { key: 'carbs', label: 'คาร์บ', color: colors.carbs },
  { key: 'fat', label: 'ไขมัน', color: colors.fat },
];

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');
const dayNumber = (key) => String(Number(String(key).slice(8, 10)) || 0);

/** Round up to a friendly axis maximum in grams (multiples of 50). */
const niceMax = (values) => {
  const max = Math.max(0, ...values);
  return max <= 0 ? 50 : Math.ceil(max / 50) * 50;
};

/**
 * Grouped bars per logged day: protein / carbs / fat in grams, with a legend
 * (name + colour, never colour alone) and a text alternative for screen
 * readers. Only days that have data are drawn — missing days are not zeros.
 * data: [{ date: 'YYYY-MM-DD', protein, carbs, fat, partial? }]
 */
export default function MacroBarChart({ data = [] }) {
  const [width, setWidth] = useState(0);

  const values = data.flatMap((day) => MACROS.map((macro) => Number(day[macro.key]) || 0));
  const maxY = niceMax(values);
  const plotW = Math.max((width || MIN_CHART_WIDTH) - PAD.left - PAD.right, 60);
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(14, (slot * 0.66) / MACROS.length));
  const gap = barW * 0.3;
  const y = (value) => PAD.top + plotH - (Math.min(value, maxY) / maxY) * plotH;
  const ticks = [0, maxY / 2, maxY];
  const labelEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1;

  const onLayout = (event) => {
    const next = Math.round(event?.nativeEvent?.layout?.width || 0);
    if (next > 0 && Math.abs(next - width) > 1) setWidth(Math.max(next, MIN_CHART_WIDTH));
  };

  const altText = data.length
    ? data
        .map(
          (day) =>
            `วันที่ ${dayNumber(day.date)}: โปรตีน ${formatNumber(day.protein)} คาร์บ ${formatNumber(day.carbs)} ไขมัน ${formatNumber(day.fat)} กรัม`
        )
        .join(' · ')
    : 'ไม่มีข้อมูลในช่วงนี้';

  return (
    <View style={styles.wrap}>
      <View style={styles.legend}>
        {MACROS.map((macro) => (
          <View key={macro.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: macro.color }]} />
            <Text style={styles.legendText}>{macro.label}</Text>
          </View>
        ))}
        <Text style={styles.legendText}>กรัม</Text>
      </View>
      <View
        onLayout={onLayout}
        style={styles.canvas}
        accessible
        accessibilityRole="image"
        accessibilityLabel="กราฟสารอาหารในแต่ละวัน หน่วยกรัม"
      >
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {ticks.map((tick) => (
              <React.Fragment key={`tick-${tick}`}>
                <Line x1={PAD.left} y1={y(tick)} x2={width - PAD.right} y2={y(tick)} stroke={colors.border} strokeWidth={1} />
                <SvgText x={PAD.left - 6} y={y(tick) + 4} fontSize={10} fill={colors.inkMuted} textAnchor="end">
                  {formatNumber(tick)}
                </SvgText>
              </React.Fragment>
            ))}
            {data.map((day, i) => {
              const cx = PAD.left + slot * i + slot / 2;
              const groupW = MACROS.length * barW + (MACROS.length - 1) * gap;
              return (
                <React.Fragment key={day.date}>
                  {MACROS.map((macro, m) => {
                    const value = Number(day[macro.key]) || 0;
                    const x = cx - groupW / 2 + m * (barW + gap);
                    return (
                      <Rect
                        key={macro.key}
                        x={x}
                        y={y(value)}
                        width={barW}
                        height={Math.max(1, PAD.top + plotH - y(value))}
                        rx={2}
                        fill={macro.color}
                      />
                    );
                  })}
                  {(i % labelEvery === 0 || i === data.length - 1) && (
                    <SvgText
                      x={cx}
                      y={CHART_HEIGHT - 8}
                      fontSize={10}
                      fontWeight={day.partial ? '700' : '400'}
                      fill={day.partial ? colors.primaryDark : colors.inkMuted}
                      textAnchor="middle"
                    >
                      {dayNumber(day.date)}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </View>
      <Text style={styles.srOnly} accessibilityLabel={altText}>
        {altText}
      </Text>
    </View>
  );
}
