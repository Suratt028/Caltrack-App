import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import Banner from '../components/Banner';
import MealEntryCard from '../components/MealEntryCard';
import { MEALS, MEAL_LABEL } from '../components/MealChips';
import { calculateMacroGoals, todayKey } from '../utils/calculations';
import { confirmAction } from '../utils/confirm';
import styles from '../style/screens/HomeScreenStyles';

const formatNumber = (v) => Math.round(Number(v) || 0).toLocaleString('th-TH');

const sortByTime = (a, b) => String(a.time || '').localeCompare(String(b.time || ''));

export default function HomeScreen({ navigation }) {
  const { profile, user, getDayTotals, logsByDay, removeFoodLog } = useApp();
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const rawTotals = getDayTotals() || {};
  const totals = {
    kcal: Number(rawTotals.kcal) || 0,
    protein: Number(rawTotals.protein) || 0,
    carbs: Number(rawTotals.carbs) || 0,
    fat: Number(rawTotals.fat) || 0,
  };

  const todayEntries = logsByDay[todayKey()] || [];

  // Every goal value comes from the saved profile — never hardcoded.
  const hasGoal = Number(profile?.calorieGoal) > 0;
  const calorieGoal = hasGoal ? Number(profile.calorieGoal) : 0;
  const macroGoals = hasGoal ? profile?.macroGoals || calculateMacroGoals(calorieGoal) : null;
  const over = hasGoal && totals.kcal > calorieGoal;
  const overBy = over ? totals.kcal - calorieGoal : 0;

  const greetingName = profile?.displayName || user?.displayName || 'คุณ';
  const dateLabel = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const showNotice = useCallback((message, tone = 'success') => {
    setNotice({ message, tone });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2800);
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greeting} numberOfLines={2}>สวัสดี {greetingName}</Text>
            <Text style={styles.dateText}>
              {dateLabel} · วันนี้ดูแลตัวเองทีละมื้อก็พอ
            </Text>
          </View>
          <Pressable
            onPress={() => showNotice('วันนี้ดูแลตัวเองทีละมื้อก็พอ', 'info')}
            accessibilityRole="button"
            accessibilityLabel="เคล็ดลับโภชนาการวันนี้"
            accessibilityHint="แสดงเคล็ดลับดูแลตัวเองในวันนี้"
            style={({ pressed }) => [styles.leafBtn, pressed && styles.leafBtnPressed]}
          >
            <Ionicons name="leaf-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

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
              <Text style={styles.sectionTitle}>พลังงานวันนี้</Text>
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
              <Text style={styles.sectionTitle}>พลังงานที่บันทึกวันนี้</Text>
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

        {/* Food today */}
        <View style={styles.foodHeader}>
          <Text style={styles.sectionTitle}>อาหารวันนี้</Text>
          <Text style={styles.countText}>{todayEntries.length} รายการ</Text>
        </View>

        {todayEntries.length === 0 ? (
          <Card style={styles.block}>
            <EmptyState
              icon="add-outline"
              title="มื้อแรกของวันนี้ เริ่มได้เลย"
              message="ยังไม่มีรายการอาหาร ไม่ต้องครบทุกมื้อก็ค่อย ๆ บันทึกได้"
              actionTitle="บันทึกอาหาร"
              onAction={() => navigation.navigate('Log')}
            />
          </Card>
        ) : (
          <View style={styles.block}>
            {mealGroups
              .filter((group) => group.entries.length > 0)
              .map((group) => (
                <View key={group.key} style={styles.mealGroup}>
                  <Text style={styles.mealGroupTitle}>{group.label}</Text>
                  {group.entries.map((entry) => (
                    <MealEntryCard
                      key={entry.id}
                      meal={entry.meal}
                      mealLabel={group.key === 'other' ? group.label : undefined}
                      name={entry.name}
                      time={entry.time}
                      servings={entry.servings}
                      kcal={entry.kcal}
                      onRemove={() => askRemove(entry)}
                    />
                  ))}
                </View>
              ))}
          </View>
        )}

        {/* Reflective card */}
        <Card style={[styles.block, styles.mintCard]}>
          <Text style={styles.sectionTitle}>วันนี้ในแบบของคุณ</Text>
          <Text style={styles.reflectBody}>
            บันทึกแล้ว {todayEntries.length} รายการ จาก {mealsWithEntries} มื้อ
          </Text>
          {todayEntries.length > 0 && dinnerEmpty ? (
            <Text style={styles.reflectBody}>มื้อเย็นยังว่างอยู่ เพิ่มเมื่อคุณพร้อมได้เลย</Text>
          ) : null}
        </Card>

        {/* Goal card */}
        {hasGoal ? (
          <Card style={styles.block}>
            <Text style={styles.sectionTitle}>เป้าหมายของคุณ</Text>
            <Text style={styles.goalKcal}>{formatNumber(calorieGoal)} kcal ต่อวัน</Text>
            <View style={styles.goalMacros}>
              <Text style={styles.goalMacroItem}>โปรตีน {formatNumber(macroGoals.protein)} กรัม</Text>
              <Text style={styles.goalMacroItem}>คาร์บ {formatNumber(macroGoals.carbs)} กรัม</Text>
              <Text style={styles.goalMacroItem}>ไขมัน {formatNumber(macroGoals.fat)} กรัม</Text>
            </View>
            <Text style={styles.goalDisclaimer}>ไม่ใช่เป้าหมายแนะนำสำหรับทุกคน</Text>
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="link"
              accessibilityLabel="ดูและแก้ไขโปรไฟล์"
              accessibilityHint="เปิดหน้าโปรไฟล์เพื่อดูหรือแก้ไขเป้าหมายโภชนาการ"
              hitSlop={8}
              style={styles.goalLinkRow}
            >
              <Text style={styles.linkText}>ดูและแก้ไขโปรไฟล์ →</Text>
            </Pressable>
          </Card>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <PrimaryButton
            title="บันทึกอาหาร"
            icon="add"
            onPress={() => navigation.navigate('Log')}
            accessibilityHint="เปิดหน้าค้นหาเมนูอาหารเพื่อบันทึกมื้อนี้"
          />
          <PrimaryButton
            title="สแกนอาหารด้วย AI"
            icon="camera"
            variant="outline"
            onPress={() => navigation.navigate('Scan')}
            accessibilityHint="เปิดกล้องเพื่อประเมินแคลอรี่จากรูปอาหาร"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
