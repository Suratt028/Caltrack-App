import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { getNutritionFoodById } from '../services/foodService';
import Screen from '../components/Screen';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedControl from '../components/SegmentedControl';
import PortionStepper from '../components/PortionStepper';
import NutrientTrio from '../components/NutrientTrio';
import SkeletonRows from '../components/SkeletonRows';
import EmptyState from '../components/EmptyState';
import Banner from '../components/Banner';
import { MEAL_OPTIONS, defaultMealForNow } from '../components/MealChips';
import styles from '../style/screens/PortionScreenStyles';

// The food database is per 100 g with no per-dish weights, so household units
// use standard approximations. The gram total is always shown to the user.
const UNIT_GRAMS = { จาน: 250, ถ้วย: 240, ช้อนโต๊ะ: 15, กรัม: 1 };
const UNIT_OPTIONS = Object.keys(UNIT_GRAMS).map((unit) => ({ value: unit, label: unit }));
const UNIT_HINT = 'โดยประมาณ 1 จาน ≈ 250 กรัม · 1 ถ้วย ≈ 240 กรัม · 1 ช้อนโต๊ะ ≈ 15 กรัม เลือก “กรัม” ถ้าชั่งได้';
// One-tap amounts: servings for household units, grams for "กรัม".
const QUICK_SERVINGS = [
  { value: 0.5, label: '½' },
  { value: 1, label: '1' },
  { value: 1.5, label: '1½' },
  { value: 2, label: '2' },
];
const QUICK_GRAMS = [50, 100, 150, 200].map((value) => ({ value, label: String(value) }));
// Extra per-100 g values shown when the database has them.
const DETAIL_ROWS = [
  { key: 'fiber', label: 'ไฟเบอร์', unit: 'กรัม' },
  { key: 'sugar', label: 'น้ำตาล', unit: 'กรัม' },
  { key: 'sodium', label: 'โซเดียม', unit: 'มก.' },
];
const roundToHalf = (value) => Math.round(value * 2) / 2;
const round1 = (value) => Math.round(value * 10) / 10;
const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');
const formatAmount = (value) => String(value).replace(/\.5$/, '½').replace(/^0½$/, '½');

/**
 * Portion screen: pick the meal, adjust the amount and unit, see the live
 * calculation, then save the entry. Nothing is logged until "บันทึก".
 * Receives `{ navigation, route }` with `route.params = { food?, foodId, meal }`.
 */
export default function PortionScreen({ navigation, route }) {
  const { addFoodLog } = useApp();
  // On web the food object only survives in-app navigation; after a reload the
  // URL holds "[object Object]", so fall back to loading by foodId.
  const routeFoodParam = route?.params?.food;
  const routeFood = routeFoodParam && typeof routeFoodParam === 'object' ? routeFoodParam : null;
  const [food, setFood] = useState(routeFood);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodError, setFoodError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [meal, setMeal] = useState(route?.params?.meal || defaultMealForNow());
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('จาน');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const foodId = route?.params?.foodId;
    if (routeFood) {
      setFood(routeFood);
      setFoodError('');
      return undefined;
    }
    if (!foodId) {
      setFood(null);
      return undefined;
    }

    let active = true;
    setFoodLoading(true);
    setFoodError('');
    getNutritionFoodById(foodId)
      .then((loadedFood) => {
        if (active) setFood(loadedFood);
      })
      .catch((error) => {
        if (active) {
          setFood(null);
          setFoodError(error?.message || 'โหลดข้อมูลอาหารไม่สำเร็จ กรุณาลองใหม่');
        }
      })
      .finally(() => {
        if (active) setFoodLoading(false);
      });
    return () => {
      active = false;
    };
  }, [routeFood, route?.params?.foodId, loadAttempt]);

  // Back to wherever the user came from; a reloaded web page has no history.
  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Tabs', { screen: 'Log' }));

  const header = (
    <ScreenHeader
      title="ปรับปริมาณอาหาร"
      subtitle="ตรวจสอบก่อนเพิ่มในบันทึก"
      onBack={goBack}
      backHint="ย้อนกลับโดยไม่บันทึก"
    />
  );

  if (!food) {
    return (
      <Screen variant="flow">
        {header}
        {foodLoading ? (
          <SkeletonRows count={2} label="กำลังโหลดข้อมูลอาหาร" />
        ) : (
          <Card>
            <EmptyState
              icon="alert-circle-outline"
              title="ยังโหลดข้อมูลอาหารนี้ไม่ได้"
              message={foodError || 'ไม่พบข้อมูลอาหารนี้ ลองเลือกเมนูใหม่อีกครั้ง'}
              actionTitle={foodError ? 'ลองใหม่' : undefined}
              actionIcon="refresh"
              onAction={foodError ? () => setLoadAttempt((attempt) => attempt + 1) : undefined}
              secondaryTitle="กลับไปค้นหาอาหาร"
              onSecondary={() => navigation.navigate('Tabs', { screen: 'Log' })}
            />
          </Card>
        )}
      </Screen>
    );
  }

  // Nutrition reference values are per 100 g when `per100g` exists; older
  // search results only carry flat fields, so treat those as the reference too.
  const per100 = food.per100g || {
    kcal: food.kcal,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
  };
  const base = {
    kcal: Number(per100.kcal) || 0,
    protein: Number(per100.protein) || 0,
    carbs: Number(per100.carbs) || 0,
    fat: Number(per100.fat) || 0,
  };

  const isGrams = unit === 'กรัม';
  const grams = Math.round(amount * UNIT_GRAMS[unit]);
  const multiplier = grams / 100;
  const scaled = {
    kcal: Math.round(base.kcal * multiplier),
    protein: round1(base.protein * multiplier),
    carbs: round1(base.carbs * multiplier),
    fat: round1(base.fat * multiplier),
  };
  // Missing values are saved as 0 but shown as "—" with a notice, so nobody mistakes them for real zeros.
  const isMissing = (key) => per100[key] == null || !Number.isFinite(Number(per100[key]));
  const missingNutrients = ['kcal', 'protein', 'carbs', 'fat'].filter(isMissing);
  const kcalShown = isMissing('kcal') ? '—' : formatNumber(scaled.kcal);
  const estimatedFields = Array.isArray(food.estimated) ? food.estimated : [];
  const NUTRIENT_LABELS = { kcal: 'พลังงาน', protein: 'โปรตีน', carbs: 'คาร์บ', fat: 'ไขมัน' };
  const detailRows = DETAIL_ROWS.filter((row) => per100[row.key] != null && Number.isFinite(Number(per100[row.key])));

  // Keep the same total weight when switching units.
  const changeUnit = (nextUnit) => {
    const nextAmount = grams / UNIT_GRAMS[nextUnit];
    setUnit(nextUnit);
    setAmount(
      nextUnit === 'กรัม'
        ? Math.min(2000, Math.max(1, Math.round(nextAmount)))
        : Math.min(20, Math.max(0.5, roundToHalf(nextAmount)))
    );
  };

  const confirmSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await addFoodLog({
        name: food.name,
        meal,
        kcal: scaled.kcal,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        servings: amount,
        unit,
        grams,
        foodId: food.foodId,
        source: 'portion',
      });
      navigation.navigate('Tabs', {
        screen: 'Home',
        params: { savedName: food.name, savedKcal: scaled.kcal },
      });
    } catch (error) {
      // Keep the screen open (values intact) so the user can retry saving.
      setSaveError(error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const referenceKcal = isMissing('kcal') ? '—' : `${estimatedFields.includes('kcal') ? '≈ ' : ''}${formatNumber(base.kcal)}`;
  const servingLine = food.per100g ? `ข้อมูลต่อ 100 กรัม · ${referenceKcal} kcal` : `${food.serving || 'ต่อ 1 หน่วย'} · ${referenceKcal} kcal`;
  const quickOptions = isGrams ? QUICK_GRAMS : QUICK_SERVINGS;
  const amountLabel = isGrams ? `${grams} กรัม` : `${formatAmount(amount)} ${unit}`;

  return (
    <Screen variant="flow">
      {header}

      {/* Food identity */}
      <Card tone="mint" style={styles.block}>
        <View style={styles.identityRow}>
          <View style={styles.identityTile}>
            <Ionicons name="restaurant-outline" size={26} color={colors.primary} />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.overline}>อาหาร</Text>
            <Text style={styles.identityName} numberOfLines={2}>
              {food.name}
            </Text>
            <Text style={styles.identityMeta}>{servingLine}</Text>
          </View>
        </View>
        {estimatedFields.length > 0 && missingNutrients.length === 0 ? (
          <Text style={styles.identityNote}>≈ บางค่าคำนวณจากสารอาหารอื่น เพราะตารางข้อมูลต้นทางไม่ได้ระบุไว้</Text>
        ) : null}
      </Card>

      {missingNutrients.length > 0 ? (
        <Banner
          tone="warning"
          style={styles.block}
          message={`เมนูนี้ไม่มีข้อมูล${missingNutrients.map((key) => NUTRIENT_LABELS[key]).join(' ')} ค่าที่ขาดจะนับเป็น 0 ในบันทึก ลองเลือกเมนูใกล้เคียงอื่นถ้ามี`}
        />
      ) : null}

      {/* Meal */}
      <Text style={styles.fieldLabel}>มื้ออาหาร</Text>
      <View style={styles.block}>
        <SegmentedControl options={MEAL_OPTIONS} value={meal} onChange={setMeal} label="มื้ออาหาร" />
      </View>

      {/* Amount */}
      <PortionStepper
        amount={amount}
        onChange={setAmount}
        step={isGrams ? 10 : 0.5}
        min={isGrams ? 1 : 0.5}
        max={isGrams ? 2000 : 20}
        label="จำนวน"
      />
      <View style={styles.quickRow} accessibilityRole="radiogroup" accessibilityLabel="จำนวนที่ใช้บ่อย">
        {quickOptions.map((option) => {
          const selected = amount === option.value;
          return (
            <Pressable
              key={option.label}
              onPress={() => setAmount(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label} ${unit}`}
              style={({ pressed }) => [styles.quickChip, selected && styles.quickChipActive, pressed && styles.pressed]}
            >
              <Text style={[styles.quickText, selected && styles.quickTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Unit */}
      <Text style={styles.fieldLabel}>หน่วย</Text>
      <SegmentedControl options={UNIT_OPTIONS} value={unit} onChange={changeUnit} label="หน่วย" />
      <Text style={styles.hint}>
        ปริมาณรวม {formatNumber(grams)} กรัม · {UNIT_HINT}
      </Text>

      {/* Live calculation */}
      <View style={styles.resultCard} accessibilityLiveRegion="polite">
        <View style={styles.resultHead}>
          <Text style={styles.resultLabel}>ตามปริมาณที่เลือก</Text>
          <Text style={styles.resultKcal} accessibilityLabel={`${kcalShown} กิโลแคลอรี`}>
            {kcalShown} kcal
          </Text>
        </View>
        <NutrientTrio
          protein={isMissing('protein') ? null : scaled.protein}
          carbs={isMissing('carbs') ? null : scaled.carbs}
          fat={isMissing('fat') ? null : scaled.fat}
          style={styles.resultTrio}
        />
        {detailRows.length > 0 && (
          <View style={styles.detailCard}>
            <View style={styles.detailHead}>
              <Text style={styles.detailTitle}>ข้อมูลต่อ 100 กรัม</Text>
              <Text style={styles.detailNote}>ค่าประมาณ</Text>
            </View>
            {detailRows.map((row) => (
              <View key={row.key} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>
                  {round1(Number(per100[row.key])).toLocaleString('th-TH')} {row.unit}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {!!saveError && (
        <Banner tone="error" message={saveError} onDismiss={() => setSaveError('')} style={styles.block} />
      )}

      <PrimaryButton
        title={`บันทึก ${amountLabel} · ${kcalShown} kcal`}
        icon="checkmark"
        onPress={confirmSave}
        loading={saving}
      />
      <Text style={styles.footnote}>
        เป็นตัวอย่างก่อนบันทึก ยังไม่รวมในยอดวันนี้{'\n'}ย้อนกลับได้โดยไม่บันทึกการเปลี่ยนแปลง
      </Text>
    </Screen>
  );
}
