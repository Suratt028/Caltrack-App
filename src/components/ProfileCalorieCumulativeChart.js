import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import useDeviceLayout from '../utils/useDeviceLayout';
import { smoothPath } from './charts/chartKit';
import styles from '../style/components/ProfileCalorieCumulativeChartStyles';

// Layout follows the "today vs average" activity chart style: today's total
// (accent) beside the full-day average (grey), smooth hourly lines, a solid
// "now" marker, a progress bar along the bottom, and only 00:00 · now · 00:00
// on the time axis.

const PAD = { top: 14, right: 10, bottom: 34, left: 10 };
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TICK_FONT = 12;

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');
const dateKey = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);
const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();
const timeLabel = (minutes) => (
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
);
const formatDate = (key) => {
  const [, month, day] = String(key).split('-').map(Number);
  return `${day} ${THAI_MONTHS_SHORT[(month || 1) - 1]}`;
};

function groupEntriesByDay(entries, fallbackDate) {
  return entries.reduce((byDay, entry) => {
    const loggedAt = entry.loggedAt || entry.time;
    const parsedDate = loggedAt ? new Date(loggedAt) : null;
    const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
    const key = entry.dateKey || (validDate ? dateKey(validDate) : fallbackDate);
    const minute = validDate ? minutesOfDay(validDate) : 1440;
    const kcal = Number(entry.kcal);

    if (!Number.isFinite(kcal)) return byDay;
    (byDay[key] ||= []).push({ minute, kcal });
    return byDay;
  }, {});
}

// Entries without a usable time sit at 24:00; `clampTo` pulls them forward
// (today's untimed entries count toward "so far").
function cumulativeAt(entries, minute, clampTo = 1440) {
  return entries.reduce(
    (sum, entry) => (Math.min(entry.minute, clampTo) <= minute ? sum + entry.kcal : sum),
    0
  );
}

/** Samples every hour from 00:00 up to `endMinute` (plus `endMinute` itself). */
export function hourlySamples(valueAt, endMinute) {
  const points = [];
  for (let minute = 0; minute < endMinute; minute += 60) points.push({ minute, kcal: valueAt(minute) });
  points.push({ minute: endMinute, kcal: valueAt(endMinute) });
  return points;
}

export default function ProfileCalorieCumulativeChart({
  entries = [],
  goalValue = null,
  dateRange = [],
}) {
  const [width, setWidth] = useState(0);
  // Fixed height per device class (mobile / tablet / desktop).
  const CHART_HEIGHT = useDeviceLayout().chartHeight('cumulative');
  const now = new Date();
  const todayKey = dateKey(now);
  const nowMinute = minutesOfDay(now);
  const entriesByDay = groupEntriesByDay(entries, todayKey);
  const loggedDates = dateRange.filter((key) => entriesByDay[key]?.length);
  const referenceDate = loggedDates[loggedDates.length - 1] || null;
  const referenceIsToday = referenceDate === todayKey;
  const endMinute = referenceIsToday ? nowMinute : 1440;
  const comparisonDates = referenceDate ? loggedDates.filter((key) => key !== referenceDate) : [];
  const comparisonCount = comparisonDates.length;
  const hasReference = Boolean(referenceDate && entriesByDay[referenceDate]?.length);

  // Today: hourly up to now. Average of the other logged days: the whole day.
  const referencePoints = hasReference
    ? hourlySamples((minute) => cumulativeAt(entriesByDay[referenceDate], minute, endMinute), endMinute)
    : [];
  const averageAt = (minute) => comparisonDates.reduce(
    (sum, key) => sum + cumulativeAt(entriesByDay[key], minute),
    0
  ) / comparisonCount;
  const averagePoints = comparisonCount ? hourlySamples(averageAt, 1440) : [];
  const referenceTotal = referencePoints.length ? referencePoints[referencePoints.length - 1].kcal : 0;
  const averageDayTotal = comparisonCount ? averageAt(1440) : 0;

  const maxY = Math.max(500, Math.max(referenceTotal, averageDayTotal) * 1.08);
  const plotWidth = Math.max(width - PAD.left - PAD.right, 1);
  const plotHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const baseY = PAD.top + plotHeight;
  const x = (minute) => PAD.left + (plotWidth * minute) / 1440;
  const y = (value) => baseY - (Math.min(value, maxY) / maxY) * plotHeight;
  const toXY = (points) => points.map((p) => ({ x: x(p.minute), y: y(p.kcal) }));
  const todayLine = smoothPath(toXY(referencePoints));
  const averageLine = smoothPath(toXY(averagePoints));
  const nowX = x(endMinute);
  const barY = baseY + 6;
  // Keep the "now" label clear of the 00:00 labels at both ends.
  const nowAnchor = nowX < PAD.left + 46 ? 'start' : nowX > width - PAD.right - 46 ? 'end' : 'middle';

  return (
    <View style={styles.wrap}>
      <Text style={styles.headline}>
        {referenceDate
          ? `${formatDate(referenceDate)}${referenceIsToday ? ' · วันนี้' : ''}`
          : 'ยังไม่มีข้อมูลในช่วงวันที่เลือก'}
      </Text>

      {/* Today (accent) vs the average day (grey), like the reference chart. */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryValue, { color: colors.primary }]}>
          {formatNumber(referenceTotal)}
          <Text style={[styles.summaryUnit, { color: colors.primary }]}> kcal</Text>
        </Text>
        <Text style={[styles.summaryValue, styles.summaryValueMuted]}>
          {comparisonCount ? formatNumber(averageDayTotal) : '—'}
          <Text style={styles.summaryUnit}> kcal</Text>
        </Text>
      </View>

      <View
        onLayout={(event) => {
          const next = Math.round(event?.nativeEvent?.layout?.width || 0);
          if (next > 0 && next !== width) setWidth(next);
        }}
        style={styles.canvas}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`กราฟพลังงานสะสม${referenceDate ? ` ${formatDate(referenceDate)} ${formatNumber(referenceTotal)} กิโลแคลอรี่` : ''}${comparisonCount ? ` ค่าเฉลี่ยทั้งวัน ${formatNumber(averageDayTotal)} กิโลแคลอรี่` : ''}`}
        accessibilityHint={`เป้าหมายต่อวัน ${Number(goalValue) > 0 ? `${formatNumber(goalValue)} kcal` : 'ยังไม่ได้ตั้งค่า'}. ค่าเฉลี่ยคำนวณจาก ${comparisonCount} วันที่มีบันทึกอื่นในช่วงที่เลือก`}
      >
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="cumulativeArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.primary} stopOpacity={0.16} />
                <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Dotted edges at 00:00 and 24:00 */}
            {[0, 1440].map((minute) => (
              <Line
                key={`edge-${minute}`}
                x1={x(minute)}
                x2={x(minute)}
                y1={PAD.top}
                y2={barY}
                stroke={colors.inkFaint}
                strokeOpacity={0.5}
                strokeWidth={1}
                strokeDasharray="2,3"
              />
            ))}

            {/* Average day, whole day, grey */}
            {averagePoints.length > 1 && (
              <Path d={averageLine} fill="none" stroke={colors.inkFaint} strokeOpacity={0.75} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Today up to now */}
            {referencePoints.length > 1 && (
              <>
                <Path d={`${todayLine} L ${nowX} ${baseY} L ${x(0)} ${baseY} Z`} fill="url(#cumulativeArea)" />
                <Path d={todayLine} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}

            {/* "Now" marker, dot at the end of today's line, and the 00:00 → now bar */}
            {referenceIsToday && (
              <Line x1={nowX} x2={nowX} y1={PAD.top} y2={barY} stroke={colors.inkMuted} strokeWidth={1.5} />
            )}
            {hasReference && (
              <Circle cx={nowX} cy={y(referenceTotal)} r={5.5} fill={colors.primary} stroke={colors.surface} strokeWidth={2} />
            )}
            {hasReference && (
              <>
                <Line x1={x(0)} x2={nowX} y1={barY} y2={barY} stroke={colors.primary} strokeWidth={3} strokeLinecap="round" />
                <Circle cx={nowX} cy={barY} r={4.5} fill={colors.primary} />
              </>
            )}

            {/* Time axis: 00:00 · now · 00:00 only */}
            <SvgText x={x(0)} y={CHART_HEIGHT - 6} fontSize={TICK_FONT} fill={colors.inkMuted} textAnchor="start">
              00:00
            </SvgText>
            {referenceIsToday && (
              <SvgText x={nowX} y={CHART_HEIGHT - 6} fontSize={TICK_FONT} fontWeight="700" fill={colors.ink} textAnchor={nowAnchor}>
                {timeLabel(nowMinute)}
              </SvgText>
            )}
            <SvgText x={x(1440)} y={CHART_HEIGHT - 6} fontSize={TICK_FONT} fill={colors.inkMuted} textAnchor="end">
              00:00
            </SvgText>
          </Svg>
        )}
      </View>

      <View style={styles.legend}>
        {hasReference && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>{referenceIsToday ? 'วันนี้ถึงตอนนี้' : `วันที่ ${formatDate(referenceDate)}`}</Text>
          </View>
        )}
        {comparisonCount > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.inkFaint }]} />
            <Text style={styles.legendText}>ค่าเฉลี่ยทั้งวัน · {comparisonCount} วันที่มีบันทึก</Text>
          </View>
        )}
      </View>

      {!comparisonCount && hasReference && (
        <Text style={styles.hint}>มีข้อมูลหนึ่งวันในช่วงนี้ จึงยังไม่มีค่าเฉลี่ยเปรียบเทียบ</Text>
      )}
      {!hasReference && (
        <Text style={styles.hint}>ลองเลือกช่วงวันที่มีการบันทึกอาหารเพื่อดูกราฟ</Text>
      )}
    </View>
  );
}
