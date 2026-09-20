import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Line, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography, radius } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { lastNDays, todayKey } from '../utils/calculations';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import styles from '../style/screens/TrendsScreenStyles';

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const BAR_GAP = 10;

function CalorieTrendChart({ days, totalsByDay, goal }) {
  const barWidth = (CHART_WIDTH - BAR_GAP * (days.length - 1)) / days.length;
  const maxVal = Math.max(goal, ...days.map((d) => totalsByDay[d] || 0), 1);
  const goalY = CHART_HEIGHT - (goal / maxVal) * CHART_HEIGHT;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 24}>
      <Line x1={0} y1={goalY} x2={CHART_WIDTH} y2={goalY} stroke={colors.inkFaint} strokeDasharray="4,4" strokeWidth={1} />
      {days.map((d, i) => {
        const val = totalsByDay[d] || 0;
        const barHeight = maxVal > 0 ? (val / maxVal) * CHART_HEIGHT : 0;
        const x = i * (barWidth + BAR_GAP);
        const y = CHART_HEIGHT - barHeight;
        const isOver = val > goal;
        const label = new Date(d).toLocaleDateString('th-TH', { weekday: 'short' });
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
            <SvgText x={x + barWidth / 2} y={CHART_HEIGHT + 16} fontSize="10" fill={colors.inkMuted} textAnchor="middle">
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function WeightTrendChart({ points }) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = CHART_WIDTH / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = CHART_HEIGHT - ((p.weight - min) / range) * (CHART_HEIGHT - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
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
  const [weightInput, setWeightInput] = useState('');
  const [savedWeight, setSavedWeight] = useState(false);

  const days = useMemo(() => lastNDays(7), []);

  const totalsByDay = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      const entries = logsByDay[d] || [];
      map[d] = entries.reduce((sum, e) => sum + (e.kcal || 0), 0);
    });
    return map;
  }, [days, logsByDay]);

  const avgKcal = useMemo(() => {
    const vals = days.map((d) => totalsByDay[d] || 0);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [days, totalsByDay]);

  const weightPoints = useMemo(
    () =>
      Object.entries(weightsByDay)
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .slice(-14)
        .map(([date, weight]) => ({ date, weight })),
    [weightsByDay]
  );

  const saveWeight = async () => {
    const val = Number(weightInput);
    if (!val) return;
    await logWeight(val);
    setWeightInput('');
    setSavedWeight(true);
    setTimeout(() => setSavedWeight(false), 1500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>สถิติ</Text>
        <Text style={styles.subtitle}>ภาพรวม 7 วันล่าสุด</Text>

        <View style={styles.periodRow}>
          <View style={[styles.periodChip, styles.periodChipActive]}>
            <Text style={[styles.periodChipText, styles.periodChipTextActive]}>รายสัปดาห์</Text>
          </View>
          <View style={styles.periodChip}>
            <Text style={styles.periodChipText}>รายเดือน</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>แคลอรี่เฉลี่ย</Text>
            <Text style={styles.summaryValue}>{avgKcal}</Text>
            <Text style={styles.summaryUnit}>kcal/วัน</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>เป้าหมาย</Text>
            <Text style={styles.summaryValue}>{profile.calorieGoal}</Text>
            <Text style={styles.summaryUnit}>kcal/วัน</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>แคลอรี่ที่ได้รับ</Text>
          <View style={styles.chartContainer}>
            <CalorieTrendChart days={days} totalsByDay={totalsByDay} goal={profile.calorieGoal} />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>ในเป้าหมาย</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.chili }]} />
              <Text style={styles.legendText}>เกินเป้าหมาย</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>แนวโน้มน้ำหนัก</Text>
          {weightPoints.length >= 2 ? (
            <View style={styles.chartContainer}><WeightTrendChart points={weightPoints} /></View>
          ) : (
            <Text style={styles.cardSubtitle}>บันทึกน้ำหนักอย่างน้อย 2 ครั้งเพื่อดูกราฟแนวโน้ม</Text>
          )}
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <TextInput
              style={{ flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.ink, marginRight: 8 }}
              placeholder={`น้ำหนักวันนี้ (กก.) เช่น ${profile.weightKg}`}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
            />
            <PrimaryButton title={savedWeight ? '✓' : 'บันทึก'} onPress={saveWeight} style={{ minWidth: 96 }} />
          </View>
        </View>

        <View style={styles.insightBox}>
          <Text style={styles.insightTitle}>สรุปประจำสัปดาห์</Text>
          <Text style={styles.insightText}>คุณกำลังคงที่และยังอยู่ในช่วงควบคุมแคลอรี่ได้ดี โดยมีค่าเฉลี่ย {avgKcal} kcal ต่อวัน</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
