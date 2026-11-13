import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Polygon, Text as SvgText } from 'react-native-svg';
import { Text } from './AppText';
import Card from './Card';
import BmiBodyFigure from './BmiBodyFigure';
import BmiInfoSheet from './BmiInfoSheet';
import { colors } from '../theme/colors';
import styles from '../style/components/BmiReferenceCardStyles';

// Zone colours in the style of the classic BMI chart (blue → green → yellow →
// orange → red). `ink` is a darker shade of the same hue for readable text.
export const BMI_ZONE_STYLE = {
  low: { fill: '#8FB3DE', soft: '#E3EDF8', ink: '#2F5D8C', bandText: '#1F3F66' },
  normal: { fill: '#79C99E', soft: '#E1F3E9', ink: '#2E7D57', bandText: '#174D33' },
  at_risk: { fill: '#F2C94C', soft: '#FBF1D2', ink: '#7A5B00', bandText: '#5B4300' },
  obesity_1: { fill: '#F0A04B', soft: '#FCE9D6', ink: '#8A4B12', bandText: '#4A2604' },
  obesity_2: { fill: '#E05A4F', soft: '#F9DEDB', ink: '#9B2C23', bandText: '#FFFFFF' },
};

// Asian adult cut-offs (the app's own), with the outer zones capped for drawing.
const BAND = [
  { key: 'low', from: 15, to: 18.5, range: '<18.5', name: 'ต่ำกว่าเกณฑ์' },
  { key: 'normal', from: 18.5, to: 23, range: '18.5–22.9', name: 'ตามเกณฑ์' },
  { key: 'at_risk', from: 23, to: 25, range: '23–24.9', name: 'เริ่มเสี่ยง' },
  { key: 'obesity_1', from: 25, to: 30, range: '25–29.9', name: 'อ้วนระดับ 1' },
  { key: 'obesity_2', from: 30, to: 40, range: '30+', name: 'อ้วนระดับ 2' },
];
const BAND_H = 34;
const NOTCH = 10;

/** Arrow band like the reference chart, with a pointer at the user's exact BMI. */
function BmiZoneBand({ bmi, categoryKey }) {
  const [width, setWidth] = useState(0);
  const seg = width / BAND.length;
  const hasValue = Number.isFinite(bmi);

  // Pointer position: the active segment, placed proportionally inside its range.
  let markerX = null;
  if (hasValue && width > 0) {
    const index = Math.max(0, BAND.findIndex((z) => z.key === categoryKey));
    const zone = BAND[index];
    const within = Math.min(Math.max((bmi - zone.from) / (zone.to - zone.from), 0.08), 0.92);
    markerX = seg * index + seg * within;
  }
  const markerColor = BMI_ZONE_STYLE[categoryKey]?.ink || colors.ink;

  return (
    <View style={styles.band} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {width > 0 && (
        <Svg width={width} height={BAND_H + 14}>
          {markerX != null && (
            <Path
              d={`M ${markerX - 7} 0 L ${markerX + 7} 0 L ${markerX} 10 Z`}
              fill={markerColor}
            />
          )}
          {BAND.map((zone, i) => {
            const x0 = seg * i;
            const x1 = seg * (i + 1);
            const top = 14;
            const mid = top + BAND_H / 2;
            const bottom = top + BAND_H;
            const last = i === BAND.length - 1;
            const points = [
              [x0, top],
              [last ? x1 : x1 - NOTCH, top],
              [x1, last ? top : mid],
              ...(last ? [[x1, bottom]] : []),
              [last ? x1 : x1 - NOTCH, bottom],
              [x0, bottom],
              ...(i === 0 ? [] : [[x0 + NOTCH, mid]]),
            ].map(([px, py]) => `${px.toFixed(1)},${py}`).join(' ');
            const zs = BMI_ZONE_STYLE[zone.key];
            const active = zone.key === categoryKey;
            return (
              <React.Fragment key={zone.key}>
                <Polygon points={points} fill={zs.fill} opacity={categoryKey && !active ? 0.85 : 1} />
                <SvgText
                  x={x0 + (seg + (i === 0 ? -NOTCH : 0)) / 2 + (i === 0 ? 0 : NOTCH / 2)}
                  y={mid + 4.5}
                  fontSize={12}
                  fontWeight="700"
                  fill={zs.bandText}
                  textAnchor="middle"
                >
                  {zone.range}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      )}
      <View style={styles.bandNames}>
        {BAND.map((zone) => {
          const active = zone.key === categoryKey;
          return (
            <Text
              key={zone.key}
              numberOfLines={2}
              style={[styles.bandName, active && { color: BMI_ZONE_STYLE[zone.key].ink, fontWeight: '800' }]}
            >
              {zone.name}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const HINTS = {
  low: 'BMI ต่ำกว่าช่วงอ้างอิง ไม่แนะนำให้ตั้งเป้าลดน้ำหนักจากตัวเลขนี้ ควรปรึกษาบุคลากรสุขภาพหากกังวล',
  normal: 'อยู่ในช่วงอ้างอิงตามเกณฑ์เอเชีย หากต้องการเพิ่มกล้ามเนื้อ เลือกเป้าหมายเพิ่มมวลกล้ามเนื้อและฝึกแรงต้านได้ ไม่จำเป็นต้องลดน้ำหนักเพียงเพราะ BMI',
  at_risk: 'เริ่มมีความเสี่ยงตามเกณฑ์คัดกรองเอเชีย ลองปรับพฤติกรรมอย่างค่อยเป็นค่อยไป BMI ไม่ใช่การวินิจฉัยโรค',
  high: 'BMI สูงกว่าช่วงอ้างอิงตามเกณฑ์คัดกรองเอเชีย ไม่จำเป็นต้องลดน้ำหนักอย่างเร่งด่วนจาก BMI เพียงค่าเดียว หากกังวลควรปรึกษาผู้เชี่ยวชาญ',
};

const kg = (value) => value.toLocaleString('th-TH', { maximumFractionDigits: 1 });

/**
 * "BMI และช่วงอ้างอิง" card on the Profile screen: one body figure shaped by
 * the user's BMI (it reshapes as the weight changes), the value and category,
 * the healthy weight for their height, and the colour band of BMI zones.
 */
export default function BmiReferenceCard({ bmi, category, age, heightCm, style }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const isMinor = Number(age) < 18;
  const zoneStyle = category ? BMI_ZONE_STYLE[category.key] : null;
  const heightM = Number(heightCm) / 100;
  const healthyRange = heightM > 0 ? [18.5 * heightM * heightM, 22.9 * heightM * heightM] : null;
  const hasValue = Number.isFinite(bmi);
  const hint = isMinor
    ? 'BMI ของผู้มีอายุต่ำกว่า 18 ปีต้องแปลผลเทียบกับอายุและเพศ ไม่ใช้เกณฑ์ผู้ใหญ่'
    : HINTS[category?.key] || (category ? HINTS.high : 'กรอกส่วนสูงและน้ำหนักเพื่อดู BMI');

  return (
    <Card style={style}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>BMI และช่วงอ้างอิง</Text>
        <Pressable
          onPress={() => setInfoOpen(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="BMI คืออะไร และคำนวณอย่างไร"
          style={({ pressed }) => [styles.infoBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.inkMuted} />
        </Pressable>
      </View>
      <BmiInfoSheet
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        bmi={bmi}
        heightCm={heightCm}
        categoryKey={isMinor ? null : category?.key}
        zoneStyles={BMI_ZONE_STYLE}
      />

      <View style={styles.hero}>
        {!isMinor && (
          <View
            style={[styles.figureStage, { backgroundColor: zoneStyle?.soft || colors.surfaceMuted }]}
            accessible
            accessibilityRole="image"
            accessibilityLabel={hasValue ? `รูปร่างตามค่า BMI ${bmi.toFixed(1)} ${category?.label || ''}` : 'รูปร่างตามค่า BMI'}
          >
            <BmiBodyFigure bmi={bmi} color={zoneStyle?.fill || colors.inkFaint} height={200} />
          </View>
        )}
        <View style={styles.heroText}>
          <Text style={styles.valueLabel}>BMI ของคุณ</Text>
          <Text style={[styles.value, zoneStyle && { color: zoneStyle.ink }]}>{hasValue ? bmi.toFixed(1) : '—'}</Text>
          <Text style={styles.unit}>กก./ม.²</Text>
          <View style={[styles.pill, { backgroundColor: zoneStyle?.fill || colors.surfaceMuted }]}>
            <Text style={[styles.pillText, { color: zoneStyle?.bandText || colors.inkMuted }]}>
              {isMinor ? 'ต้องใช้เกณฑ์เฉพาะอายุ' : category?.label || 'ยังประเมินไม่ได้'}
            </Text>
          </View>
          {!isMinor && healthyRange && (
            <View style={styles.healthyRow}>
              <Ionicons name="body-outline" size={18} color={colors.primary} />
              <Text style={styles.healthyText}>
                {`น้ำหนักตามเกณฑ์ (${heightCm} ซม.)\n`}
                <Text style={styles.healthyStrong}>{`${kg(healthyRange[0])}–${kg(healthyRange[1])} กก.`}</Text>
              </Text>
            </View>
          )}
        </View>
      </View>

      {!isMinor && <BmiZoneBand bmi={bmi} categoryKey={category?.key} />}

      <View style={styles.hintBox}>
        <Ionicons name="information-circle-outline" size={20} color={colors.inkMuted} style={styles.hintIcon} />
        <Text style={styles.hintText}>{hint}</Text>
      </View>

      <Text style={styles.note}>เกณฑ์คัดกรองสำหรับผู้ใหญ่เอเชียเท่านั้น · BMI ไม่ใช่การวินิจฉัยโรค</Text>
    </Card>
  );
}
