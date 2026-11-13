import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useFoodLogActions } from '../data/useUserData';
import { getNutritionFoodById } from '../services/foodService';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedControl from '../components/SegmentedControl';
import PortionStepper from '../components/PortionStepper';
import Banner from '../components/Banner';
import { defaultMealForNow } from '../components/MealChips';
import { EGG_SIZE_PORTIONS } from '../utils/foodPortions';
import styles from '../style/screens/PortionScreenStyles';

// Short meal labels — same wording as the web prototype (meals.*Short).
const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'เช้า' },
  { value: 'lunch', label: 'กลางวัน' },
  { value: 'dinner', label: 'เย็น' },
  { value: 'snack', label: 'ว่าง' },
];

// The food database is per 100 g with no per-dish weights, so household units
// use standard approximations. The gram total is always shown to the user.
const UNIT_GRAMS = { จาน: 250, ถ้วย: 240, ช้อนโต๊ะ: 15, กรัม: 1 };
const UNIT_OPTIONS = Object.keys(UNIT_GRAMS).map((unit) => ({ value: unit, label: unit }));
const UNIT_HINT = 'โดยประมาณ: 1 จาน ≈ 250 ก. · 1 ถ้วย ≈ 240 ก. · 1 ช้อนโต๊ะ ≈ 15 ก. เลือก “กรัม” หากชั่งได้';
const roundToHalf = (value) => Math.round(value * 2) / 2;

const round1 = (value) => Math.round(value * 10) / 10;

/**
 * Portion screen (mirrors the web PortionScreen): pick the meal, adjust the
 * amount with the stepper, see a live calculation, then save the entry.
 * Receives `{ navigation, route }` with `route.params = { food, meal }`.
 */
export default function PortionScreen({ navigation, route }) {
  const { addFoodLog } = useFoodLogActions();
  // On web the food object only survives in-app navigation; after a reload the
  // URL holds "[object Object]", so fall back to loading by foodId.
  const routeFoodParam = route?.params?.food;
  const routeFood = routeFoodParam && typeof routeFoodParam === 'object' ? routeFoodParam : null;
  const [food, setFood] = useState(routeFood);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodError, setFoodError] = useState('');

  const [meal, setMeal] = useState(route?.params?.meal || defaultMealForNow());
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('จาน');
  const [eggSize, setEggSize] = useState('3');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setUnit(food?.servingUnit?.unit || 'จาน');
    setAmount(1);
    setEggSize(food?.servingUnit?.eggSize || '3');
  }, [food?.foodId]);

  useEffect(() => {
    const foodId = route?.params?.foodId;
    if (routeFood) {
      setFood(routeFood);
      setFoodError('');
      return;
    }
    if (!foodId) {
      setFood(null);
      return;
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
  }, [routeFood, route?.params?.foodId]);

  const backRight = (
    <Pressable
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="ย้อนกลับ"
      accessibilityHint="ไม่บันทึกการเปลี่ยนแปลง"
      style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
      hitSlop={6}
    >
      <Ionicons name="chevron-back" size={22} color={colors.ink} />
    </Pressable>
  );

  // Nutrition reference values are per 100 g when `per100g` exists; older
  // search results only carry flat fields, so treat those as the reference too.
  const per100 = food?.per100g || {
    kcal: food?.kcal,
    protein: food?.protein,
    carbs: food?.carbs,
    fat: food?.fat,
  };
  const selectedEggPortion = EGG_SIZE_PORTIONS.find((item) => item.size === eggSize);
  const servingGrams = food?.servingUnit?.eggSize
    ? selectedEggPortion?.grams || food.servingUnit.grams
    : food?.servingUnit?.grams;
  const unitGrams = food?.servingUnit
    ? { ...UNIT_GRAMS, [food.servingUnit.unit]: servingGrams }
    : UNIT_GRAMS;
  const unitOptions = food?.servingUnit
    ? [{ value: food.servingUnit.unit, label: food.servingUnit.unit }, ...UNIT_OPTIONS]
    : UNIT_OPTIONS;
  const base = {
    kcal: Number(per100.kcal) || 0,
    protein: Number(per100.protein) || 0,
    carbs: Number(per100.carbs) || 0,
    fat: Number(per100.fat) || 0,
  };

  const isGrams = unit === 'กรัม';
  const grams = Math.round(amount * (unitGrams[unit] || 1));
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
  const shown = (key, value, unitLabel = '') => (isMissing(key) ? '—' : `${value}${unitLabel}`);
  const estimatedFields = Array.isArray(food?.estimated) ? food.estimated : [];
  const NUTRIENT_LABELS = { kcal: 'พลังงาน', protein: 'โปรตีน', carbs: 'คาร์บ', fat: 'ไขมัน' };

  // Keep the same total weight when switching units.
  const changeUnit = (nextUnit) => {
    const nextAmount = grams / unitGrams[nextUnit];
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
      navigation.navigate('Tabs', { screen: 'Home' });
    } catch (error) {
      // Keep the screen open (values intact) so the user can retry saving.
      setSaveError(error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  if (!food) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader
            title="ปรับปริมาณอาหาร"
            subtitle="ตรวจสอบก่อนเพิ่มในบันทึก"
            right={backRight}
          />
          {foodLoading ? (
            <View style={{ alignItems: 'center', padding: 24 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ marginTop: 8, color: colors.inkMuted }}>กำลังโหลดข้อมูลอาหาร</Text>
            </View>
          ) : (
            <Banner
              tone="warning"
              message={foodError || 'ไม่พบข้อมูลอาหารนี้ ลองเลือกใหม่อีกครั้ง'}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const servingLine = food.servingUnit
    ? `1 ${food.servingUnit.unit} ≈ ${servingGrams} กรัม${food.servingUnit.eggSize ? ' (ส่วนที่กินได้)' : ''}`
    : 'เลือกปริมาณด้านล่างเพื่อดูค่าตามที่รับประทาน';
  const servingKcal = isMissing('kcal')
    ? '—'
    : Math.round(base.kcal * (servingGrams || 100) / 100);
  const kcalLine = food.servingUnit
    ? `${estimatedFields.includes('kcal') ? '≈' : ''}${servingKcal} kcal / ${food.servingUnit.unit}`
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="ปรับปริมาณอาหาร"
          subtitle="ตรวจสอบก่อนเพิ่มในบันทึก"
          right={backRight}
        />

        {/* Food identity */}
        <Card>
          <Text style={styles.identityName} numberOfLines={2}>
            {food.name}
          </Text>
          <Text style={styles.identityMeta}>{servingLine}</Text>
          {!!kcalLine && <Text style={styles.identityKcal}>{kcalLine}</Text>}
          {estimatedFields.length > 0 && missingNutrients.length === 0 ? (
            <Text style={styles.identityMeta}>≈ บางค่าคำนวณจากสารอาหารอื่น เพราะตารางข้อมูลต้นทางไม่ได้ระบุไว้</Text>
          ) : null}
        </Card>

        {missingNutrients.length > 0 ? (
          <Banner
            tone="warning"
            message={`เมนูนี้ไม่มีข้อมูล${missingNutrients.map((key) => NUTRIENT_LABELS[key]).join(' ')} ค่าที่ขาดจะนับเป็น 0 ในบันทึก ลองเลือกเมนูใกล้เคียงอื่นถ้ามี`}
          />
        ) : null}

        {/* Meal + portion controls */}
        <Card style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>มื้ออาหาร</Text>
          <View style={styles.mealWrap}>
            <SegmentedControl options={MEAL_OPTIONS} value={meal} onChange={setMeal} label="มื้ออาหาร" />
          </View>

          <PortionStepper
            amount={amount}
            onChange={setAmount}
            step={isGrams ? 10 : 0.5}
            min={isGrams ? 1 : 0.5}
            max={isGrams ? 2000 : 20}
            label="จำนวน"
            unit={unit}
          />

          {food.servingUnit?.eggSize ? (
            <View style={styles.eggSizeSection}>
              <Text style={styles.fieldLabel}>ขนาดไข่ไก่</Text>
              <View style={styles.eggSizeOptions} accessibilityRole="radiogroup" accessibilityLabel="เลือกเบอร์ไข่ไก่">
                {EGG_SIZE_PORTIONS.map((option) => {
                  const selected = eggSize === option.size;
                  return (
                    <Pressable
                      key={option.size}
                      onPress={() => setEggSize(option.size)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`เบอร์ ${option.size} ประมาณ ${option.grams} กรัมส่วนที่กินได้`}
                      style={[
                        styles.eggSizeOption,
                        selected && styles.eggSizeOptionSelected,
                      ]}
                    >
                      <Text style={[
                        styles.eggSizeOptionText,
                        selected && styles.eggSizeOptionTextSelected,
                      ]}>
                        {`เบอร์ ${option.size}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.hint}>
                น้ำหนักส่วนที่กินได้โดยประมาณ {selectedEggPortion?.grams} กรัมต่อฟอง
              </Text>
            </View>
          ) : null}

          <Text style={[styles.fieldLabel, styles.unitLabel]}>หน่วย</Text>
          <SegmentedControl options={unitOptions} value={unit} onChange={changeUnit} label="หน่วย" size="sm" />
          <Text style={styles.hint}>
            {food.servingUnit
              ? `น้ำหนักต่อ ${food.servingUnit.unit} เป็นค่าประมาณ ขนาดจริงอาจต่างกัน เลือก “กรัม” หากชั่งได้`
              : UNIT_HINT}
          </Text>
        </Card>

        {/* Live calculation */}
        <View style={styles.calcCard} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Text style={styles.calcLabel}>
            ประมาณการ · {amount} {unit} ({grams} กรัม)
          </Text>
          <View style={styles.calcKcalRow}>
            <Text style={styles.calcKcal}>{shown('kcal', scaled.kcal)}</Text>
            <Text style={styles.calcKcalUnit}>kcal</Text>
          </View>
          <Text style={styles.calcMacros}>
            P {shown('protein', scaled.protein, 'g')} · C {shown('carbs', scaled.carbs, 'g')} · F {shown('fat', scaled.fat, 'g')}
          </Text>
          <Text style={styles.calcNote}>ค่าตามปริมาณที่เลือก · น้ำหนักต่อหน่วยเป็นค่าประมาณ</Text>
        </View>

        <Text style={styles.hint}>
          เป็นตัวอย่างก่อนบันทึก ยังไม่รวมในยอดวันนี้ ย้อนกลับได้โดยไม่บันทึกการเปลี่ยนแปลง
        </Text>

        {!!saveError && <Banner tone="error" message={saveError} onDismiss={() => setSaveError('')} />}

        <PrimaryButton
          title={`บันทึก ${amount} ${unit} · ${shown('kcal', scaled.kcal)} kcal`}
          icon="checkmark"
          onPress={confirmSave}
          loading={saving}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
