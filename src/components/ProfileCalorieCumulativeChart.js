import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import useDeviceLayout from '../utils/useDeviceLayout';
import styles from '../style/components/ProfileCalorieCumulativeChartStyles';

const PAD = { top: 16, right: 12, bottom: 30, left: 48 };
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

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

// Entries without a usable time sit at 24:00; clamp them to the chart's end so
// today's untimed entries still count toward "so far".
function cumulativeAt(entries, minute, endMinute = 1440) {
  return entries.reduce(
    (sum, entry) => (Math.min(entry.minute, endMinute) <= minute ? sum + entry.kcal : sum),
    0
  );
}

// Cumulative intake jumps when food is logged, so draw it as steps (flat, then
// straight up at each entry) instead of slanted lines between samples.
function stepPoints(minutes, valueAt, endMinute) {
  const points = [{ minute: 0, kcal: valueAt(0) }];
  [...new Set(minutes.map((m) => Math.min(m, endMinute)))]
    .filter((m) => m > 0)
    .sort((a, b) => a - b)
    .forEach((minute) => points.push({ minute, kcal: valueAt(minute) }));
  points.push({ minute: endMinute, kcal: valueAt(endMinute) });
  return points;
}

function makeStepPath(points, x, y) {
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${x(point.minute)} ${y(point.kcal)}`;
    return `${path} H ${x(point.minute)} V ${y(point.kcal)}`;
  }, '');
}

const TIME_TICKS = [0, 360, 720, 1080, 1440];
const TICK_FONT = 12;

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
  const comparisonDates = referenceDate
    ? loggedDates.filter((key) => key !== referenceDate)
    : [];
  const comparisonCount = comparisonDates.length;

  const referencePoints = referenceDate
    ? stepPoints(
        entriesByDay[referenceDate].map((e) => e.minute),
        (minute) => cumulativeAt(entriesByDay[referenceDate], minute, endMinute),
        endMinute
      )
    : [];
  // Past days' untimed entries could have been eaten any time, so they only
  // count at 24:00 (never pulled forward to "now" like today's are).
  const averageAt = (minute) => comparisonDates.reduce(
    (sum, key) => sum + cumulativeAt(entriesByDay[key], minute),
    0
  ) / comparisonCount;
  const averagePoints = comparisonCount
    ? stepPoints(
        comparisonDates.flatMap((key) => entriesByDay[key].map((e) => e.minute)).filter((m) => m <= endMinute),
        averageAt,
        endMinute
      )
    : [];
  const referenceTotal = referencePoints.length
    ? referencePoints[referencePoints.length - 1].kcal
    : 0;
  const comparisonTotal = comparisonCount ? averageAt(endMinute) : 0;
  const goal = Number(goalValue) > 0 ? Number(goalValue) : null;
  const maxY = Math.max(
    500,
    Math.ceil((Math.max(referenceTotal, comparisonTotal, goal || 0) * 1.1) / 500) * 500
  );
  const ticks = [0, maxY / 2, maxY];
  const hasReference = Boolean(referenceDate && entriesByDay[referenceDate]?.length);
  const plotWidth = Math.max(width - PAD.left - PAD.right, 1);
  const plotHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const x = (minute) => PAD.left + (plotWidth * minute) / 1440;
  const y = (value) => PAD.top + plotHeight - (Math.min(value, maxY) / maxY) * plotHeight;
  // Every 6 hours; on today, skip a tick that would collide with the "now" label.
  const timeTicks = TIME_TICKS.filter(
    (minute) => !referenceIsToday || Math.abs(x(minute) - x(nowMinute)) > 34
  );
  const goalAbove = goal != null && y(goal) - PAD.top > 14;

  return (
    <View style={styles.wrap}>
      <Text style={styles.headline}>
        {referenceDate
          ? `จังหวะการบันทึกพลังงาน · ${formatDate(referenceDate)}${referenceIsToday ? ' · วันนี้' : ''}`
          : 'ยังไม่มีข้อมูลในช่วงวันที่เลือก'}
      </Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryColumn}>
          <Text style={[styles.summaryLabel, { color: colors.primary }]}>
            {referenceIsToday ? 'วันนี้' : referenceDate ? `วันที่ ${formatDate(referenceDate)}` : 'วันที่อ้างอิง'}
          </Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            {formatNumber(referenceTotal)} <Text style={styles.summaryUnit}>kcal</Text>
          </Text>
        </View>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>เฉลี่ยจากวันที่มีบันทึกในช่วงที่เลือก</Text>
          <Text style={styles.summaryValue}>
            {comparisonCount ? formatNumber(comparisonTotal) : '—'}{' '}
            <Text style={styles.summaryUnit}>kcal</Text>
          </Text>
        </View>
      </View>

      <View
        onLayout={(event) => {
          const next = Math.round(event?.nativeEvent?.layout?.width || 0);
          if (next > 0 && next !== width) setWidth(next);
        }}
        style={styles.canvas}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`กราฟพลังงานสะสมตามช่วงวันที่เลือก${referenceDate ? ` วันอ้างอิง ${referenceDate} ${formatNumber(referenceTotal)} kcal` : ''}`}
        accessibilityHint={`เป้าหมายต่อวัน ${goal ? `${formatNumber(goal)} kcal` : 'ยังไม่ได้ตั้งค่า'}. ค่าเฉลี่ยคำนวณจาก ${comparisonCount} วันที่มีบันทึกอื่นในช่วงที่เลือก`}
      >
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="cumulativeArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.primary} stopOpacity={0.2} />
                <Stop offset="1" stopColor={colors.primary} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>

            {ticks.map((tick) => (
              <React.Fragment key={`tick-${tick}`}>
                <Line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray={tick === 0 ? undefined : '3,4'}
                />
                <SvgText
                  x={PAD.left - 8}
                  y={y(tick) + 4}
                  fontSize={TICK_FONT}
                  fill={colors.inkFaint}
                  textAnchor="end"
                >
                  {formatNumber(tick)}
                </SvgText>
              </React.Fragment>
            ))}

            {/* Faint 6-hour guides */}
            {TIME_TICKS.slice(1, -1).map((minute) => (
              <Line
                key={`v-${minute}`}
                x1={x(minute)}
                x2={x(minute)}
                y1={PAD.top}
                y2={PAD.top + plotHeight}
                stroke={colors.border}
                strokeWidth={1}
                strokeOpacity={0.6}
              />
            ))}

            {goal != null && (
              <>
                <Line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(goal)}
                  y2={y(goal)}
                  stroke={colors.turmericDark}
                  strokeWidth={1.5}
                  strokeDasharray="6,5"
                />
                <SvgText
                  x={width - PAD.right}
                  y={goalAbove ? y(goal) - 6 : y(goal) + 15}
                  fontSize={TICK_FONT}
                  fontWeight="600"
                  fill={colors.turmericDark}
                  textAnchor="end"
                >
                  {`เป้า ${formatNumber(goal)}`}
                </SvgText>
              </>
            )}

            {averagePoints.length > 0 && (
              <Path
                d={makeStepPath(averagePoints, x, y)}
                fill="none"
                stroke={colors.inkFaint}
                strokeWidth={2}
                strokeDasharray="5,4"
                strokeLinejoin="round"
              />
            )}

            {hasReference && (
              <>
                <Path
                  d={`${makeStepPath(referencePoints, x, y)} V ${y(0)} H ${x(0)} Z`}
                  fill="url(#cumulativeArea)"
                />
                <Path
                  d={makeStepPath(referencePoints, x, y)}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {referenceIsToday && (
              <>
                <Line
                  x1={x(endMinute)}
                  x2={x(endMinute)}
                  y1={PAD.top}
                  y2={PAD.top + plotHeight}
                  stroke={colors.primary}
                  strokeOpacity={0.35}
                  strokeWidth={1.5}
                  strokeDasharray="3,3"
                />
                <SvgText
                  x={x(endMinute)}
                  y={CHART_HEIGHT - 9}
                  fontSize={TICK_FONT}
                  fontWeight="700"
                  fill={colors.primary}
                  textAnchor={x(endMinute) < PAD.left + 30 ? 'start' : x(endMinute) > width - PAD.right - 30 ? 'end' : 'middle'}
                >
                  {`ตอนนี้ ${timeLabel(nowMinute)}`}
                </SvgText>
              </>
            )}

            {averagePoints.length > 0 && (
              <Circle
                cx={x(endMinute)}
                cy={y(comparisonTotal)}
                r={4}
                fill={colors.surface}
                stroke={colors.inkFaint}
                strokeWidth={2}
              />
            )}

            {hasReference && (
              <>
                <Circle cx={x(endMinute)} cy={y(referenceTotal)} r={9} fill={colors.primary} fillOpacity={0.15} />
                <Circle
                  cx={x(endMinute)}
                  cy={y(referenceTotal)}
                  r={5}
                  fill={colors.primary}
                  stroke={colors.surface}
                  strokeWidth={2}
                />
              </>
            )}

            {timeTicks.map((minute) => (
              <SvgText
                key={`time-${minute}`}
                x={x(minute)}
                y={CHART_HEIGHT - 9}
                fontSize={TICK_FONT}
                fill={colors.inkMuted}
                textAnchor={minute === 0 ? 'start' : minute === 1440 ? 'end' : 'middle'}
              >
                {timeLabel(minute)}
              </SvgText>
            ))}
          </Svg>
        )}
      </View>

      <View style={styles.legend}>
        {hasReference && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>{referenceIsToday ? 'วันนี้' : `วันที่ ${formatDate(referenceDate)}`}</Text>
          </View>
        )}
        {comparisonCount > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, styles.avgLegendLine]} />
            <Text style={styles.legendText}>ค่าเฉลี่ย {comparisonCount} วันที่มีบันทึก</Text>
          </View>
        )}
        {goal != null && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, styles.goalLegendLine]} />
            <Text style={styles.legendText}>เป้าหมาย {formatNumber(goal)} kcal</Text>
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
