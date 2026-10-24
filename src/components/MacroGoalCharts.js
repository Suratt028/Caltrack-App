import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import Svg, { Rect, Line } from 'react-native-svg';
import { colors } from '../theme/colors';
import styles from '../style/components/MacroGoalChartsStyles';

const MINI_HEIGHT = 56;
const MIN_CHART_WIDTH = 200;

const SERIES = [
  { key: 'protein', label: 'โปรตีน', color: colors.protein },
  { key: 'carbs', label: 'คาร์บ', color: colors.carbs },
  { key: 'fat', label: 'ไขมัน', color: colors.fat },
];

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');
const dayNumber = (key) => String(Number(String(key).slice(8, 10)) || 0);

function MiniBars({ data, seriesKey, color, goal, width }) {
  const values = data.map((day) => Number(day.macros?.[seriesKey]) || 0);
  // Room above the goal line so "on target" bars don't touch the top.
  const maxY = Math.max(goal ? goal * 1.25 : 0, ...values, 1);
  const slot = width / Math.max(1, data.length);
  const barW = Math.min(28, Math.max(slot * 0.6, 3));
  const y = (value) => MINI_HEIGHT - (Math.min(value, maxY) / maxY) * MINI_HEIGHT;

  return (
    <Svg width={width} height={MINI_HEIGHT}>
      {data.map((day, i) => {
        const value = values[i];
        const x = slot * i + (slot - barW) / 2;
        const h = Math.max(2, MINI_HEIGHT - y(value));
        // A day still in progress is outlined so it doesn't read as a finished total.
        return day.partial ? (
          <Rect
            key={day.date}
            x={x + 0.75}
            y={y(value) + 0.75}
            width={barW - 1.5}
            height={Math.max(h - 1.5, 1)}
            rx={3}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        ) : (
          <Rect key={day.date} x={x} y={y(value)} width={barW} height={h} rx={3} fill={color} />
        );
      })}
      {goal ? (
        <Line
          x1={0}
          y1={y(goal)}
          x2={width}
          y2={y(goal)}
          stroke={colors.ink}
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeDasharray="5,4"
        />
      ) : null}
    </Svg>
  );
}

/**
 * One small bar chart per macro (protein / carbs / fat, grams per day), each
 * with its own dashed profile-goal line, so a 60 g fat goal isn't drowned out
 * by 250 g of carbs. Averages only count finished days.
 */
export default function MacroGoalCharts({ data = [], goals = null }) {
  const [width, setWidth] = useState(0);
  const finished = data.filter((day) => !day.partial);

  const onLayout = (event) => {
    const next = Math.round(event?.nativeEvent?.layout?.width || 0);
    if (next > 0 && Math.abs(next - width) > 1) setWidth(Math.max(next, MIN_CHART_WIDTH));
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {SERIES.map((series) => {
        const goal = Number(goals?.[series.key]) > 0 ? Number(goals[series.key]) : null;
        const avg = finished.length
          ? finished.reduce((sum, day) => sum + (Number(day.macros?.[series.key]) || 0), 0) / finished.length
          : null;
        const altText = data.length
          ? `${series.label} รายวัน: ${data
              .map((day) => `วันที่ ${dayNumber(day.date)} ${formatNumber(day.macros?.[series.key])} กรัม${day.partial ? ' (ยังไม่ครบวัน)' : ''}`)
              .join(', ')}${goal ? ` · เป้าหมาย ${formatNumber(goal)} กรัม` : ''}`
          : 'ไม่มีข้อมูลในช่วงนี้';
        return (
          <View key={series.key} style={styles.row}>
            <View style={styles.rowHeader}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: series.color }]} />
                <Text style={styles.seriesLabel}>{series.label}</Text>
              </View>
              <Text style={styles.avgText}>
                {avg == null ? '—' : (
                  <>
                    เฉลี่ย <Text style={styles.avgValue}>{formatNumber(avg)}</Text>
                    {goal ? ` / ${formatNumber(goal)} ก. · ${Math.round((avg / goal) * 100)}%` : ' ก.'}
                  </>
                )}
              </Text>
            </View>
            <View accessible accessibilityRole="image" accessibilityLabel={altText} style={styles.canvas}>
              {width > 0 && (
                <MiniBars data={data} seriesKey={series.key} color={series.color} goal={goal} width={width} />
              )}
            </View>
          </View>
        );
      })}
      <Text style={styles.note}>
        {goals ? 'เส้นประ = เป้าหมายในโปรไฟล์ · ' : ''}ค่าเฉลี่ยนับเฉพาะวันที่บันทึกครบ
      </Text>
    </View>
  );
}
