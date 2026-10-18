import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';
import styles from '../style/components/MacroGroupedChartStyles';

const CHART_HEIGHT = 168;
const PAD = { top: 20, right: 12, bottom: 26, left: 48 };
const MIN_CHART_WIDTH = 240;

const SERIES = [
  { key: 'protein', label: 'โปรตีน', color: colors.protein },
  { key: 'carbs', label: 'คาร์บ', color: colors.carbs },
  { key: 'fat', label: 'ไขมัน', color: colors.fat },
];

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');
const dayNumber = (key) => String(Number(String(key).slice(8, 10)) || 0);

const niceMax = (values, step = 125) => {
  const max = Math.max(0, ...values);
  if (max <= 0) return step;
  return Math.ceil(max / step) * step;
};

/**
 * Grouped bar chart comparing protein / carbs / fat (grams) per day, with a
 * visible legend (colour is never the only cue) and a visually hidden data
 * list for screen readers. Mirrors the web MacroGroupedChart.
 */
export default function MacroGroupedChart({
  data = [],
  axisUnit = 'กรัม',
  title = '',
  description = '',
}) {
  const [width, setWidth] = useState(0);

  const allValues = data.flatMap((day) => [
    Number(day.macros?.protein) || 0,
    Number(day.macros?.carbs) || 0,
    Number(day.macros?.fat) || 0,
  ]);
  const maxY = niceMax(allValues, 125);

  const plotW = Math.max((width || MIN_CHART_WIDTH) - PAD.left - PAD.right, 60);
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, data.length);
  const groupW = Math.min(60, Math.max(slot * 0.7, 9));
  const barW = Math.max(groupW / 3 - 2, 2);
  const y = (value) => PAD.top + plotH - (Math.min(value, maxY) / maxY) * plotH;
  const ticks = [0, maxY / 2, maxY];
  const stepEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1;

  const onLayout = (event) => {
    const next = Math.round(event?.nativeEvent?.layout?.width || 0);
    if (next > 0 && Math.abs(next - width) > 1) {
      setWidth(Math.max(next, MIN_CHART_WIDTH));
    }
  };

  const altText = data.length
    ? data
        .map((day) => {
          const macros = day.macros || {};
          return `วันที่ ${dayNumber(day.date)}: โปรตีน ${formatNumber(macros.protein)} / คาร์บ ${formatNumber(
            macros.carbs
          )} / ไขมัน ${formatNumber(macros.fat)} ${axisUnit}`;
        })
        .join(' · ')
    : 'ไม่มีข้อมูลในช่วงนี้';

  return (
    <View style={styles.wrap}>
      <View
        onLayout={onLayout}
        style={styles.canvas}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`กราฟ ${title || 'สารอาหารในแต่ละวัน'}`}
        accessibilityHint={description || undefined}
      >
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {ticks.map((tick) => (
              <React.Fragment key={`tick-${tick}`}>
                <Line
                  x1={PAD.left}
                  y1={y(tick)}
                  x2={width - PAD.right}
                  y2={y(tick)}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={PAD.left - 6}
                  y={y(tick) + 4}
                  fontSize={10}
                  fill={colors.inkMuted}
                  textAnchor="end"
                >
                  {formatNumber(tick)}
                </SvgText>
              </React.Fragment>
            ))}

            <SvgText x={PAD.left - 6} y={11} fontSize={10} fill={colors.inkMuted} textAnchor="end">
              {axisUnit}
            </SvgText>

            {data.map((day, i) => {
              const startX = PAD.left + slot * i + (slot - groupW) / 2;
              const showDay = i % stepEvery === 0 || i === data.length - 1;
              return (
                <React.Fragment key={day.date}>
                  {SERIES.map((series, s) => {
                    const value = Number(day.macros?.[series.key]) || 0;
                    return (
                      <Rect
                        key={series.key}
                        x={startX + s * (barW + 2)}
                        y={y(value)}
                        width={barW}
                        height={Math.max(2, PAD.top + plotH - y(value))}
                        rx={3}
                        fill={series.color}
                      />
                    );
                  })}
                  {showDay && (
                    <SvgText
                      x={startX + groupW / 2}
                      y={CHART_HEIGHT - 8}
                      fontSize={10}
                      fill={colors.inkMuted}
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

      {/* Legend — coloured dot + label, so colour is never the only cue */}
      <View style={styles.legend}>
        {SERIES.map((series) => (
          <View key={series.key} style={styles.legendItem} accessible accessibilityLabel={series.label}>
            <View style={[styles.legendDot, { backgroundColor: series.color }]} />
            <Text style={styles.legendLabel}>{series.label}</Text>
          </View>
        ))}
      </View>

      {/* Visually hidden data list — the accessible alternative to the graphic */}
      <Text style={styles.srOnly} accessibilityLabel={altText}>
        {altText}
      </Text>
    </View>
  );
}
