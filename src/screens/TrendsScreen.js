import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';
import { useLayout } from '../theme/layout';
import { useApp } from '../context/AppContext';
import Screen from '../components/Screen';
import { calculateMacroGoals, lastNDays, todayKey } from '../utils/calculations';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import Banner from '../components/Banner';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedControl from '../components/SegmentedControl';
import TrendStatCard from '../components/TrendStatCard';
import TrendBarChart from '../components/TrendBarChart';
import MacroBarChart from '../components/MacroBarChart';
import TrendDataTable from '../components/TrendDataTable';
import styles from '../style/screens/TrendsScreenStyles';

const WEIGHT_CHART_HEIGHT = 160;

const RANGE_OPTIONS = [
  { value: '7', label: '7 วัน' },
  { value: '30', label: '30 วัน' },
  { value: 'custom', label: 'เลือกช่วง' },
];

const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_MONTHS_LONG = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');
const isDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const parseKey = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
};
const shiftKey = (key, delta) => {
  const date = parseKey(key);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
};
const dayNumber = (key) => String(parseKey(key).getUTCDate());
const shortDateFull = (key) => {
  const date = parseKey(key);
  return `${date.getUTCDate()} ${THAI_MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear() + 543}`;
};

function WeightTrendChart({ points, width }) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = WEIGHT_CHART_HEIGHT - ((p.weight - min) / range) * (WEIGHT_CHART_HEIGHT - 20) - 10;
    return `${x},${y}`;
  });

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`กราฟแนวโน้มน้ำหนัก สูงสุด ${max.toFixed(1)} กิโลกรัม ต่ำสุด ${min.toFixed(1)} กิโลกรัม`}
    >
      <Svg width={width} height={WEIGHT_CHART_HEIGHT}>
        <SvgText x={0} y={12} fontSize="9" fill={colors.inkFaint}>
          {`สูงสุด ${max.toFixed(1)} กก.`}
        </SvgText>
        <SvgText x={0} y={WEIGHT_CHART_HEIGHT - 4} fontSize="9" fill={colors.inkFaint}>
          {`ต่ำสุด ${min.toFixed(1)} กก.`}
        </SvgText>
        <Polyline points={coords.join(' ')} fill="none" stroke={colors.turmeric} strokeWidth={3} strokeLinejoin="round" />
        {points.map((p, i) => {
          const [x, y] = coords[i].split(',').map(Number);
          return <Circle key={p.date} cx={x} cy={y} r={4} fill={colors.turmeric} />;
        })}
      </Svg>
    </View>
  );
}

export default function TrendsScreen({ navigation }) {
  const { profile, logsByDay, weightsByDay, logWeight, getDayTotals } = useApp();
  // Phone: one summary card, charts stacked. Tablet/desktop: stat cards in a
  // row; desktop also puts the two charts side by side.
  const { isWide: isSmUp, isDesktop: isLgUp } = useLayout();

  const [range, setRange] = useState('7');
  const [rangeOffset, setRangeOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState(() => lastNDays(7)[0]);
  const [customTo, setCustomTo] = useState(() => lastNDays(7)[6]);
  const [chartWidth, setChartWidth] = useState(320);
  const [weightInput, setWeightInput] = useState('');
  const [weightNotice, setWeightNotice] = useState('');
  const [weightError, setWeightError] = useState('');

  const today = todayKey();
  const goal = Number(profile?.calorieGoal) > 0 ? Number(profile.calorieGoal) : null;
  const macroGoals = goal ? profile?.macroGoals || calculateMacroGoals(goal) : null;
  const windowLength = range === '30' ? 30 : 7;

  // Selected window: last 7 / 30 days (optionally shifted back) or a custom range.
  const days = useMemo(() => {
    if (range === 'custom') {
      if (!isDateKey(customFrom) || !isDateKey(customTo) || customFrom > customTo) return [];
      const out = [];
      let cursor = customFrom;
      let guard = 0;
      while (cursor <= customTo && out.length < 60 && guard < 400) {
        out.push(cursor);
        cursor = shiftKey(cursor, 1);
        guard += 1;
      }
      return out;
    }
    const back = rangeOffset * windowLength;
    const base = lastNDays(windowLength);
    return back > 0 ? base.map((key) => shiftKey(key, -back)) : base;
  }, [range, rangeOffset, windowLength, customFrom, customTo]);

  const dayData = useMemo(
    () =>
      days.map((date) => {
        if (!logsByDay[date]?.length) return null;
        const totals = getDayTotals(date) || {};
        return {
          date,
          kcal: Number(totals.kcal) || 0,
          protein: Number(totals.protein) || 0,
          carbs: Number(totals.carbs) || 0,
          fat: Number(totals.fat) || 0,
        };
      }).filter(
        (day) => day && (day.kcal > 0 || day.protein + day.carbs + day.fat > 0)
      ),
    [days, getDayTotals, logsByDay]
  );

  const loggedDays = dayData;
  const enough = loggedDays.length >= 3;
  const avgKcal = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, day) => sum + day.kcal, 0) / loggedDays.length)
    : 0;
  const completeDays = useMemo(
    () => loggedDays.filter((day) => day.date !== today),
    [loggedDays, today]
  );
  const prevAvgKcal = completeDays.length
    ? Math.round(completeDays.reduce((sum, day) => sum + day.kcal, 0) / completeDays.length)
    : 0;
  // Headline average covers every logged day (as in the design); when today is
  // still in progress it says so, and the "previous days" figure leaves it out.
  const includesToday = completeDays.length !== loggedDays.length;
  const headlineAvg = avgKcal;
  const headlineNote = includesToday
    ? 'รวมวันนี้ที่ยังไม่ครบวัน · จากข้อมูลที่บันทึกเท่านั้น'
    : 'จากวันที่บันทึกเท่านั้น';
  const selectedDay = dayData.length ? dayData[dayData.length - 1] : null;

  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const rangeLabel = useMemo(() => {
    if (range === 'custom') return 'กำหนดช่วงเอง';
    if (!firstDay || !lastDay) return '';
    if (firstDay.slice(0, 7) === lastDay.slice(0, 7)) {
      const from = parseKey(firstDay);
      const to = parseKey(lastDay);
      return `${from.getUTCDate()}–${to.getUTCDate()} ${THAI_MONTHS_LONG[to.getUTCMonth()]} ${to.getUTCFullYear() + 543}`;
    }
    return `${shortDateFull(firstDay)} – ${shortDateFull(lastDay)}`;
  }, [range, firstDay, lastDay]);

  const statsBody = useMemo(() => {
    if (!firstDay || !lastDay) return '';
    if (firstDay.slice(0, 7) === lastDay.slice(0, 7)) {
      const to = parseKey(lastDay);
      return `ข้อมูลจาก ${dayNumber(firstDay)}–${dayNumber(lastDay)} ${THAI_MONTHS_LONG[to.getUTCMonth()]} ${to.getUTCFullYear() + 543}`;
    }
    return `ข้อมูลจาก ${shortDateFull(firstDay)} – ${shortDateFull(lastDay)}`;
  }, [firstDay, lastDay]);

  const monthCaption = useMemo(() => {
    if (!lastDay) return rangeLabel;
    if (lastDay === today) {
      const to = parseKey(lastDay);
      return `${THAI_MONTHS_LONG[to.getUTCMonth()]} ${to.getUTCFullYear() + 543} · วันที่ ${dayNumber(lastDay)} ยังบันทึกไม่ครบวัน`;
    }
    return rangeLabel;
  }, [lastDay, today, rangeLabel]);

  const canGoForward =
    range === 'custom'
      ? isDateKey(customFrom) && isDateKey(customTo) && customTo < today
      : rangeOffset > 0;

  const moveRange = (direction) => {
    if (range === 'custom') {
      if (!isDateKey(customFrom) || !isDateKey(customTo)) return;
      const step = Math.max(days.length, 1);
      const nextFrom = shiftKey(customFrom, direction * step);
      const nextTo = shiftKey(customTo, direction * step);
      if (direction > 0 && nextTo > today) return;
      setCustomFrom(nextFrom);
      setCustomTo(nextTo);
      return;
    }
    setRangeOffset((prev) => (direction < 0 ? prev + 1 : Math.max(prev - 1, 0)));
  };

  const energyData = useMemo(
    () => dayData.map((day) => ({ date: day.date, value: day.kcal, highlight: day.date === today })),
    [dayData, today]
  );
  const macroData = useMemo(
    () =>
      dayData.map((day) => ({
        date: day.date,
        partial: day.date === today,
        protein: day.protein,
        carbs: day.carbs,
        fat: day.fat,
      })),
    [dayData, today]
  );
  const tableRows = useMemo(
    () => dayData.map((day) => ({ ...day, isToday: day.date === today })),
    [dayData, today]
  );
  const showYear = Boolean(firstDay && lastDay && firstDay.slice(0, 4) !== lastDay.slice(0, 4));

  const weightPoints = useMemo(
    () =>
      Object.entries(weightsByDay)
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .slice(-14)
        .map(([date, weight]) => ({ date, weight })),
    [weightsByDay]
  );

  const onWeightChartLayout = (event) => {
    const layoutWidth = event?.nativeEvent?.layout?.width;
    if (!layoutWidth) return;
    const next = Math.round(Math.min(Math.max(layoutWidth, 240), 560));
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
    setWeightNotice('');
    try {
      await logWeight(val);
      setWeightInput('');
      setWeightNotice(`บันทึกน้ำหนัก ${val} กก. แล้ว`);
    } catch (error) {
      setWeightError(error?.message || 'บันทึกน้ำหนักไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <Screen>
        <ScreenHeader
          title="แนวโน้มของคุณ"
          subtitle={
            isSmUp
              ? 'มองเห็นจังหวะการกินจากข้อมูลที่คุณบันทึก ไม่ใช่คะแนนตัดสิน'
              : 'มองเห็นจังหวะการกิน ไม่ใช่คะแนนตัดสิน'
          }
          right={
            isSmUp ? (
              <View style={styles.dateChip} accessible accessibilityLabel={`วันนี้ ${shortDateFull(today)}`}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.dateChipText}>{shortDateFull(today)}</Text>
              </View>
            ) : null
          }
        />

        {/* Range picker + date navigator */}
        <View style={[styles.controlsRow, isSmUp && styles.controlsRowWide]}>
          <View style={[styles.segmentWrap, isSmUp && styles.segmentWrapWide]}>
            <SegmentedControl
              label="เลือกช่วงเวลาของแนวโน้ม"
              size="sm"
              options={RANGE_OPTIONS}
              value={range}
              onChange={(next) => {
                setRange(next);
                setRangeOffset(0);
              }}
            />
          </View>

          <View style={[styles.navigator, isSmUp && styles.navigatorWide]}>
            <Pressable
              onPress={() => moveRange(-1)}
              accessibilityRole="button"
              accessibilityLabel="ช่วงก่อนหน้า"
              style={({ pressed }) => [styles.navBtn, isSmUp && styles.navBtnPlain, pressed && styles.navBtnPressed]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
            </Pressable>
            <Text style={[styles.navLabel, isSmUp && styles.navLabelWide]} numberOfLines={1}>
              {rangeLabel || 'กำหนดช่วงเอง'}
            </Text>
            <Pressable
              onPress={() => moveRange(1)}
              disabled={!canGoForward}
              accessibilityRole="button"
              accessibilityLabel="ช่วงถัดไป"
              style={({ pressed }) => [
                styles.navBtn,
                isSmUp && styles.navBtnPlain,
                pressed && canGoForward && styles.navBtnPressed,
                !canGoForward && styles.navBtnDisabled,
              ]}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Custom range inputs */}
        {range === 'custom' && (
          <Card style={styles.customCard}>
            <View style={styles.customRow}>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>ตั้งแต่</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={customFrom}
                  onChangeText={setCustomFrom}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.inkFaint}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="วันเริ่มต้นช่วง (YYYY-MM-DD)"
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>ถึง</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={customTo}
                  onChangeText={setCustomTo}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.inkFaint}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="วันสิ้นสุดช่วง (YYYY-MM-DD)"
                />
              </View>
            </View>
            <Text style={styles.customHint}>กรอกวันที่แบบ ปี-เดือน-วัน (ค.ศ.) แสดงได้สูงสุด 60 วันต่อครั้ง</Text>
          </Card>
        )}

        {!enough ? (
          <>
            <EmptyState
              size="lg"
              icon="analytics-outline"
              title={'ยังมีข้อมูลไม่พอ\nสำหรับดูแนวโน้ม'}
              message={'เริ่มบันทึกจากมื้อที่สะดวกได้เลย\nเมื่อมีข้อมูลอย่างน้อย 3 วัน\nเราจะช่วยแสดงภาพรวมให้คุณเห็น'}
            />

            <Card style={styles.tipCard}>
              <Text style={styles.cardTitle}>
                {loggedDays.length === 0
                  ? 'ช่วงนี้ยังไม่มีวันที่บันทึก'
                  : `ช่วงนี้บันทึกแล้ว ${loggedDays.length} วัน จาก 3 วันที่ต้องใช้`}
              </Text>
              <Text style={styles.cardBody}>
                ไม่แสดงกราฟหรือค่าเฉลี่ยแทนข้อมูลที่หายไป คุณเริ่มใหม่ได้ทุกเมื่อ ไม่ต้องย้อนบันทึกให้ครบ
              </Text>
            </Card>

            <PrimaryButton
              title={loggedDays.length === 0 ? 'บันทึกอาหารมื้อแรก' : 'บันทึกอาหารเพิ่ม'}
              icon="add"
              onPress={() => navigation.navigate('Log')}
              style={styles.cta}
            />
          </>
        ) : (
          <>
            {isSmUp ? (
              /* Wide: three stat cards in a row */
              <View style={styles.statRow}>
                <TrendStatCard
                  title="พลังงานเฉลี่ยต่อวัน"
                  value={`${formatNumber(headlineAvg)} kcal`}
                  body={headlineNote}
                  style={styles.statCardWide}
                />
                <TrendStatCard
                  title="วันที่มีการบันทึก"
                  value={`${loggedDays.length} วัน`}
                  body={statsBody}
                  style={styles.statCardWide}
                />
                {includesToday && completeDays.length > 0 ? (
                  <TrendStatCard
                    title={`เฉลี่ย ${completeDays.length} วันก่อนหน้า`}
                    value={`${formatNumber(prevAvgKcal)} kcal`}
                    body="แยกวันนี้ที่ยังบันทึกไม่ครบออก"
                    style={styles.statCardWide}
                  />
                ) : goal ? (
                  <TrendStatCard
                    title="เป้าหมายจากโปรไฟล์"
                    value={`${formatNumber(goal)} kcal`}
                    body="ต่อวัน · ดูหรือแก้ไขได้ที่โปรไฟล์"
                    style={styles.statCardWide}
                  />
                ) : null}
              </View>
            ) : (
              /* Phone: one summary card */
              <Card tone="mint" style={styles.mintCard}>
                <View style={styles.summaryHeadRow}>
                  <View style={styles.flexShrink}>
                    <Text style={styles.mintLabel}>พลังงานเฉลี่ยต่อวัน</Text>
                    <Text style={styles.summaryValue}>{`${formatNumber(headlineAvg)} kcal`}</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{`บันทึก ${loggedDays.length} วัน`}</Text>
                  </View>
                </View>
                <Text style={styles.mintNote}>{headlineNote}</Text>
              </Card>
            )}

            <View style={isLgUp ? styles.chartRow : null}>
            {/* Energy chart */}
            <Card style={[styles.chartCard, isLgUp && styles.chartCol]}>
              <Text style={styles.cardTitle}>พลังงานในแต่ละวัน</Text>
              <TrendBarChart
                data={energyData}
                goalValue={goal || undefined}
                goalLabel={goal ? `เป้าหมาย ${formatNumber(goal)}` : ''}
                axisUnit="กิโลแคลอรี"
                caption={monthCaption}
                title="พลังงานในแต่ละวัน"
                description="กราฟแท่งแสดงพลังงานที่บันทึกในแต่ละวัน หน่วยกิโลแคลอรี"
              />
            </Card>

            {/* Grouped protein / carbs / fat bars per logged day */}
            <Card style={[styles.chartCard, isLgUp && styles.chartCol]}>
              <Text style={styles.cardTitle}>สารอาหารในแต่ละวัน</Text>
              <MacroBarChart data={macroData} />
              {selectedDay && (
                <Text style={styles.selectedDay}>
                  {`${shortDateFull(selectedDay.date)} · โปรตีน ${formatNumber(selectedDay.protein)} / คาร์บ ${formatNumber(
                    selectedDay.carbs
                  )} / ไขมัน ${formatNumber(selectedDay.fat)} กรัม`}
                </Text>
              )}
              <Text style={styles.cardNote}>
                {macroGoals
                  ? `เป้าหมายจากโปรไฟล์ โปรตีน ${formatNumber(macroGoals.protein)} · คาร์บ ${formatNumber(macroGoals.carbs)} · ไขมัน ${formatNumber(macroGoals.fat)} กรัม\n`
                  : ''}
                ปริมาณเป็นกรัม ไม่ใช่สัดส่วนพลังงาน ดูตัวเลขรายวันได้จากตารางด้านล่าง
              </Text>
            </Card>

            </View>

            {/* Reminder */}
            <Card tone="mint" style={styles.mintCard}>
              <View style={styles.reminderHead}>
                <Ionicons name="leaf-outline" size={22} color={colors.primary} />
                <Text style={styles.reminderTitle}>แต่ละวันไม่จำเป็นต้องเหมือนกัน</Text>
              </View>
              <Text style={styles.reminderBody}>
                {includesToday && completeDays.length > 0
                  ? `${completeDays.length} วันก่อนเฉลี่ย ${formatNumber(prevAvgKcal)} kcal ส่วนวันนี้ยังไม่ครบ ความต่างอาจมาจากมื้อที่ยังไม่ได้บันทึก`
                  : 'นับเฉพาะวันที่มีข้อมูล วันที่ไม่มีรายการจะไม่ถูกนับเป็นศูนย์'}
                {'\nใช้ภาพรวมนี้ค่อย ๆ ทำความรู้จักตัวเองนะ'}
              </Text>
            </Card>

            {/* Data table (accessible alternative) */}
            <Card style={styles.tableCard}>
              <TrendDataTable
                title="ตัวเลขรายวัน"
                meta={goal ? `เป้าหมายจากโปรไฟล์ ${formatNumber(goal)} kcal` : undefined}
                rows={tableRows}
                showYear={showYear}
              />
            </Card>
          </>
        )}

        {/* Weight trend — extra feature kept from the original screen */}
        <Card style={styles.weightCard}>
          <Text style={styles.cardTitle}>แนวโน้มน้ำหนัก</Text>
          <Text style={styles.cardSubtitle}>หน่วยเป็นกิโลกรัม (กก.) แสดงสูงสุด 14 ครั้งล่าสุด</Text>
          {weightPoints.length >= 2 ? (
            <View style={styles.chartWrap} onLayout={onWeightChartLayout}>
              <WeightTrendChart points={weightPoints} width={chartWidth} />
            </View>
          ) : (
            <Text style={styles.cardNote}>บันทึกน้ำหนักอย่างน้อย 2 ครั้งเพื่อดูกราฟแนวโน้ม</Text>
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
            <PrimaryButton title="บันทึก" icon="checkmark" onPress={saveWeight} style={styles.weightButton} />
          </View>
          {!!weightError && (
            <Banner tone="error" message={weightError} style={styles.bannerSpacing} />
          )}
          {!!weightNotice && (
            <Banner
              tone="success"
              message={weightNotice}
              onDismiss={() => setWeightNotice('')}
              style={styles.bannerSpacing}
            />
          )}
        </Card>
    </Screen>
  );
}
