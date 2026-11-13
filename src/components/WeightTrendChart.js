import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';
import useDeviceLayout from '../utils/useDeviceLayout';
import { AXIS_FONT_SIZE, VALUE_FONT_SIZE, areaPath, niceScale, smoothPath } from './charts/chartKit';

const PAD = { top: 34, right: 18, bottom: 28, left: 40 };
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const parseKey = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
};
const shortDate = (key) => {
  const date = new Date(parseKey(key));
  return `${date.getUTCDate()} ${THAI_MONTHS_SHORT[date.getUTCMonth()]}`;
};
const kg = (value) => Number(value).toLocaleString('th-TH', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Weight over time: x is spaced by real dates (irregular weigh-ins keep their
 * true gaps), smooth line with a soft area, latest reading called out.
 * @param {{ points: { date: string, weight: number }[] }} props
 */
export default function WeightTrendChart({ points }) {
  const [width, setWidth] = useState(0);
  // Fixed height per device class (mobile / tablet / desktop).
  const HEIGHT = useDeviceLayout().chartHeight('weight');
  if (points.length < 2) return null;

  const values = points.map((p) => p.weight);
  const scale = niceScale(Math.min(...values), Math.max(...values), 4);
  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const t0 = parseKey(points[0].date);
  const t1 = parseKey(points[points.length - 1].date);
  const x = (date) => PAD.left + (t1 === t0 ? plotW / 2 : ((parseKey(date) - t0) / (t1 - t0)) * plotW);
  const y = (v) => PAD.top + plotH - ((v - scale.min) / (scale.max - scale.min)) * plotH;

  const pts = points.map((p) => ({ x: x(p.date), y: y(p.weight), p }));
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  const change = last.p.weight - first.p.weight;
  const showDots = pts.length <= 14;

  // Latest-value bubble sits in the top-right corner so it never covers the line.
  const bubbleText = `ล่าสุด ${kg(last.p.weight)} กก.`;
  const bubbleW = bubbleText.length * 7 + 18;
  const bubbleX = width - PAD.right - bubbleW;
  const bubbleY = 2;

  const dateIdx = [...new Set([0, Math.floor((pts.length - 1) / 2), pts.length - 1])];

  return (
    <View
      style={{ width: '100%', minHeight: HEIGHT }}
      onLayout={(e) => {
        const next = Math.round(e?.nativeEvent?.layout?.width || 0);
        if (next > 0 && next !== width) setWidth(next);
      }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`กราฟน้ำหนัก ${shortDate(first.p.date)} ถึง ${shortDate(last.p.date)} ล่าสุด ${kg(last.p.weight)} กิโลกรัม ${change === 0 ? 'เท่าเดิม' : `${change > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${kg(Math.abs(change))} กิโลกรัม`}`}
    >
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          <Defs>
            <LinearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={0.22} />
              <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {scale.ticks.map((tick) => (
            <G key={tick}>
              <Line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray={tick === scale.min ? undefined : '3,4'}
              />
              <SvgText x={PAD.left - 8} y={y(tick) + 4} fontSize={AXIS_FONT_SIZE} fill={colors.inkFaint} textAnchor="end">
                {Number.isInteger(tick) ? tick : tick.toFixed(1)}
              </SvgText>
            </G>
          ))}

          <Path d={areaPath(line, pts, PAD.top + plotH)} fill="url(#weightArea)" />
          <Path d={line} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

          {showDots && pts.slice(0, -1).map(({ x: cx, y: cy, p }) => (
            <Circle key={p.date} cx={cx} cy={cy} r={3.5} fill={colors.surface} stroke={colors.primary} strokeWidth={2} />
          ))}

          {/* Latest reading */}
          <Line x1={last.x} x2={last.x} y1={last.y} y2={PAD.top + plotH} stroke={colors.primary} strokeOpacity={0.25} strokeWidth={1.5} strokeDasharray="3,3" />
          <Circle cx={last.x} cy={last.y} r={9} fill={colors.primary} fillOpacity={0.15} />
          <Circle cx={last.x} cy={last.y} r={5.5} fill={colors.primary} stroke={colors.surface} strokeWidth={2} />
          <Rect x={bubbleX} y={bubbleY} width={bubbleW} height={24} rx={12} fill={colors.primaryDark} />
          <SvgText x={bubbleX + bubbleW / 2} y={bubbleY + 16.5} fontSize={VALUE_FONT_SIZE} fontWeight="700" fill={colors.white} textAnchor="middle">
            {bubbleText}
          </SvgText>

          {dateIdx.map((i, k) => (
            <SvgText
              key={`d-${pts[i].p.date}`}
              x={pts[i].x}
              y={HEIGHT - 8}
              fontSize={AXIS_FONT_SIZE}
              fill={colors.inkMuted}
              textAnchor={k === 0 ? 'start' : k === dateIdx.length - 1 ? 'end' : 'middle'}
            >
              {shortDate(pts[i].p.date)}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}
