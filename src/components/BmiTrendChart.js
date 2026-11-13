import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import useDeviceLayout from '../utils/useDeviceLayout';
import { AXIS_FONT_SIZE, VALUE_FONT_SIZE, smoothPath } from './charts/chartKit';

const PAD = { top: 30, right: 12, bottom: 28, left: 36 };

// Asian adult cut-offs, drawn as soft background zones. Supportive palette:
// no red here (red is for real errors only), higher zones get warmer, not alarming.
const ZONES = [
  { min: -Infinity, max: 18.5, label: 'ต่ำกว่าเกณฑ์', fill: colors.skySoft },
  { min: 18.5, max: 23, label: 'ตามเกณฑ์', fill: colors.mint },
  { min: 23, max: 25, label: 'เริ่มเสี่ยง', fill: colors.turmericSoft },
  { min: 25, max: 30, label: 'อ้วนระดับ 1', fill: colors.chiliSoft },
  { min: 30, max: Infinity, label: 'อ้วนระดับ 2', fill: '#EDD6CE' },
];

const parseKey = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
};
const dayMonth = (key) => {
  const date = new Date(parseKey(key));
  return `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
};

/** @param {{ points: { date: string, bmi: number }[] }} props */
export default function BmiTrendChart({ points }) {
  const [width, setWidth] = useState(0);
  // Fixed height per device class (mobile / tablet / desktop).
  const HEIGHT = useDeviceLayout().chartHeight('bmi');
  if (points.length < 2) return null;

  const values = points.map((p) => p.bmi);
  // Always show the zones around the person's values, plus a little room.
  const min = Math.floor(Math.min(17, ...values) - 0.5);
  const max = Math.ceil(Math.max(26, ...values) + 0.5);
  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const t0 = parseKey(points[0].date);
  const t1 = parseKey(points[points.length - 1].date);
  const x = (date) => PAD.left + (t1 === t0 ? plotW / 2 : ((parseKey(date) - t0) / (t1 - t0)) * plotW);
  const y = (v) => PAD.top + plotH - ((Math.min(Math.max(v, min), max) - min) / (max - min)) * plotH;

  const pts = points.map((p) => ({ x: x(p.date), y: y(p.bmi), p }));
  const last = pts[pts.length - 1];
  const zone = ZONES.find((z) => last.p.bmi >= z.min && last.p.bmi < z.max);
  const visibleZones = ZONES.filter((z) => z.max > min && z.min < max);
  const dateIdx = [...new Set([0, Math.floor((pts.length - 1) / 2), pts.length - 1])];
  const valueText = last.p.bmi.toFixed(1);
  const bubbleText = `ล่าสุด ${valueText}${zone ? ` · ${zone.label}` : ''}`;
  const bubbleW = bubbleText.length * 7 + 18;
  const bubbleX = width - PAD.right - bubbleW;
  const bubbleY = 2;

  return (
    <View
      style={{ width: '100%', minHeight: HEIGHT }}
      onLayout={(e) => {
        const next = Math.round(e?.nativeEvent?.layout?.width || 0);
        if (next > 0 && next !== width) setWidth(next);
      }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`กราฟ BMI ล่าสุด ${valueText}${zone ? ` อยู่ในช่วง${zone.label}` : ''} ต่ำสุด ${Math.min(...values).toFixed(1)} สูงสุด ${Math.max(...values).toFixed(1)}`}
    >
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {visibleZones.map((z) => {
            const top = y(Math.min(z.max, max));
            const bottom = y(Math.max(z.min, min));
            const h = bottom - top;
            return (
              <Rect key={z.label} x={PAD.left} y={top} width={plotW} height={h} fill={z.fill} opacity={0.8} />
            );
          })}

          {[18.5, 23, 25, 30].filter((t) => t > min && t < max).map((t) => (
            <G key={t}>
              <Line x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} stroke={colors.surface} strokeWidth={1.5} />
              <SvgText x={PAD.left - 6} y={y(t) + 4} fontSize={AXIS_FONT_SIZE} fill={colors.inkFaint} textAnchor="end">
                {t}
              </SvgText>
            </G>
          ))}

          <Path d={smoothPath(pts)} fill="none" stroke={colors.primaryDark} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {pts.length <= 14 && pts.slice(0, -1).map(({ x: cx, y: cy, p }) => (
            <Circle key={p.date} cx={cx} cy={cy} r={3.5} fill={colors.surface} stroke={colors.primaryDark} strokeWidth={2} />
          ))}
          <Circle cx={last.x} cy={last.y} r={9} fill={colors.primaryDark} fillOpacity={0.15} />
          <Circle cx={last.x} cy={last.y} r={5.5} fill={colors.primaryDark} stroke={colors.surface} strokeWidth={2} />
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
              {dayMonth(pts[i].p.date)}
            </SvgText>
          ))}
        </Svg>
      )}
      {/* Zone names live in a legend so they never sit on top of the line. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
        {visibleZones.map((z) => (
          <View key={z.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: z.fill,
                borderWidth: z === zone ? 2 : 1,
                borderColor: z === zone ? colors.primaryDark : colors.border,
              }}
            />
            <Text style={{ fontSize: 13, color: z === zone ? colors.ink : colors.inkMuted, fontWeight: z === zone ? '700' : '400' }}>
              {z.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
