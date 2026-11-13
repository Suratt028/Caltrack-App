import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import styles from '../style/components/MacroGroupedChartStyles';

const CHART_HEIGHT = 170;
const PAD = { top: 10, right: 8, bottom: 24, left: 34 };
const MIN_CHART_WIDTH = 240;

const SERIES = [
  { key: 'protein', label: 'โปรตีน', color: colors.protein },
  { key: 'carbs', label: 'คาร์บ', color: colors.carbs },
  { key: 'fat', label: 'ไขมัน', color: colors.fat },
];

const valueOf = (day, key) => Number(day?.macros?.[key] ?? day?.[key]) || 0;
const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');
const dayNumber = (date) => String(Number(String(date).slice(8, 10)) || '');

export default function MacroGroupedChart({ data = [], selectedDate, onSelectDay }) {
  const [width, setWidth] = useState(0);
  const maxValue = Math.max(0, ...data.flatMap((day) => SERIES.map((series) => valueOf(day, series.key))));
  const maxY = Math.max(50, Math.ceil(maxValue / 50) * 50);
  const ticks = [0, maxY / 2, maxY];
  const chartWidth = Math.max(width, MIN_CHART_WIDTH);
  const plotWidth = chartWidth - PAD.left - PAD.right;
  const plotHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const baseY = PAD.top + plotHeight;
  const slot = plotWidth / Math.max(data.length, 1);
  const barWidth = Math.min((slot * 0.8) / SERIES.length, 12);
  const groupWidth = barWidth * SERIES.length + 2 * (SERIES.length - 1);
  const y = (value) => baseY - (Math.min(value, maxY) / maxY) * plotHeight;

  const onLayout = (event) => {
    const next = Math.round(event?.nativeEvent?.layout?.width || 0);
    if (next > 0 && Math.abs(next - width) > 1) setWidth(Math.max(next, MIN_CHART_WIDTH));
  };

  return (
    <View>
      <View style={styles.legend}>
        {SERIES.map((series) => (
          <View key={series.key} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: series.color }]} />
            <Text style={styles.legendText}>{series.label}</Text>
          </View>
        ))}
        <Text style={styles.legendText}>กรัม</Text>
      </View>

      <View onLayout={onLayout} style={styles.canvas}>
        {width > 0 && (
          <>
            <Svg width={chartWidth} height={CHART_HEIGHT}>
              {ticks.map((tick) => (
                <React.Fragment key={`tick-${tick}`}>
                  <Line
                    x1={PAD.left}
                    x2={chartWidth - PAD.right}
                    y1={y(tick)}
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

              {data.map((day, index) => {
                const groupX = PAD.left + slot * index + slot / 2 - groupWidth / 2;
                const selected = day.date === selectedDate;
                return (
                  <React.Fragment key={day.date}>
                    {SERIES.map((series, seriesIndex) => {
                      const value = valueOf(day, series.key);
                      return (
                        <Rect
                          key={series.key}
                          x={groupX + seriesIndex * (barWidth + 2)}
                          y={y(value)}
                          width={barWidth}
                          height={Math.max(baseY - y(value), value > 0 ? 2 : 0)}
                          rx={2}
                          fill={series.color}
                          opacity={selectedDate && !selected ? 0.45 : 1}
                        />
                      );
                    })}
                    <SvgText
                      x={PAD.left + slot * index + slot / 2}
                      y={CHART_HEIGHT - 6}
                      fontSize={11}
                      fontWeight={selected ? '700' : '400'}
                      fill={selected ? colors.ink : colors.inkMuted}
                      textAnchor="middle"
                    >
                      {dayNumber(day.date)}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>

            <View style={[styles.hitTargets, { width: plotWidth }]}>
              {data.map((day) => (
                <Pressable
                  key={day.date}
                  style={styles.hitTarget}
                  onPress={() => onSelectDay?.(day.date)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: day.date === selectedDate }}
                  accessibilityLabel={`วันที่ ${day.date} โปรตีน ${formatNumber(valueOf(day, 'protein'))} คาร์บ ${formatNumber(valueOf(day, 'carbs'))} ไขมัน ${formatNumber(valueOf(day, 'fat'))} กรัม`}
                />
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
