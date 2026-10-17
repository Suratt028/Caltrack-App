import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import Card from '../components/Card';
import FoodItemRow from '../components/FoodItemRow';
import EmptyState from '../components/EmptyState';
import Banner from '../components/Banner';
import { MEALS as MEAL_OPTIONS, MEAL_LABEL } from '../components/MealChips';
import { calculateMacroGoals, GOALS, todayKey } from '../utils/calculations';
import { confirmAction } from '../utils/confirm';
import styles from '../style/screens/HomeScreenStyles';

const greetingForHour = (hour) => {
  if (hour < 12) return 'สวัสดีตอนเช้า';
  if (hour < 17) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
};

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');

export default function HomeScreen({ navigation }) {
  const { profile, user, getDayTotals, logsByDay, removeFoodLog } = useApp();
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);

  const rawTotals = getDayTotals() || {};
  const totals = {
    kcal: Number(rawTotals.kcal) || 0,
    protein: Number(rawTotals.protein) || 0,
    carbs: Number(rawTotals.carbs) || 0,
    fat: Number(rawTotals.fat) || 0,
  };

  // Every goal value comes from the saved profile — never hardcoded.
  const calorieGoal = Number(profile?.calorieGoal) || 2000;
  const macroGoals = profile?.macroGoals || calculateMacroGoals(calorieGoal);
  const goalLabel = GOALS.find((item) => item.key === profile?.goal)?.label;

  const todayEntries = logsByDay[todayKey()] || [];
  const remaining = Math.max(calorieGoal - totals.kcal, 0);
  const overGoal = totals.kcal > calorieGoal;
  const greetingName = user?.displayName || 'คุณ';
  const dateLabel = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const showNotice = useCallback((message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 2800);
  }, []);

  const askRemove = (entry) => {
    confirmAction({
      title: 'ลบรายการนี้ออกจากบันทึกวันนี้?',
      message: `${entry.name} · ${Math.round(Number(entry.kcal) || 0)} kcal`,
      confirmLabel: 'ลบรายการ',
      onConfirm: async () => {
        await removeFoodLog(entry.id);
        showNotice(`ลบ "${entry.name}" แล้ว`);
      },
    });
  };

  const groupedMeals = MEAL_OPTIONS.map((meal) => {
    const entries = todayEntries.filter((entry) => entry.meal === meal.key);
    return {
      ...meal,
      entries,
      kcal: entries.reduce((sum, entry) => sum + (Number(entry.kcal) || 0), 0),
    };
  });
  const otherEntries = todayEntries.filter((entry) => !MEAL_LABEL[entry.meal]);
  if (otherEntries.length > 0) {
    groupedMeals.push({
      key: 'other',
      label: 'รายการอื่น ๆ',
      entries: otherEntries,
      kcal: otherEntries.reduce((sum, entry) => sum + (Number(entry.kcal) || 0), 0),
    });
  }

  const coachMessage = totals.kcal === 0
    ? 'วันนี้ยังไม่มีรายการอาหาร เริ่มจากบันทึกมื้อแรกได้เลย'
    : overGoal
      ? `วันนี้เกินเป้าหมายอยู่ ${formatNumber(totals.kcal - calorieGoal)} kcal ไม่เป็นไร พรุ่งนี้เริ่มใหม่ได้เสมอ`
      : `ทำได้ดีมาก วันนี้ยังเหลืออีก ${formatNumber(remaining)} kcal`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{greetingForHour(new Date().getHours())}</Text>
            <Text style={styles.greeting} numberOfLines={1}>{greetingName}</Text>
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
          <View style={styles.avatar} accessible accessibilityLabel={`โปรไฟล์ของ ${greetingName}`}>
            <Text style={styles.avatarText}>{greetingName.slice(0, 1)}</Text>
          </View>
        </View>

        <View style={styles.coachCard}>
          <View style={styles.coachIcon}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
          <Text style={styles.coachText}>{coachMessage}</Text>
        </View>

        {!!notice && (
          <Banner
            tone="success"
            message={notice}
            onDismiss={() => setNotice('')}
            style={{ marginBottom: spacing.md }}
          />
        )}

        <Card style={styles.ringCard}>
          <CalorieRing consumed={totals.kcal} goal={calorieGoal} />
          <Text style={styles.ringCaption}>
            {overGoal ? 'วันนี้รับไป ' : 'กินไปแล้ว '}
            <Text style={styles.ringCaptionStrong}>{formatNumber(totals.kcal)} kcal</Text>
            {' จากเป้าหมาย '}
            <Text style={styles.ringCaptionStrong}>{formatNumber(calorieGoal)} kcal</Text>
          </Text>
          <View style={styles.ringStatsRow}>
            <View style={styles.ringStat}>
              <Text style={styles.ringStatValue}>{formatNumber(totals.kcal)}</Text>
              <Text style={styles.ringStatLabel}>กินแล้ว (kcal)</Text>
            </View>
            <View style={styles.ringStatDivider} />
            <View style={styles.ringStat}>
              <Text style={styles.ringStatValue}>{formatNumber(calorieGoal)}</Text>
              <Text style={styles.ringStatLabel}>เป้าหมาย (kcal)</Text>
            </View>
            <View style={styles.ringStatDivider} />
            <View style={styles.ringStat}>
              <Text style={[styles.ringStatValue, overGoal && { color: colors.carbStrong }]}>
                {formatNumber(overGoal ? totals.kcal - calorieGoal : remaining)}
              </Text>
              <Text style={styles.ringStatLabel}>{overGoal ? 'เกิน (kcal)' : 'เหลือ (kcal)'}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.quickActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="บันทึกอาหาร"
            accessibilityHint="เปิดหน้าค้นหาเมนูอาหารเพื่อบันทึกมื้อนี้"
            onPress={() => navigation.navigate('Log')}
            style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="search" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>บันทึกอาหาร</Text>
            <Text style={styles.quickHint}>ค้นหาเมนูและระบุปริมาณ</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="สแกนอาหารด้วย AI"
            accessibilityHint="เปิดกล้องเพื่อประเมินแคลอรี่จากรูปอาหาร"
            onPress={() => navigation.navigate('Scan')}
            style={({ pressed }) => [
              styles.quickAction,
              styles.quickActionAccent,
              pressed && styles.quickActionPressed,
            ]}
          >
            <View style={[styles.quickIconWrap, styles.quickIconWrapAccent]}>
              <Ionicons name="camera" size={20} color={colors.white} />
            </View>
            <Text style={[styles.quickLabel, styles.quickLabelAccent]}>สแกนด้วย AI</Text>
            <Text style={[styles.quickHint, styles.quickHintAccent]}>ถ่ายรูปแล้วให้ AI ประเมิน</Text>
          </Pressable>
        </View>

        <Card style={styles.macroCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>สารอาหารวันนี้</Text>
            <Text style={styles.sectionHint}>{goalLabel ? `เป้าหมาย: ${goalLabel}` : 'เป้าหมายรายวัน'}</Text>
          </View>
          <MacroBar label="โปรตีน" consumed={totals.protein} goal={macroGoals.protein} color={colors.protein} />
          <MacroBar label="คาร์โบไฮเดรต" consumed={totals.carbs} goal={macroGoals.carbs} color={colors.carbs} />
          <MacroBar label="ไขมัน" consumed={totals.fat} goal={macroGoals.fat} color={colors.fat} />
        </Card>

        <View style={styles.mealsHeader}>
          <Text style={styles.sectionTitle}>มื้ออาหารวันนี้</Text>
          <Text style={styles.mealCount}>
            {todayEntries.length} รายการ · {formatNumber(totals.kcal)} kcal
          </Text>
        </View>

        {todayEntries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="restaurant-outline"
              title="ยังไม่มีรายการอาหารวันนี้"
              message="บันทึกมื้อแรกเพื่อดูแคลอรี่และสารอาหารคงเหลือแบบเรียลไทม์"
              actionTitle="บันทึกอาหาร"
              onAction={() => navigation.navigate('Log')}
            />
          </View>
        ) : (
          groupedMeals
            .filter((group) => group.entries.length > 0)
            .map((group) => (
              <View key={group.key} style={styles.mealGroup}>
                <View style={styles.mealGroupHeader}>
                  <Text style={styles.mealGroupTitle}>{group.label}</Text>
                  <Text style={styles.mealGroupKcal}>
                    {group.entries.length} รายการ · {formatNumber(group.kcal)} kcal
                  </Text>
                </View>
                {group.entries
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <FoodItemRow
                      key={entry.id}
                      name={entry.name}
                      subtitle={entry.servings && entry.servings !== 1 ? `${entry.servings} หน่วย` : undefined}
                      kcal={entry.kcal}
                      onRemove={() => askRemove(entry)}
                    />
                  ))}
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
