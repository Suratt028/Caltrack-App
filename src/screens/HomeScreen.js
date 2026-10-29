import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useLayout } from '../theme/layout';
import { useApp } from '../context/AppContext';
import Screen from '../components/Screen';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import IconButton from '../components/IconButton';
import EmptyState from '../components/EmptyState';
import Banner from '../components/Banner';
import SectionHeader from '../components/SectionHeader';
import MealEntryCard from '../components/MealEntryCard';
import { MEALS, MEAL_ICON, MEAL_LABEL } from '../components/MealChips';
import { calculateMacroGoals, todayKey } from '../utils/calculations';
import { confirmAction } from '../utils/confirm';
import styles from '../style/screens/HomeScreenStyles';

const formatNumber = (v) => Math.round(Number(v) || 0).toLocaleString('th-TH');

// Entries store an ISO timestamp (older ones "HH:mm"); compare and show as local "HH:mm".
function clockTime(value) {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value));
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
const latestOf = (entries) =>
  entries.reduce((latest, entry) => (!latest || clockTime(entry.time) > clockTime(latest.time) ? entry : latest), null);

const MEAL_ORDER = MEALS.reduce((acc, meal, index) => ({ ...acc, [meal.key]: index }), {});
const sortEntries = (a, b) =>
  (MEAL_ORDER[a.meal] ?? 99) - (MEAL_ORDER[b.meal] ?? 99) || clockTime(a.time).localeCompare(clockTime(b.time));

// "พฤหัสบดี 29 ตุลาคม 2569" (th-TH's own long format adds "วัน…ที่").
function longThaiDate(date) {
  const weekday = date.toLocaleDateString('th-TH', { weekday: 'long' }).replace(/^วัน/, '');
  const rest = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${weekday} ${rest}`;
}

function dateForOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

/** ‹ date › switcher. Today is the newest day; past days are read-only views. */
function DayPill({ date, isToday, onPrev, onNext, compact }) {
  const label = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', ...(compact ? {} : { year: 'numeric' }) });
  return (
    <View style={styles.dayPill}>
      <IconButton
        icon="chevron-back"
        variant="ghost"
        size={20}
        onPress={onPrev}
        accessibilityLabel="ดูวันก่อนหน้า"
      />
      <View style={styles.dayPillCenter} accessible accessibilityLabel={`วันที่แสดง ${label}`}>
        {!compact && <Ionicons name="calendar-outline" size={16} color={colors.primary} />}
        <Text style={styles.dayPillText} numberOfLines={1}>
          {isToday && compact ? 'วันนี้' : label}
        </Text>
      </View>
      <IconButton
        icon="chevron-forward"
        variant="ghost"
        size={20}
        onPress={onNext}
        disabled={isToday}
        accessibilityLabel="ดูวันถัดไป"
      />
    </View>
  );
}

export default function HomeScreen({ navigation, route }) {
  const { profile, user, getDayTotals, logsByDay, removeFoodLog } = useApp();
  const { isMobile, isDesktop, isWide } = useLayout();
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

  const dayEntries = [...(logsByDay[selectedKey] || [])].sort(sortEntries);

  // Every goal value comes from the saved profile — never hardcoded.
  const hasGoal = Number(profile?.calorieGoal) > 0;
  const calorieGoal = hasGoal ? Number(profile.calorieGoal) : 0;
  const macroGoals = hasGoal ? profile?.macroGoals || calculateMacroGoals(calorieGoal) : null;
  const over = hasGoal && totals.kcal > calorieGoal;
  const overBy = over ? totals.kcal - calorieGoal : 0;
  const percent = hasGoal ? Math.round((totals.kcal / calorieGoal) * 100) : 0;

  const greetingName = profile?.displayName || user?.displayName || '';
  const title = hasGoal ? `สวัสดี${greetingName ? ` ${greetingName}` : ''}` : 'เริ่มต้นไปด้วยกัน';
  const longDate = longThaiDate(selectedDate);
  // The ring scales with its card so the stats column never gets squeezed.
  const [energyWidth, setEnergyWidth] = useState(0);
  const ringSize = energyWidth ? Math.round(Math.max(128, Math.min(184, energyWidth * 0.48))) : isMobile ? 168 : 160;
  const dayWord = isToday ? 'วันนี้' : 'วันนั้น';

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const showNotice = useCallback((message, tone = 'success') => {
    setNotice({ message, tone });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  }, []);

  // Portion returns here with `savedName` / `savedKcal` after logging, so
  // confirm it once, then clear the params (on web they live in the URL).
  const savedName = route?.params?.savedName;
  const savedKcal = route?.params?.savedKcal;
  useEffect(() => {
    if (!savedName) return;
    setDayOffset(0);
    showNotice(`บันทึก “${savedName}” · ${formatNumber(savedKcal)} kcal แล้ว`);
    navigation.setParams({ savedName: undefined, savedKcal: undefined });
  }, [savedName, savedKcal, showNotice, navigation]);

  const askRemove = (entry) => {
    confirmAction({
      title: `ลบรายการนี้ออกจากบันทึก${isToday ? 'วันนี้' : ''}?`,
      message: `${entry.name} · ${formatNumber(entry.kcal)} kcal`,
      confirmLabel: 'ลบรายการ',
      onConfirm: async () => {
        try {
          await removeFoodLog(entry.id, selectedKey);
          showNotice(`ลบ “${entry.name}” แล้ว`);
        } catch (error) {
          showNotice(error?.message || 'ลบรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
        }
      },
    });
  };

  const openLog = (meal) => navigation.navigate('Log', meal ? { meal, requestedAt: Date.now() } : undefined);
  const openScan = () => navigation.navigate('Scan');
  const openProfile = () => navigation.navigate('Profile');

  const loggedMeals = MEALS.filter((meal) => dayEntries.some((entry) => entry.meal === meal.key));
  const emptyMeals = MEALS.filter((meal) => meal.key !== 'snack' && !loggedMeals.includes(meal));
  const latestEntry = latestOf(logsByDay[todayKey()] || []);

  /* ------------------------------ sections ------------------------------ */

  const header = (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle}>
          {longDate}
          {isWide && isToday ? ' · วันนี้ดูแลตัวเองทีละมื้อก็พอ' : ''}
        </Text>
      </View>
      <DayPill
        date={selectedDate}
        isToday={isToday}
        compact={isMobile}
        onPrev={() => setDayOffset((offset) => offset - 1)}
        onNext={() => setDayOffset((offset) => Math.min(0, offset + 1))}
      />
    </View>
  );

  const energyCard = hasGoal ? (
    <Card style={styles.block}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>พลังงาน{dayWord}</Text>
        <Pressable
          onPress={openProfile}
          accessibilityRole="link"
          accessibilityHint="เปิดหน้าโปรไฟล์เพื่อดูหรือแก้ไขเป้าหมาย"
          hitSlop={10}
          style={styles.linkHit}
        >
          <Text style={styles.linkText}>เป้าหมายจากโปรไฟล์</Text>
        </Pressable>
      </View>

      <View style={styles.energyRow} onLayout={(event) => setEnergyWidth(event.nativeEvent.layout.width)}>
        <CalorieRing consumed={totals.kcal} goal={calorieGoal} size={ringSize} strokeWidth={ringSize > 150 ? 14 : 12} />
        <View style={styles.energyStats}>
          <View>
            <Text style={styles.statLabel} numberOfLines={1}>ทานแล้ว{over ? '' : ` · ${percent}%`}</Text>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatNumber(totals.kcal)}
            </Text>
          </View>
          <View>
            <Text style={styles.statLabel} numberOfLines={1}>เป้าหมาย</Text>
            <Text style={styles.statValueSm} numberOfLines={1} adjustsFontSizeToFit>
              {formatNumber(calorieGoal)}
              <Text style={styles.statUnit}> kcal</Text>
            </Text>
          </View>
        </View>
      </View>

      {over ? (
        <View style={styles.overNote} accessibilityRole="text">
          <Text style={styles.overText}>มากกว่าเป้าหมายที่ตั้งไว้ {formatNumber(overBy)} kcal</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.macroGrid}>
        <MacroBar label="โปรตีน" consumed={totals.protein} goal={macroGoals.protein} color={colors.protein} />
        <MacroBar label="คาร์บ" consumed={totals.carbs} goal={macroGoals.carbs} color={colors.carbs} />
        <MacroBar label="ไขมัน" consumed={totals.fat} goal={macroGoals.fat} color={colors.fat} />
      </View>
    </Card>
  ) : (
    <>
      {/* No goal yet: log first, set the goal when ready. No %, no "remaining". */}
      <Card tone="mint" style={[styles.block, styles.welcomeCard]}>
        <View style={styles.sproutTile}>
          <Ionicons name="leaf-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.welcomeTitle}>ค่อย ๆ รู้จักการกิน{'\n'}ในแบบของคุณ</Text>
        <Text style={styles.welcomeBody}>
          ยังไม่ได้ตั้งเป้าหมายในโปรไฟล์{'\n'}บันทึกอาหารก่อนได้ แล้วค่อยตั้งค่าเมื่อพร้อม
        </Text>
        <PrimaryButton
          title="ตั้งเป้าหมายในโปรไฟล์"
          icon="person-outline"
          onPress={openProfile}
          accessibilityHint="เปิดหน้าโปรไฟล์เพื่อตั้งเป้าหมายโภชนาการ"
          style={styles.welcomeCta}
        />
      </Card>
      <Card style={styles.block}>
        <Text style={styles.statLabel}>พลังงานที่กินไปแล้ว{isToday ? '' : 'ในวันนั้น'}</Text>
        <Text style={styles.bigKcal}>{formatNumber(totals.kcal)} kcal</Text>
        <View style={styles.explainBox}>
          <Text style={styles.explainTitle}>ตั้งเป้าหมายเพื่อดูพลังงานที่เหลือ</Text>
          <Text style={styles.explainText}>เมื่อตั้งเป้าหมายแล้ว จะแสดงพลังงานที่เหลือให้เห็นชัดเจน</Text>
        </View>
      </Card>
    </>
  );

  const actions = isToday ? (
    <View style={styles.actions}>
      <PrimaryButton title="บันทึกอาหาร" icon="add" onPress={() => openLog()} />
      <PrimaryButton title="สแกนอาหารด้วย AI" icon="scan-outline" variant="soft" onPress={openScan} />
    </View>
  ) : (
    <PrimaryButton
      title="กลับไปวันนี้"
      icon="today-outline"
      variant="soft"
      onPress={() => setDayOffset(0)}
      style={styles.block}
    />
  );

  const nextMealCard = (
    <Card style={styles.block}>
      <Text style={styles.cardTitleLg}>{isToday ? 'มื้อต่อไป บันทึกได้ง่าย ๆ' : 'กำลังดูบันทึกย้อนหลัง'}</Text>
      <Text style={styles.cardBody}>
        {isToday
          ? 'ค้นหาเมนูที่ทาน หรือเริ่มจากภาพอาหาร\nตรวจทานปริมาณก่อนบันทึกได้เสมอ'
          : 'บันทึกใหม่จะเพิ่มในวันนี้ กลับไปวันนี้เพื่อบันทึกต่อ'}
      </Text>
      <View style={styles.cardActions}>{actions}</View>
      {isToday && latestEntry ? (
        <View style={styles.latestRow}>
          <Ionicons name="time-outline" size={18} color={colors.inkMuted} />
          <Text style={styles.latestText} numberOfLines={1}>
            เมนูล่าสุด: {latestEntry.name} · {formatNumber(latestEntry.kcal)} kcal
          </Text>
        </View>
      ) : null}
    </Card>
  );

  const foodList = (
    <View style={styles.block}>
      <SectionHeader
        title={`อาหาร${dayWord}`}
        meta={dayEntries.length ? `${dayEntries.length} รายการ` : undefined}
      />
      {dayEntries.length === 0 ? (
        <Card>
          <EmptyState
            icon={isToday ? 'restaurant-outline' : 'calendar-outline'}
            title={isToday ? 'มื้อแรกของวันนี้ เริ่มได้เลย' : 'ไม่มีบันทึกในวันนั้น'}
            message={
              isToday
                ? 'ยังไม่มีรายการอาหาร\nไม่ต้องครบทุกมื้อก็ค่อย ๆ บันทึกได้'
                : 'วันที่ไม่ได้บันทึกจะไม่ถูกนับในแนวโน้ม'
            }
          />
        </Card>
      ) : (
        <>
          {dayEntries.map((entry) => (
            <MealEntryCard
              key={entry.id}
              meal={entry.meal}
              mealLabel={MEAL_LABEL[entry.meal] ? undefined : 'อื่น ๆ'}
              name={entry.name}
              time={entry.time}
              servings={entry.servings}
              unit={entry.unit}
              grams={entry.grams}
              kcal={entry.kcal}
              protein={entry.protein}
              carbs={entry.carbs}
              fat={entry.fat}
              detailed={isDesktop}
              onRemove={() => askRemove(entry)}
            />
          ))}
          {isToday &&
            emptyMeals.map((meal) => (
              <Pressable
                key={meal.key}
                onPress={() => openLog(meal.key)}
                accessibilityRole="button"
                accessibilityLabel={`เพิ่มอาหาร${meal.label}`}
                style={({ pressed }) => [styles.mealSlot, pressed && styles.pressed]}
              >
                <Ionicons name={MEAL_ICON[meal.key]} size={22} color={colors.inkMuted} />
                <View style={styles.mealSlotText}>
                  <Text style={styles.mealSlotTitle}>{meal.label}</Text>
                  <Text style={styles.mealSlotBody}>ยังไม่มีรายการ · เพิ่มเมื่อพร้อมได้เลย</Text>
                </View>
                <Ionicons name="add" size={24} color={colors.primary} />
              </Pressable>
            ))}
        </>
      )}
    </View>
  );

  const reflectCard =
    isToday && dayEntries.length > 0 ? (
      <Card tone="mint" style={styles.block}>
        <View style={styles.reflectHead}>
          <Ionicons name="leaf-outline" size={22} color={colors.primary} />
          <Text style={styles.cardTitleLg}>วันนี้ในแบบของคุณ</Text>
        </View>
        <Text style={styles.reflectBody}>
          บันทึกแล้ว {dayEntries.length} รายการ จาก {loggedMeals.length} มื้อ
          {emptyMeals.some((meal) => meal.key === 'dinner') ? '\nมื้อเย็นยังว่างอยู่ เพิ่มเมื่อคุณพร้อมได้เลย' : ''}
          {'\n'}ตัวเลขเป็นเพียงส่วนหนึ่งของการดูแลตัวเอง
        </Text>
      </Card>
    ) : null;

  const goalCard = hasGoal ? (
    <Card style={styles.block}>
      <Text style={styles.cardTitle}>เป้าหมายในโปรไฟล์</Text>
      <Text style={styles.cardBody}>
        พลังงาน {formatNumber(calorieGoal)} kcal ต่อวัน{'\n'}
        โปรตีน {formatNumber(macroGoals.protein)} · คาร์บ {formatNumber(macroGoals.carbs)} · ไขมัน{' '}
        {formatNumber(macroGoals.fat)} กรัม
      </Text>
      <Pressable onPress={openProfile} accessibilityRole="link" hitSlop={10} style={styles.linkHit}>
        <Text style={styles.linkTextStrong}>ดูและแก้ไขโปรไฟล์ →</Text>
      </Pressable>
    </Card>
  ) : null;

  const noticeBanner = notice ? (
    <Banner tone={notice.tone} message={notice.message} onDismiss={() => setNotice(null)} style={styles.banner} />
  ) : null;

  /* ------------------------------- layouts ------------------------------ */

  if (isDesktop) {
    // Latest meal of the selected day, shown beside the "next meal" card.
    const lastMeal = latestOf(dayEntries);
    const lastMealCard = (
      <Card style={[styles.block, styles.lastMealCard]}>
        <View style={styles.lastMealArt}>
          <Ionicons
            name={lastMeal ? MEAL_ICON[lastMeal.meal] || 'restaurant-outline' : 'restaurant-outline'}
            size={52}
            color={colors.primary}
          />
        </View>
        {lastMeal ? (
          <>
            <Text style={styles.lastMealMeta}>
              {MEAL_LABEL[lastMeal.meal] || 'อาหาร'}
              {clockTime(lastMeal.time) ? ` · ${clockTime(lastMeal.time)}` : ''}
            </Text>
            <Text style={styles.cardTitle} numberOfLines={2}>{lastMeal.name}</Text>
            <Text style={styles.lastMealBody}>
              {formatNumber(lastMeal.kcal)} kcal{'\n'}บันทึกอยู่ในยอด{dayWord}แล้ว
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>มื้อล่าสุด</Text>
            <Text style={styles.lastMealBody}>ยังไม่มีรายการ{dayWord}{'\n'}มื้อที่บันทึกล่าสุดจะแสดงตรงนี้</Text>
          </>
        )}
      </Card>
    );

    return (
      <Screen>
        {header}
        {noticeBanner}
        <View style={styles.columns}>
          <View style={styles.colLeft}>
            {energyCard}
            {reflectCard}
            {goalCard}
          </View>
          <View style={styles.colRight}>
            <View style={styles.columnsTight}>
              <View style={styles.colNext}>{nextMealCard}</View>
              <View style={styles.colLast}>{lastMealCard}</View>
            </View>
            {foodList}
          </View>
        </View>
      </Screen>
    );
  }

  if (isWide) {
    return (
      <Screen>
        {header}
        {noticeBanner}
        <View style={styles.columns}>
          <View style={styles.colHalf}>{energyCard}</View>
          <View style={styles.colHalf}>{nextMealCard}</View>
        </View>
        <View style={styles.columns}>
          <View style={styles.colWide}>{foodList}</View>
          <View style={styles.colNarrow}>
            {reflectCard}
            {goalCard}
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      {noticeBanner}
      {energyCard}
      <View style={styles.block}>{actions}</View>
      {foodList}
    </Screen>
  );
}
