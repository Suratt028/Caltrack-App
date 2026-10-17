import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Line, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { lastNDays } from '../utils/calculations';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import Banner from '../components/Banner';
import EmptyState from '../components/EmptyState';
import styles from '../style/screens/TrendsScreenStyles';

const CHART_HEIGHT = 160;
const MIN_CHART_WIDTH = 240;
const MAX_CHART_WIDTH = 560;

const RANGES = [
  { key: 7, label: '7 วัน' },
  { key: 30, label: '30 วัน' },
];

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');

function CalorieTrendChart({ days, totalsByDay, goal, width }) {
  const safeGoal = Number(goal) > 0 ? Number(goal) : 2000;
  const maxVal = Math.max(safeGoal, ...days.map((d) => totalsByDay[d] || 0), 1);
  const barGap = days.length > 14 ? 4 : 10;
  const barWidth = Math.max((width - barGap * (days.length - 1)) / days.length, 2);
  const goalY = CHART_HEIGHT - (safeGoal / maxVal) * CHART_HEIGHT;
  const showEveryLabel = days.length > 10 ? Math.ceil(days.length / 6) : 1;

  return (
    <Svg width={width} height={CHART_HEIGHT + 26}>
      <Line x1={0} y1={0} x2={width} y2={0} stroke={colors.border} strokeWidth={1} />
      <SvgText x={0} y={12} fontSize="9" fill={colors.inkFaint}>
        {`สูงสุด ${formatNumber(maxVal)}`}
      </SvgText>
      <Line
        x1={0}
        y1={goalY}
        x2={width}
        y2={goalY}
        stroke={colors.inkFaint}
        strokeDasharray="4,4"
        strokeWidth={1}
      />
      <SvgText x={width} y={Math.max(goalY - 5, 10)} fontSize="9" fill={colors.inkMuted} textAnchor="end">
        {`เป้าหมาย ${formatNumber(safeGoal)} kcal`}
      </SvgText>
      {days.map((d, i) => {
        const val = totalsByDay[d] || 0;
        const barHeight = maxVal > 0 ? (val / maxVal) * CHART_HEIGHT : 0;
        const x = i * (barWidth + barGap);
        const y = CHART_HEIGHT - barHeight;
        const isOver = val > safeGoal;
        const label = new Date(d).toLocaleDateString('th-TH', { weekday: 'short' });
        const showLabel = showEveryLabel === 1 || i % showEveryLabel === 0 || i === days.length - 1;
        return (
          <React.Fragment key={d}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx={4}
              fill={isOver ? colors.chili : colors.primary}
            />
            {showLabel && (
              <SvgText
                x={x + barWidth / 2}
                y={CHART_HEIGHT + 16}
                fontSize="10"
                fill={colors.inkMuted}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function WeightTrendChart({ points, width }) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = CHART_HEIGHT - ((p.weight - min) / range) * (CHART_HEIGHT - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <SvgText x={0} y={12} fontSize="9" fill={colors.inkFaint}>
        {`สูงสุด ${max.toFixed(1)} กก.`}
      </SvgText>
      <SvgText x={0} y={CHART_HEIGHT - 4} fontSize="9" fill={colors.inkFaint}>
        {`ต่ำสุด ${min.toFixed(1)} กก.`}
      </SvgText>
      <Polyline points={coords.join(' ')} fill="none" stroke={colors.turmeric} strokeWidth={3} strokeLinejoin="round" />
      {points.map((p, i) => {
        const [x, y] = coords[i].split(',').map(Number);
        return <Circle key={p.date} cx={x} cy={y} r={4} fill={colors.turmeric} />;
      })}
    </Svg>
  );
}

export default function TrendsScreen() {
  const { profile, logsByDay, weightsByDay, logWeight } = useApp();
  const [range, setRange] = useState(7);
  const [chartWidth, setChartWidth] = useState(320);
  const [weightInput, setWeightInput] = useState('');
  const [weightNotice, setWeightNotice] = useState('');
  const [weightError, setWeightError] = useState('');

  const days = useMemo(() => lastNDays(range), [range]);

  const totalsByDay = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      const entries = logsByDay[d] || [];
      map[d] = entries.reduce((sum, e) => sum + (e.kcal || 0), 0);
    });
    return map;
  }, [days, logsByDay]);

  const values = days.map((d) => totalsByDay[d] || 0);
  const loggedDays = values.filter((v) => v > 0).length;
  const hasData = loggedDays > 0;
  // Keeps the original weekly average: total calories divided by the number of
  // days in the selected range (days without logs count as 0).
  const avgKcal = Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));
  const goal = Number(profile?.calorieGoal) > 0 ? Number(profile.calorieGoal) : 2000;

  const weightPoints = useMemo(
    () =>
      Object.entries(weightsByDay)
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .slice(-14)
        .map(([date, weight]) => ({ date, weight })),
    [weightsByDay]
  );

  const insight = useMemo(() => {
    if (!hasData) {
      return 'ยังไม่มีข้อมูลการบันทึกในช่วงนี้ เริ่มบันทึกมื้ออาหารวันนี้เพื่อดูแนวโน้มของคุณ';
    }
    const diff = avgKcal - goal;
    const tolerance = goal * 0.1;
    if (Math.abs(diff) <= tolerance) {
      return `ค่าเฉลี่ย ${formatNumber(avgKcal)} kcal ต่อวัน ใกล้เคียงเป้าหมาย ${formatNumber(goal)} kcal ถือว่าคงที่และควบคุมได้ดี`;
    }
    if (diff > 0) {
      return `ค่าเฉลี่ย ${formatNumber(avgKcal)} kcal ต่อวัน สูงกว่าเป้าหมายประมาณ ${formatNumber(diff)} kcal ปรับมื้อใดมื้อหนึ่งเล็กน้อยก็ช่วยได้`;
    }
    return `ค่าเฉลี่ย ${formatNumber(avgKcal)} kcal ต่อวัน ต่ำกว่าเป้าหมายประมาณ ${formatNumber(-diff)} kcal อย่าลืมกินให้พอต่อความต้องการของร่างกาย`;
  }, [avgKcal, goal, hasData]);

  const onChartLayout = (event) => {
    const layoutWidth = event?.nativeEvent?.layout?.width;
    if (!layoutWidth) return;
    const next = Math.round(Math.min(Math.max(layoutWidth, MIN_CHART_WIDTH), MAX_CHART_WIDTH));
    if (next !== chartWidth) setChartWidth(next);
  };

  const saveWeight = async () => {
    const val = Number(weightInput);
    if (!val || val < 20 || val > 400) {
      setWeightNotice('');
      setWeightError('กรอกน้ำหนักเป็นตัวเลขระหว่าง 20–400 กก.');
      return;
    }
    setWeightError('');
    await logWeight(val);
    setWeightInput('');
    setWeightNotice(`บันทึกน้ำหนัก ${val} กก. แล้ว`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>แนวโน้มและรายงาน</Text>
        <Text style={styles.subtitle}>ดูภาพรวมการกินและน้ำหนักย้อนหลัง พร้อมคำอธิบายที่เข้าใจง่าย</Text>

        <View style={styles.periodRow}>
          {RANGES.map((item) => {
            const active = range === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setRange(item.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`ดูข้อมูลย้อนหลัง ${item.label}`}
                style={({ pressed }) => [
                  styles.periodChip,
                  active && styles.periodChipActive,
                  pressed && styles.periodChipPressed,
                ]}
              >
                <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>แคลอรี่เฉลี่ย</Text>
            <Text style={styles.summaryValue}>{hasData ? formatNumber(avgKcal) : '—'}</Text>
            <Text style={styles.summaryUnit}>kcal/วัน เฉลี่ยทั้งช่วง</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>เป้าหมาย</Text>
            <Text style={styles.summaryValue}>{formatNumber(goal)}</Text>
            <Text style={styles.summaryUnit}>kcal/วัน</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>วันที่บันทึก</Text>
            <Text style={styles.summaryValue}>{loggedDays}</Text>
            <Text style={styles.summaryUnit}>จาก {range} วัน</Text>
          </View>
        </View>

        {!hasData && (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="stats-chart-outline"
              title="ยังไม่มีข้อมูลในช่วงนี้"
              message={`เมื่อคุณบันทึกอาหารครบใน ${range} วัน จะเห็นกราฟเปรียบเทียบกับเป้าหมายที่นี่`}
            />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>แคลอรี่ที่ได้รับ</Text>
          <Text style={styles.cardSubtitle}>
            แกนตั้งคือแคลอรี่ (kcal) · แกนนอนคือวันในสัปดาห์ที่เลือก
          </Text>
          <View style={styles.chartWrap} onLayout={onChartLayout}>
            <CalorieTrendChart days={days} totalsByDay={totalsByDay} goal={goal} width={chartWidth} />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>ภายในเป้าหมาย</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.chili }]} />
              <Text style={styles.legendText}>เกินเป้าหมาย</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendLine} />
              <Text style={styles.legendText}>เป้าหมายรายวัน</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>แนวโน้มน้ำหนัก</Text>
          <Text style={styles.cardSubtitle}>หน่วยเป็นกิโลกรัม (กก.) แสดงสูงสุด 14 ครั้งล่าสุด</Text>
          {weightPoints.length >= 2 ? (
            <View style={styles.chartWrap} onLayout={onChartLayout}>
              <WeightTrendChart points={weightPoints} width={chartWidth} />
            </View>
          ) : (
            <Text style={styles.cardSubtitle}>
              บันทึกน้ำหนักอย่างน้อย 2 ครั้งเพื่อดูกราฟแนวโน้ม
            </Text>
          )}
          <View style={styles.weightInputRow}>
            <TextInput
              style={styles.weightInput}
              placeholder={`น้ำหนักวันนี้ (กก.) เช่น ${profile?.weightKg || 60}`}
              placeholderTextColor={colors.inkFaint}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={(text) => {
                setWeightInput(text);
                if (weightError) setWeightError('');
              }}
              accessibilityLabel="น้ำหนักวันนี้ หน่วยกิโลกรัม"
            />
            <PrimaryButton title="บันทึก" icon="checkmark" onPress={saveWeight} style={{ minWidth: 104 }} />
          </View>
          {!!weightError && (
            <Banner tone="error" message={weightError} style={{ marginTop: spacing.sm }} />
          )}
          {!!weightNotice && (
            <Banner
              tone="success"
              message={weightNotice}
              onDismiss={() => setWeightNotice('')}
              style={{ marginTop: spacing.sm }}
            />
          )}
        </View>

        <View style={styles.insightBox}>
          <Text style={styles.insightTitle}>สรุปช่วง {range} วันล่าสุด</Text>
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
