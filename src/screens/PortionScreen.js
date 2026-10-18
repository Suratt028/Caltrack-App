import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedControl from '../components/SegmentedControl';
import PortionStepper from '../components/PortionStepper';
import Banner from '../components/Banner';
import { defaultMealForNow } from '../components/MealChips';
import styles from '../style/screens/PortionScreenStyles';

// Short meal labels — same wording as the web prototype (meals.*Short).
const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'เช้า' },
  { value: 'lunch', label: 'กลางวัน' },
  { value: 'dinner', label: 'เย็น' },
  { value: 'snack', label: 'ว่าง' },
];

const UNITS = ['จาน', 'ถ้วย', 'ช้อน', 'กรัม'];
const UNIT_OPTIONS = UNITS.map((unit) => ({ value: unit, label: unit }));

const round1 = (value) => Math.round(value * 10) / 10;

/**
 * Portion screen (mirrors the web PortionScreen): pick the meal, adjust the
 * amount with the stepper, see a live calculation, then save the entry.
 * Receives `{ navigation, route }` with `route.params = { food, meal }`.
 */
export default function PortionScreen({ navigation, route }) {
  const { addFoodLog } = useApp();
  const food = route?.params?.food || null;

  const [meal, setMeal] = useState(route?.params?.meal || defaultMealForNow());
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('จาน');
  const [saving, setSaving] = useState(false);

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
  const base = {
    kcal: Number(per100.kcal) || 0,
    protein: Number(per100.protein) || 0,
    carbs: Number(per100.carbs) || 0,
    fat: Number(per100.fat) || 0,
  };

  const grams = unit === 'กรัม' ? Math.round(amount) : Math.round(amount * 100);
  const multiplier = grams / 100;
  const scaled = {
    kcal: Math.round(base.kcal * multiplier),
    protein: round1(base.protein * multiplier),
    carbs: round1(base.carbs * multiplier),
    fat: round1(base.fat * multiplier),
  };

  const changeUnit = (nextUnit) => {
    setUnit(nextUnit);
    // Switching into grams seeds the amount with the serving weight.
    if (nextUnit === 'กรัม') {
      setAmount(Math.min(2000, Math.max(0.5, Math.round(Number(food?.grams) || 100))));
    } else {
      setAmount(1);
    }
  };

  const confirmSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await addFoodLog({
        name: food.name,
        meal,
        kcal: scaled.kcal,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        servings: amount,
        source: 'portion',
      });
      navigation.navigate('Tabs', { screen: 'Home' });
    } catch (error) {
      // Keep the screen open (values intact) so the user can retry saving.
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
          <Banner tone="warning" message="ไม่พบข้อมูลอาหารนี้ ลองเลือกใหม่อีกครั้ง" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const referenceKcal = Math.round(base.kcal);
  const servingLine = food.per100g ? 'ต่อ 100 กรัม' : food.serving || 'ต่อ 1 หน่วย';
  const kcalLine = food.per100g ? `${referenceKcal} kcal / 100 กรัม` : `${referenceKcal} kcal`;

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
          <Text style={styles.identityKcal}>{kcalLine}</Text>
        </Card>

        {/* Meal + portion controls */}
        <Card style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>มื้ออาหาร</Text>
          <View style={styles.mealWrap}>
            <SegmentedControl options={MEAL_OPTIONS} value={meal} onChange={setMeal} label="มื้ออาหาร" />
          </View>

          <PortionStepper
            amount={amount}
            onChange={setAmount}
            step={0.5}
            min={0.5}
            max={unit === 'กรัม' ? 2000 : 20}
            label="จำนวน"
            unit={unit}
          />

          <Text style={[styles.fieldLabel, styles.unitLabel]}>หน่วย</Text>
          <SegmentedControl options={UNIT_OPTIONS} value={unit} onChange={changeUnit} label="หน่วย" size="sm" />
        </Card>

        {/* Live calculation */}
        <View style={styles.calcCard} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Text style={styles.calcLabel}>ประมาณการ · {grams} กรัม</Text>
          <View style={styles.calcKcalRow}>
            <Text style={styles.calcKcal}>{scaled.kcal}</Text>
            <Text style={styles.calcKcalUnit}>kcal</Text>
          </View>
          <Text style={styles.calcMacros}>
            P {scaled.protein}g · C {scaled.carbs}g · F {scaled.fat}g
          </Text>
          <Text style={styles.calcNote}>ค่าตามปริมาณที่เลือก</Text>
        </View>

        <Text style={styles.hint}>
          เป็นตัวอย่างก่อนบันทึก ยังไม่รวมในยอดวันนี้ ย้อนกลับได้โดยไม่บันทึกการเปลี่ยนแปลง
        </Text>

        <PrimaryButton
          title={`บันทึก ${amount} ${unit} · ${scaled.kcal} kcal`}
          icon="checkmark"
          onPress={confirmSave}
          loading={saving}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
