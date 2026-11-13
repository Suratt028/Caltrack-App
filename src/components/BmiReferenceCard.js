import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from './AppText';
import Card from './Card';
import { BMI_CATEGORIES } from '../utils/calculations';
import { colors } from '../theme/colors';
import styles from '../style/components/BmiReferenceCardStyles';

// One soft palette for BMI zones (same family as the Trends BMI chart).
// Warmer for higher zones, never alarm-red: BMI is a screening number, not a verdict.
export const BMI_ZONE_STYLE = {
  low: { fill: '#C9DCEC', soft: colors.skySoft, ink: colors.skyDark },
  normal: { fill: '#BFD9C6', soft: colors.mint, ink: colors.primary },
  at_risk: { fill: '#EAD7AA', soft: colors.turmericSoft, ink: colors.turmericDark },
  obesity_1: { fill: '#E5C4B8', soft: colors.chiliSoft, ink: '#8E4A3B' },
  obesity_2: { fill: '#D9B1A4', soft: '#EFDCD5', ink: '#7A3E31' },
};

// Body silhouettes, one per zone, getting wider zone by zone (shoulder half-width, waist half-width).
const FIGURE_SHAPES = {
  low: { sh: 9, w: 8.5 },
  normal: { sh: 10, w: 10.5 },
  at_risk: { sh: 11.5, w: 13 },
  obesity_1: { sh: 13, w: 15.5 },
  obesity_2: { sh: 14.5, w: 18.5 },
};
// Short labels fit a fifth of a phone screen; exact ranges are in the table below.
const FIGURE_RANGES = {
  low: '<18.5',
  normal: '18.5+',
  at_risk: '23+',
  obesity_1: '25+',
  obesity_2: '30+',
};

function BodyFigure({ sh, w, color, size = 1 }) {
  const c = 30;
  const legX = Math.max(5, w * 0.5);
  const torso =
    `M ${c - sh} 25 Q ${c} 21 ${c + sh} 25 ` +
    `C ${c + w + 2} 34 ${c + w + 2} 50 ${c + w - 1} 60 ` +
    `L ${c - w + 1} 60 ` +
    `C ${c - w - 2} 50 ${c - w - 2} 34 ${c - sh} 25 Z`;
  return (
    <Svg width={48 * size} height={88 * size} viewBox="0 0 60 96">
      <Circle cx={c} cy={12} r={8} fill={color} />
      <Path d={torso} fill={color} />
      <Path
        d={`M ${c - sh} 27 L ${c - w - 5} 50 M ${c + sh} 27 L ${c + w + 5} 50`}
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M ${c - legX} 58 L ${c - legX} 92 M ${c + legX} 58 L ${c + legX} 92`}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** Row of body shapes, small to large, each in its zone colour; the user's zone stands out. */
function BodyScale({ bmi, category }) {
  const hasValue = Number.isFinite(bmi);
  return (
    <View
      style={styles.figureRow}
      accessible
      accessibilityRole="image"
      accessibilityLabel={hasValue
        ? `BMI ${bmi.toFixed(1)} อยู่ในช่วง${category?.label || ''} รูปร่างแสดงช่วง BMI ตั้งแต่ต่ำกว่าเกณฑ์ถึงอ้วนระดับ 2`
        : 'รูปร่างแสดงช่วง BMI ตั้งแต่ต่ำกว่าเกณฑ์ถึงอ้วนระดับ 2'}
    >
      {BMI_CATEGORIES.map((zone) => {
        const zs = BMI_ZONE_STYLE[zone.key];
        const active = category?.key === zone.key;
        return (
          <View
            key={zone.key}
            style={[
              styles.figureItem,
              active && { backgroundColor: zs.soft, borderColor: zs.ink },
            ]}
          >
            <View style={styles.figureBadgeSlot}>
              {active && hasValue && (
                <View style={[styles.figureBadge, { backgroundColor: zs.ink }]}>
                  <Text style={styles.figureBadgeText}>{bmi.toFixed(1)}</Text>
                </View>
              )}
            </View>
            <View style={{ opacity: category && !active ? 0.4 : 1 }}>
              <BodyFigure {...FIGURE_SHAPES[zone.key]} color={zs.ink} />
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.figureRange, active && { color: zs.ink, fontWeight: '800' }]}
            >
              {FIGURE_RANGES[zone.key]}
            </Text>
          </View>
        );
      })}
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
 * "BMI และช่วงอ้างอิง" card on the Profile screen: value + category pill,
 * body shapes per zone with the person's zone highlighted, the healthy weight range for
 * their height, and the Asian adult reference table.
 */
export default function BmiReferenceCard({ bmi, category, age, heightCm, style }) {
  const isMinor = Number(age) < 18;
  const zoneStyle = category ? BMI_ZONE_STYLE[category.key] : null;
  const heightM = Number(heightCm) / 100;
  const healthyRange = heightM > 0 ? [18.5 * heightM * heightM, 22.9 * heightM * heightM] : null;
  const hint = isMinor
    ? 'BMI ของผู้มีอายุต่ำกว่า 18 ปีต้องแปลผลเทียบกับอายุและเพศ ไม่ใช้เกณฑ์ผู้ใหญ่'
    : HINTS[category?.key] || (category ? HINTS.high : 'กรอกส่วนสูงและน้ำหนักเพื่อดู BMI');

  return (
    <Card style={style}>
      <Text style={styles.title}>BMI และช่วงอ้างอิง</Text>

      <View style={styles.summary}>
        <Text style={styles.value}>{Number.isFinite(bmi) ? bmi.toFixed(1) : '—'}</Text>
        <View style={styles.summaryText}>
          <View style={[styles.pill, { backgroundColor: zoneStyle?.soft || colors.surfaceMuted }]}>
            <Text style={[styles.pillText, { color: zoneStyle?.ink || colors.inkMuted }]}>
              {isMinor ? 'ต้องใช้เกณฑ์เฉพาะอายุ' : category?.label || 'ยังประเมินไม่ได้'}
            </Text>
          </View>
          <Text style={styles.unit}>กก./ม.²</Text>
        </View>
      </View>

      {!isMinor && <BodyScale bmi={bmi} category={category} />}

      {!isMinor && healthyRange && (
        <View style={styles.healthyRow}>
          <Ionicons name="body-outline" size={20} color={colors.primary} />
          <Text style={styles.healthyText}>
            {`น้ำหนักตามเกณฑ์สำหรับส่วนสูง ${heightCm} ซม.\n`}
            <Text style={styles.healthyStrong}>{`${kg(healthyRange[0])}–${kg(healthyRange[1])} กก.`}</Text>
          </Text>
        </View>
      )}

      <View style={styles.hintBox}>
        <Ionicons name="information-circle-outline" size={20} color={colors.inkMuted} style={styles.hintIcon} />
        <Text style={styles.hintText}>{hint}</Text>
      </View>

      <View style={styles.table}>
        {BMI_CATEGORIES.map((zone, index) => {
          const active = !isMinor && category?.key === zone.key;
          const zs = BMI_ZONE_STYLE[zone.key];
          return (
            <View
              key={zone.key}
              style={[
                styles.tableRow,
                index === BMI_CATEGORIES.length - 1 && styles.tableRowLast,
                active && { backgroundColor: zs.soft },
              ]}
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.swatch, { backgroundColor: zs.fill }]} />
              <Text style={[styles.tableName, active && { color: zs.ink, fontWeight: '700' }]}>{zone.label}</Text>
              {active && (
                <View style={[styles.youChip, { borderColor: zs.ink }]}>
                  <Text style={[styles.youChipText, { color: zs.ink }]}>คุณ</Text>
                </View>
              )}
              <Text style={[styles.tableRange, active && { color: zs.ink, fontWeight: '700' }]}>{zone.range}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.note}>เกณฑ์คัดกรองสำหรับผู้ใหญ่เอเชียเท่านั้น · BMI ไม่ใช่การวินิจฉัยโรค</Text>
    </Card>
  );
}
