import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useFoodLogs, useProfile } from '../data/useUserData';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import Banner from '../components/Banner';
import MealEntryCard from '../components/MealEntryCard';
import { MEALS, MEAL_LABEL } from '../components/MealChips';
import { calculateAgeBasedMacroGoals, calculateBMI, getBMICategory, todayKey } from '../utils/calculations';
import { confirmAction } from '../utils/confirm';
import styles from '../style/screens/HomeScreenStyles';

const formatNumber = (v) => Math.round(Number(v) || 0).toLocaleString('th-TH');

const sortByTime = (a, b) => String(a.time || '').localeCompare(String(b.time || ''));

function dateForOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

export default function HomeScreen({ navigation }) {
  const { user } = useApp();
  const { profile } = useProfile();
  const { getDayTotals, logsByDay, removeFoodLog } = useFoodLogs();
  const [notice, setNotice] = useState(null);
  // 0 = today, -1 = yesterday, …; the header arrows move between days.
  const [dayOffset, setDayOffset] = useState(0);
  const noticeTimer = useRef(null);

  const isToday = dayOffset === 0;
  const selectedDate = dateForOffset(dayOffset);
  const selectedKey = todayKey(selectedDate);
  const rawTotals = getDayTotals(selectedKey) || {};
  const totals = {
    kcal: Number(rawTotals.kcal) || 0,
    protein: Number(rawTotals.protein) || 0,
    carbs: Number(rawTotals.carbs) || 0,
    fat: Number(rawTotals.fat) || 0,
  };

  const todayEntries = logsByDay[selectedKey] || [];

  // Every goal value comes from the saved profile — never hardcoded.
  const hasGoal = Number(profile?.calorieGoal) > 0;
  const calorieGoal = hasGoal ? Number(profile.calorieGoal) : 0;
  const macroGoals = hasGoal ? profile?.macroGoals || calculateAgeBasedMacroGoals(calorieGoal, profile) : null;
  const bmi = profile ? calculateBMI(profile.weightKg, profile.heightCm) : null;
  const bmiCategory = Number(profile?.age) >= 18 ? getBMICategory(bmi) : null;
  const over = hasGoal && totals.kcal > calorieGoal;
  const overBy = over ? totals.kcal - calorieGoal : 0;

  const greetingName = profile?.displayName || user?.displayName || 'คุณ';
  const dateLabel = selectedDate.toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const dayTitle = isToday ? 'วันนี้' : dayOffset === -1 ? 'เมื่อวาน' : dateLabel;

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const showNotice = useCallback((message, tone = 'success') => {
    setNotice({ message, tone });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2800);
  }, []);

  const askRemove = (entry) => {
    confirmAction({
      title: `ลบรายการนี้ออกจากบันทึก${isToday ? 'วันนี้' : ''}?`,
      message: `${entry.name} · ${Math.round(Number(entry.kcal) || 0)} kcal`,
      confirmLabel: 'ลบรายการ',
      onConfirm: async () => {
        try {
          await removeFoodLog(entry.id, selectedKey);
          showNotice(`ลบ "${entry.name}" แล้ว`);
        } catch (error) {
          showNotice(error?.message || 'ลบรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
        }
      },
    });
  };

  // Group today's entries by meal, in the shared MEALS order (web HOME_ORDER).
  const mealGroups = MEALS.map((meal) => ({
    key: meal.key,
    label: MEAL_LABEL[meal.key],
    entries: todayEntries.filter((entry) => entry.meal === meal.key).sort(sortByTime),
  }));
  const otherEntries = todayEntries.filter((entry) => !MEAL_LABEL[entry.meal]).sort(sortByTime);
  if (otherEntries.length > 0) {
    mealGroups.push({ key: 'other', label: 'อื่น ๆ', entries: otherEntries });
  }
  const mealsWithEntries = MEALS.filter((meal) =>
    todayEntries.some((entry) => entry.meal === meal.key)
  ).length;
  const dinnerEmpty = !todayEntries.some((entry) => entry.meal === 'dinner');
  // Today shows every meal so each has its own "+"; past days only what was logged.
  const visibleGroups = mealGroups.filter((group) => isToday || group.entries.length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.greetingSmall} numberOfLines={1}>สวัสดี {greetingName}</Text>
        <View style={styles.dateSwitcher}>
          <Pressable
            onPress={() => setDayOffset((offset) => offset - 1)}
            accessibilityRole="button"
            accessibilityLabel="ดูวันก่อนหน้า"
            hitSlop={4}
            style={({ pressed }) => [styles.dateArrow, pressed && styles.leafBtnPressed]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <View style={styles.dateCenter} accessibilityRole="header">
            <Text style={styles.dateTitle}>{dayTitle}</Text>
            {dayTitle !== dateLabel ? <Text style={styles.dateText}>{dateLabel}</Text> : null}
          </View>
          <Pressable
            onPress={() => setDayOffset((offset) => Math.min(0, offset + 1))}
            disabled={isToday}
            accessibilityRole="button"
            accessibilityLabel="ดูวันถัดไป"
            accessibilityState={{ disabled: isToday }}
            hitSlop={4}
            style={({ pressed }) => [styles.dateArrow, pressed && styles.leafBtnPressed]}
          >
            <Ionicons name="chevron-forward" size={22} color={isToday ? colors.border : colors.primary} />
          </Pressable>
        </View>
        {!isToday ? (
          <Pressable
            onPress={() => setDayOffset(0)}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.backToToday}
          >
            <Text style={styles.linkText}>กลับไปวันนี้</Text>
          </Pressable>
        ) : null}

        {!!notice && (
          <Banner
            tone={notice.tone}
            message={notice.message}
            onDismiss={() => setNotice(null)}
            style={styles.banner}
          />
        )}

        {hasGoal ? (
          /* Energy card — ring + consumed/goal stats + macro grid */
          <Card style={styles.block}>
            <View style={styles.energyHeader}>
              <Text style={styles.sectionTitle}>พลังงาน{isToday ? 'วันนี้' : 'ของวันนั้น'}</Text>
              <Pressable
                onPress={() => navigation.navigate('Profile')}
                accessibilityRole="link"
                accessibilityLabel="ดูโปรไฟล์"
                accessibilityHint="เปิดหน้าโปรไฟล์เพื่อดูหรือแก้ไขเป้าหมายของคุณ"
                hitSlop={8}
              >
                <Text style={styles.linkText}>ดูโปรไฟล์</Text>
              </Pressable>
            </View>

            <View style={styles.energyRow}>
              <CalorieRing consumed={totals.kcal} goal={calorieGoal} size={168} strokeWidth={14} />
              <View style={styles.energyStats}>
                <View>
                  <Text style={styles.statLabel}>กินแล้ว</Text>
                  <Text style={styles.statValue}>
                    {formatNumber(totals.kcal)}
                    <Text style={styles.statUnit}> kcal</Text>
                  </Text>
                </View>
                <View>
                  <Text style={styles.statLabel}>เป้าหมาย</Text>
                  <Text style={styles.statValueSm}>
                    {formatNumber(calorieGoal)}
                    <Text style={styles.statUnit}> kcal</Text>
                  </Text>
                </View>
              </View>
            </View>

            {over ? (
              <Text style={styles.overText}>
                มากกว่าเป้าหมายที่ตั้งไว้ {formatNumber(overBy)} kcal
              </Text>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.macroGrid}>
              <View style={styles.macroCell}>
                <MacroBar
                  label="โปรตีน"
                  consumed={totals.protein}
                  goal={macroGoals.protein}
                  color={colors.protein}
                />
              </View>
              <View style={styles.macroCell}>
                <MacroBar
                  label="คาร์บ"
                  consumed={totals.carbs}
                  goal={macroGoals.carbs}
                  color={colors.carbs}
                />
              </View>
              <View style={styles.macroCell}>
                <MacroBar
                  label="ไขมัน"
                  consumed={totals.fat}
                  goal={macroGoals.fat}
                  color={colors.fat}
                />
              </View>
            </View>
          </Card>
        ) : (
          /* No goal yet — gentle onboarding cards (web NoGoalCards) */
          <>
            <Card style={[styles.block, styles.mintCard]}>
              <View style={styles.sproutTile}>
                <Ionicons name="flower-outline" size={26} color={colors.primary} />
              </View>
              <Text style={styles.noGoalTitle}>ค่อย ๆ รู้จักการกินในแบบของคุณ</Text>
              <Text style={styles.noGoalDesc}>
                ยังไม่ได้ตั้งเป้าหมายในโปรไฟล์ บันทึกอาหารก่อนได้ แล้วค่อยตั้งค่าเมื่อพร้อม
              </Text>
              <PrimaryButton
                title="ตั้งเป้าหมายในโปรไฟล์"
                icon="person-outline"
                onPress={() => navigation.navigate('Profile')}
                accessibilityHint="เปิดหน้าโปรไฟล์เพื่อตั้งเป้าหมายโภชนาการ"
                style={styles.noGoalCta}
              />
            </Card>
            <Card style={styles.block}>
              <Text style={styles.sectionTitle}>พลังงานที่บันทึก{isToday ? 'วันนี้' : ''}</Text>
              <Text style={styles.bigKcal}>
                {formatNumber(totals.kcal)}
                <Text style={styles.bigKcalUnit}> kcal</Text>
              </Text>
              <Text style={styles.explainText}>
                ยังไม่แสดงเป้าหมายหรือพลังงานที่เหลือจนกว่าจะตั้งค่าโปรไฟล์
              </Text>
            </Card>
          </>
        )}

        {profile ? (
          <Card style={styles.block}>
            <Text style={styles.sectionTitle}>ข้อเสนอแนะสุขภาพ</Text>
            {bmiCategory ? (
              <Text style={styles.explainText}>
                BMI ประมาณ {bmi.toFixed(1)} · {bmiCategory.label} (เกณฑ์คัดกรองผู้ใหญ่เอเชีย)
              </Text>
            ) : (
              <Text style={styles.explainText}>BMI สำหรับผู้มีอายุต่ำกว่า 18 ปีต้องแปลผลด้วยเกณฑ์เฉพาะอายุและเพศ</Text>
            )}
            {bmiCategory?.key === 'low' ? (
              <Text style={styles.explainText}>BMI ต่ำกว่าช่วงอ้างอิง ไม่ควรตั้งเป้าลดน้ำหนักจากตัวเลขนี้เพียงอย่างเดียว</Text>
            ) : null}
            {bmiCategory?.key === 'at_risk' ? (
              <Text style={styles.explainText}>เริ่มมีความเสี่ยงตามเกณฑ์คัดกรอง ลองปรับพฤติกรรมอย่างค่อยเป็นค่อยไป โดย BMI ไม่ใช่การวินิจฉัยโรค</Text>
            ) : null}
            {bmiCategory?.key === 'obesity_1' || bmiCategory?.key === 'obesity_2' ? (
              <Text style={styles.explainText}>BMI สูงกว่าช่วงอ้างอิง ไม่จำเป็นต้องลดน้ำหนักอย่างเร่งด่วนจากตัวเลข BMI เพียงค่าเดียว</Text>
            ) : null}
            {bmiCategory?.key === 'normal' && profile.goal === 'gain' ? (
              <Text style={styles.explainText}>หากต้องการเพิ่มมวลกล้ามเนื้อ การฝึกแรงต้านและโภชนาการที่เหมาะสมเป็นทางเลือกได้ ไม่จำเป็นต้องลดน้ำหนักเพียงเพราะ BMI</Text>
            ) : null}
            <Text style={styles.explainText}>
              โปรตีนคำนวณจากน้ำหนักและค่าอ้างอิงตามวัย (ผู้ใหญ่ 19 ปีขึ้นไปใช้ 0.8 กรัม/กก./วัน) แล้วแบ่งพลังงานที่เหลือเป็นคาร์บ 60% และไขมัน 40% เป็นค่าอ้างอิงทั่วไป ไม่ใช่เป้าหมายรักษาโรคหรือเพิ่มกล้ามเนื้อโดยเฉพาะ
            </Text>
            <Text style={styles.explainText}>
              หากมีโรคไตหรือการทำงานของไตลดลง หรือมีโรคประจำตัวอื่น เป้าหมายโปรตีนและพลังงานอาจต้องปรับเฉพาะบุคคล ควรปรึกษาแพทย์หรือนักกำหนดอาหารก่อนเปลี่ยนเป้าหมาย
            </Text>
            {Number(profile.age) < 18 ? (
              <Text style={styles.explainText}>ผู้มีอายุต่ำกว่า 18 ปีควรปรึกษาแพทย์หรือนักกำหนดอาหารก่อนใช้เป้าหมายพลังงานหรือสารอาหารในแอป</Text>
            ) : null}
          </Card>
        ) : null}

        {/* Food for the selected day, grouped by meal */}
        <View style={styles.foodHeader}>
          <Text style={styles.sectionTitle}>อาหาร{isToday ? 'วันนี้' : 'ของวันนั้น'}</Text>
          <Text style={styles.countText}>{todayEntries.length} รายการ</Text>
        </View>

        {!isToday && todayEntries.length === 0 ? (
          <Card style={styles.block}>
            <EmptyState
              icon="calendar-outline"
              title="ไม่มีบันทึกในวันนี้"
              message="วันที่ไม่ได้บันทึกจะไม่ถูกนับในแนวโน้ม"
            />
          </Card>
        ) : (
          <View style={styles.block}>
            {visibleGroups.map((group) => {
              const groupKcal = group.entries.reduce((sum, entry) => sum + (Number(entry.kcal) || 0), 0);
              return (
                <View key={group.key} style={styles.mealGroup}>
                  <View style={styles.mealGroupHeader}>
                    <Text style={styles.mealGroupTitle}>
                      {group.label}
                      {group.entries.length === 0 ? <Text style={styles.mealGroupEmpty}>  ยังไม่มีรายการ</Text> : null}
                    </Text>
                    {group.entries.length > 0 ? (
                      <Text style={styles.mealGroupKcal}>{formatNumber(groupKcal)} kcal</Text>
                    ) : null}
                    {isToday && group.key !== 'other' ? (
                      <Pressable
                        onPress={() => navigation.navigate('Log', { meal: group.key, requestedAt: Date.now() })}
                        accessibilityRole="button"
                        accessibilityLabel={`เพิ่มอาหาร${group.label}`}
                        style={({ pressed }) => [styles.mealAddBtn, pressed && styles.leafBtnPressed]}
                      >
                        <Ionicons name="add" size={20} color={colors.primary} />
                      </Pressable>
                    ) : null}
                  </View>
                  {group.entries.map((entry) => (
                    <MealEntryCard
                      key={entry.id}
                      meal={entry.meal}
                      mealLabel={group.key === 'other' ? group.label : undefined}
                      name={entry.name}
                      time={entry.time}
                      servings={entry.servings}
                      unit={entry.unit}
                      grams={entry.grams}
                      kcal={entry.kcal}
                      onRemove={() => askRemove(entry)}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Reflective card — today only. Logging lives in the tab bar (Log / Scan). */}
        {isToday && todayEntries.length > 0 ? (
          <Card style={[styles.block, styles.mintCard]}>
            <Text style={styles.sectionTitle}>วันนี้ในแบบของคุณ</Text>
            <Text style={styles.reflectBody}>
              บันทึกแล้ว {todayEntries.length} รายการ จาก {mealsWithEntries} มื้อ
            </Text>
            {dinnerEmpty ? (
              <Text style={styles.reflectBody}>มื้อเย็นยังว่างอยู่ เพิ่มเมื่อคุณพร้อมได้เลย</Text>
            ) : null}
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
