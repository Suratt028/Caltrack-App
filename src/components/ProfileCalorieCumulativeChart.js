import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import styles from '../style/components/ProfileCalorieCumulativeChartStyles';

const CHART_HEIGHT = 210;
const PAD = { top: 16, right: 12, bottom: 30, left: 48 };
const STEP_MINUTES = 30;
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

function cumulativeAt(entries, minute) {
  return entries.reduce(
    (sum, entry) => (entry.minute <= minute ? sum + entry.kcal : sum),
    0
  );
}

function makePath(points, x, y) {
  return points
    .map((point, index) => `${index ? 'L' : 'M'} ${x(point.minute)} ${y(point.kcal)}`)
    .join(' ');
}

function getTimePoints(endMinute) {
  const points = [];
  for (let minute = 0; minute <= 1440; minute += STEP_MINUTES) points.push(minute);
  points.push(endMinute);
  return [...new Set(points)].filter((minute) => minute <= endMinute).sort((a, b) => a - b);
}

export default function ProfileCalorieCumulativeChart({
  entries = [],
  goalValue = null,
  dateRange = [],
}) {
  const [width, setWidth] = useState(0);
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
  const steps = getTimePoints(endMinute);

  const referencePoints = referenceDate
    ? steps.map((minute) => ({
        minute,
        kcal: cumulativeAt(entriesByDay[referenceDate], minute),
      }))
    : [];
  const averagePoints = comparisonCount
    ? steps.map((minute) => ({
        minute,
        kcal: comparisonDates.reduce(
          (sum, key) => sum + cumulativeAt(entriesByDay[key], minute),
          0
        ) / comparisonCount,
      }))
    : [];
  const referenceTotal = referencePoints.length
    ? referencePoints[referencePoints.length - 1].kcal
    : 0;
  const comparisonTotal = comparisonCount
    ? comparisonDates.reduce((sum, key) => sum + cumulativeAt(entriesByDay[key], endMinute), 0) / comparisonCount
    : 0;
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
  const timeTicks = referenceIsToday
    ? [...new Set([0, nowMinute, 1440])]
    : [0, 1440];

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
            {ticks.map((tick) => (
              <React.Fragment key={`tick-${tick}`}>
                <Line
                  x1={PAD.left}
                  x2={width - PAD.right}
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

            {goal != null && (
              <Line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(goal)}
                y2={y(goal)}
                stroke={colors.turmericDark}
                strokeWidth={1.5}
                strokeDasharray="6,5"
              />
            )}

            {averagePoints.length > 0 && (
              <Path
                d={makePath(averagePoints, x, y)}
                fill="none"
                stroke={colors.inkFaint}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {referenceIsToday && (
              <Line
                x1={x(endMinute)}
                x2={x(endMinute)}
                y1={PAD.top}
                y2={PAD.top + plotHeight}
                stroke={colors.border}
                strokeWidth={1.5}
              />
            )}

            {hasReference && (
              <Path
                d={makePath(referencePoints, x, y)}
                fill="none"
                stroke={colors.primary}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {hasReference && (
              <Circle
                cx={x(endMinute)}
                cy={y(referenceTotal)}
                r={4.5}
                fill={colors.primary}
                stroke={colors.surface}
                strokeWidth={1.5}
              />
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

            {timeTicks.map((minute, index) => (
              <SvgText
                key={`time-${minute}`}
                x={x(minute)}
                y={CHART_HEIGHT - 7}
                fontSize={10}
                fill={colors.inkMuted}
                textAnchor={index === 0 ? 'start' : index === timeTicks.length - 1 ? 'end' : 'middle'}
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
            <View style={[styles.legendLine, { backgroundColor: colors.inkFaint }]} />
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
