import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';
import styles from '../style/components/TrendBarChartStyles';

const CHART_HEIGHT = 176;
const PAD = { top: 26, right: 12, bottom: 26, left: 48 };
const MIN_CHART_WIDTH = 240;

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');
const dayNumber = (key) => String(Number(String(key).slice(8, 10)) || 0);

/** Round a value up to a friendly axis maximum (nearest 500 for kcal data). */
const niceMax = (values, step = 500) => {
  const max = Math.max(0, ...values);
  if (max <= 0) return step;
  return Math.ceil(max / step) * step;
};

/**
 * Vertical bar chart of energy per day with a dashed gold goal reference line,
 * per-bar value labels, y-axis ticks in the given unit and a visually hidden
 * text alternative (data list) for screen readers. Mirrors the web TrendBarChart.
 */
export default function TrendBarChart({
  data = [],
  goalValue = null,
  goalLabel = '',
  axisUnit = 'กิโลแคลอรี',
  caption = '',
  title = '',
  description = '',
}) {
  const [width, setWidth] = useState(0);

  const values = data.map((datum) => Number(datum.value) || 0);
  const safeGoal = Number(goalValue) > 0 ? Number(goalValue) : null;
  const maxY = niceMax(safeGoal ? [...values, safeGoal] : values, 500);

  const plotW = Math.max((width || MIN_CHART_WIDTH) - PAD.left - PAD.right, 60);
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(46, Math.max(slot * 0.52, 3));
  const y = (value) => PAD.top + plotH - (Math.min(value, maxY) / maxY) * plotH;
  const ticks = [0, maxY / 2, maxY];
  const stepEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1;
  const valueEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1;

  const onLayout = (event) => {
    const next = Math.round(event?.nativeEvent?.layout?.width || 0);
    if (next > 0 && Math.abs(next - width) > 1) {
      setWidth(Math.max(next, MIN_CHART_WIDTH));
    }
  };

  const altText = data.length
    ? data
        .map((datum) => `วันที่ ${dayNumber(datum.date)}: ${formatNumber(datum.value)} ${axisUnit}`)
        .join(' · ')
    : 'ไม่มีข้อมูลในช่วงนี้';

  return (
    <View style={styles.wrap}>
      <View
        onLayout={onLayout}
        style={styles.canvas}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`กราฟ ${title || 'แนวโน้มพลังงาน'}`}
        accessibilityHint={description || undefined}
      >
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {/* gridlines + y tick labels */}
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

            {/* axis unit hint */}
            <SvgText x={PAD.left - 6} y={12} fontSize={10} fill={colors.inkMuted} textAnchor="end">
              {axisUnit}
            </SvgText>

            {/* bars */}
            {data.map((datum, i) => {
              const value = Number(datum.value) || 0;
              const cx = PAD.left + slot * i + slot / 2;
              const barH = Math.max(2, PAD.top + plotH - y(value));
              const isLast = i === data.length - 1;
              const showValue = i % valueEvery === 0 || datum.highlight || isLast;
              const showDay = i % stepEvery === 0 || datum.highlight || isLast;
              return (
                <React.Fragment key={datum.date}>
                  {/* Today is still in progress: outline it instead of the
                      strongest fill, so it doesn't read as the key result. */}
                  {datum.highlight ? (
                    <Rect
                      x={cx - barW / 2 + 1}
                      y={y(value) + 1}
                      width={barW - 2}
                      height={Math.max(barH - 2, 1)}
                      rx={6}
                      fill="none"
                      stroke={colors.primary}
                      strokeWidth={2}
                      strokeDasharray="5,4"
                    />
                  ) : (
                    <Rect
                      x={cx - barW / 2}
                      y={y(value)}
                      width={barW}
                      height={barH}
                      rx={6}
                      fill={colors.barPast}
                    />
                  )}
                  {showValue && (
                    <SvgText
                      x={cx}
                      y={Math.max(y(value) - 6, 10)}
                      fontSize={barW >= 24 ? 10 : 9}
                      fontWeight="600"
                      fill={colors.ink}
                      textAnchor="middle"
                    >
                      {formatNumber(value)}
                    </SvgText>
                  )}
                  {showDay && (
                    <SvgText
                      x={cx}
                      y={CHART_HEIGHT - 8}
                      fontSize={10}
                      fontWeight={datum.highlight ? '700' : '400'}
                      fill={datum.highlight ? colors.primaryDark : colors.inkMuted}
                      textAnchor="middle"
                    >
                      {dayNumber(datum.date)}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}

            {/* goal reference line — dark dashed so it never blends into a
                gridline (the axis max is often the goal itself); never red */}
            {safeGoal != null && safeGoal <= maxY && (
              <React.Fragment key="goal-line">
                <Line
                  x1={PAD.left}
                  y1={y(safeGoal)}
                  x2={width - PAD.right}
                  y2={y(safeGoal)}
                  stroke={colors.ink}
                  strokeOpacity={0.7}
                  strokeWidth={1.5}
                  strokeDasharray="6,5"
                />
                {!!goalLabel && (
                  <SvgText
                    x={width - PAD.right}
                    y={Math.max(y(safeGoal) - 6, 12)}
                    fontSize={11}
                    fontWeight="600"
                    fill={colors.ink}
                    textAnchor="end"
                  >
                    {goalLabel}
                  </SvgText>
                )}
              </React.Fragment>
            )}
          </Svg>
        )}
      </View>

      {!!caption && <Text style={styles.caption}>{caption}</Text>}

      {/* Visually hidden data list — the accessible alternative to the graphic */}
      <Text style={styles.srOnly} accessibilityLabel={altText}>
        {altText}
      </Text>
    </View>
  );
}
