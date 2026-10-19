import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from './AppText';
import { TextInput } from './AppTextInput';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { searchNutritionFoods } from '../services/foodService';
import { calculateNutrition } from '../services/nutritionService';
import PrimaryButton from './PrimaryButton';
import Banner from './Banner';
import styles from '../style/components/FoodScanReviewStyles';

const MAX_GRAMS = 5000;

function validGrams(value) {
  const grams = Number(value);
  return Number.isFinite(grams) && grams > 0 && grams <= MAX_GRAMS;
}

function calculationKey(items) {
  return items
    .filter((item) => item.foodId && validGrams(item.grams))
    .map((item) => `${item.id}:${item.foodId}:${Number(item.grams)}`)
    .join('|');
}

function displayNutrition(nutrition) {
  const read = (key, alias) => {
    if (nutrition?.[key] !== undefined) return nutrition[key];
    if (nutrition?.[alias] !== undefined) return nutrition[alias];
    return null;
  };
  return {
    kcal: read('kcal'),
    protein: read('protein', 'protein_g'),
    carbs: read('carbs', 'carbAvailable_g'),
    fat: read('fat', 'fat_g'),
    fiber: read('fiber', 'fiber_g'),
    sugar: read('sugar', 'sugar_g'),
    sodium: read('sodium', 'sodium_mg'),
    calcium: read('calcium', 'calcium_mg'),
    iron: read('iron', 'iron_mg'),
    vitaminC: read('vitaminC', 'vitaminC_mg'),
  };
}

function formatAmount(value, digits = 1) {
  return value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toFixed(digits);
}

function toCandidate(candidate) {
  const per100g = candidate.per100g || {};
  return {
    foodId: String(candidate.foodId),
    name: candidate.nameTh || candidate.nameEn || 'อาหารไม่ทราบชื่อ',
    nameEn: candidate.nameEn || '',
    per100g: {
      kcal: per100g.kcal ?? null,
      protein: per100g.protein_g ?? null,
      carbs: per100g.carbAvailable_g ?? null,
      fat: per100g.fat_g ?? null,
      fiber: per100g.fiber_g ?? null,
      sugar: per100g.sugar_g ?? null,
      sodium: per100g.sodium_mg ?? null,
      calcium: per100g.calcium_mg ?? null,
      iron: per100g.iron_mg ?? null,
      vitaminC: per100g.vitaminC_mg ?? null,
    },
  };
}

export default function FoodScanReview({ analysis, onConfirm, onReset }) {
  const [initialItems] = useState(() =>
    (analysis.items || []).map((item, index) => ({
      ...item,
      id: item.id || `${Date.now()}_${index}`,
      name: item.name_th || item.nameTh || item.name || '',
      grams: String(item.estimated_grams?.likely ?? item.estimatedGrams ?? ''),
      estimatedGrams: Number(item.estimated_grams?.likely ?? item.estimatedGrams) || 0,
      estimatedNutrition: item.estimated_nutrition || item.estimatedNutrition || null,
      foodId: item.foodId || '',
      per100g: item.per100g || null,
    }))
  );
  const [items, setItems] = useState(initialItems);
  const [queries, setQueries] = useState({});
  const [searchResults, setSearchResults] = useState(() =>
    Object.fromEntries(initialItems.map((item) => [item.id, (item.candidates || []).map(toCandidate)]))
  );
  const [searching, setSearching] = useState({});
  const [searchErrors, setSearchErrors] = useState({});
  const [computedByItem, setComputedByItem] = useState({});
  const [computedKey, setComputedKey] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const currentCalculationKey = calculationKey(items);
  const selectedItems = items.filter((item) => item.foodId && validGrams(item.grams));

  useEffect(() => {
    if (selectedItems.length === 0) {
      setComputedByItem({});
      setComputedKey('');
      setCalculationError('');
      setCalculating(false);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setCalculating(true);
      setCalculationError('');
      try {
        const response = await calculateNutrition(
          selectedItems.map((item) => ({ foodId: item.foodId, grams: Number(item.grams) }))
        );
        if (response.notFound?.length) {
          throw new Error(`อาหารไม่อยู่ในฐานข้อมูล: ${response.notFound.join(', ')}`);
        }
        if (!active) return;

        const nextValues = {};
        selectedItems.forEach((item, index) => {
          const breakdown = response.breakdown?.[index];
          if (breakdown) nextValues[item.id] = displayNutrition(breakdown.nutrition);
        });
        setComputedByItem(nextValues);
        setComputedKey(calculationKey(items));
      } catch (error) {
        if (active) setCalculationError(error.message || 'คำนวณสารอาหารจากฐานข้อมูลไม่สำเร็จ');
      } finally {
        if (active) setCalculating(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentCalculationKey]);

  const updateItem = (itemId, patch) => {
    setItems((previous) =>
      previous.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    );
  };

  const searchForItem = async (item) => {
    const query = (queries[item.id] ?? item.name).trim();
    if (!query) return;

    setSearching((previous) => ({ ...previous, [item.id]: true }));
    setSearchErrors((previous) => ({ ...previous, [item.id]: '' }));
    try {
      const matches = await searchNutritionFoods(query, 5);
      setSearchResults((previous) => ({ ...previous, [item.id]: matches }));
    } catch (error) {
      setSearchErrors((previous) => ({
        ...previous,
        [item.id]: error.message || 'ค้นหาฐานข้อมูลอาหารไม่สำเร็จ',
      }));
    } finally {
      setSearching((previous) => ({ ...previous, [item.id]: false }));
    }
  };

  const chooseFood = (item, food) => {
    updateItem(item.id, {
      foodId: food.foodId,
      name: food.name,
      nameEn: food.nameEn,
      per100g: food.per100g,
      source: 'nutrition_database',
    });
    setQueries((previous) => ({ ...previous, [item.id]: food.name }));
    setSearchResults((previous) => ({ ...previous, [item.id]: [] }));
  };

  const getItemNutrition = (item) => {
    if (item.foodId) return computedByItem[item.id] || null;
    const base = displayNutrition(item.estimatedNutrition);
    const baselineGrams = item.estimatedGrams;
    const grams = Number(item.grams);
    if (!baselineGrams || !Number.isFinite(grams) || grams <= 0) return base;
    const factor = grams / baselineGrams;
    return Object.fromEntries(
      Object.entries(base).map(([key, value]) => [key, value == null ? null : Number(value) * factor])
    );
  };

  const totals = items.reduce((sum, item) => {
    const nutrition = getItemNutrition(item);
    if (!nutrition) return sum;
    Object.keys(sum).forEach((key) => {
      if (nutrition[key] == null) {
        sum[key] = null;
      } else if (sum[key] != null) {
        sum[key] += Number(nutrition[key]);
      }
    });
    return sum;
  }, Object.fromEntries(['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'calcium', 'iron', 'vitaminC'].map((key) => [key, 0])));

  const invalidItems = items.filter((item) => !item.name.trim() || !validGrams(item.grams));
  const missingNutrition = items.some((item) => {
    const nutrition = item.foodId ? computedByItem[item.id] : item.estimatedNutrition;
    if (!nutrition) return !item.foodId;
    return ['kcal', 'protein', 'carbs', 'fat'].some(
      (key) => nutrition[key] == null || !Number.isFinite(Number(nutrition[key]))
    );
  });
  const dbCalculationPending = selectedItems.length > 0 && computedKey !== currentCalculationKey;
  const canSave =
    items.length > 0 &&
    invalidItems.length === 0 &&
    !missingNutrition &&
    !calculating &&
    !dbCalculationPending &&
    !calculationError;

  const confirm = async () => {
    if (saving) return;
    const reviewItems = items.map((item) => ({
      ...item,
      grams: Number(item.grams),
      nutrition: getItemNutrition(item),
      nutritionSource: item.foodId ? 'database' : 'ai_estimate',
    }));
    setSaving(true);
    setSaveError('');
    try {
      await onConfirm({ items: reviewItems, totals });
    } catch (error) {
      setSaveError(error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Text style={styles.title}>ตรวจสอบรายการอาหาร</Text>
      <Text style={styles.helper}>
        ชื่อและปริมาณจากภาพเป็นค่าประมาณ แก้ไขได้ก่อนบันทึก และเลือกจับคู่กับฐานข้อมูลเพื่อความแม่นยำ
      </Text>

      {!!analysis.reference_object && (
        <View style={styles.referenceRow}>
          <Ionicons name="eye-outline" size={15} color={colors.inkMuted} />
          <Text style={styles.referenceText}> สิ่งอ้างอิงในภาพ: {analysis.reference_object}</Text>
        </View>
      )}

      {items.map((item, index) => {
        const gramsRange = item.estimated_grams || {};
        const nutrition = getItemNutrition(item);
        const gramsValid = validGrams(item.grams);
        return (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>รายการที่ {index + 1}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`ลบ ${item.name || `รายการที่ ${index + 1}`}`}
                hitSlop={10}
                onPress={() => setItems((previous) => previous.filter((entry) => entry.id !== item.id))}
                style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </Pressable>
            </View>

            <Text style={styles.label}>ชื่ออาหาร</Text>
            <TextInput
              value={item.name}
              onChangeText={(value) => {
                updateItem(item.id, { name: value, foodId: '', per100g: null, source: 'ai_estimate' });
                setQueries((previous) => ({ ...previous, [item.id]: value }));
              }}
              style={styles.input}
              placeholder="แก้ชื่ออาหาร"
              placeholderTextColor={colors.inkFaint}
            />

            <Text style={styles.label}>ปริมาณ (กรัม)</Text>
            <TextInput
              value={item.grams}
              onChangeText={(value) => updateItem(item.id, { grams: value })}
              keyboardType="decimal-pad"
              style={[styles.input, !gramsValid && item.grams !== '' && styles.inputInvalid]}
              placeholder="ใส่น้ำหนักโดยประมาณ"
              placeholderTextColor={colors.inkFaint}
            />
            {gramsRange.min != null && gramsRange.max != null && (
              <View style={styles.estimateRow}>
                <Ionicons name="sparkles-outline" size={13} color={colors.turmericDark} />
                <Text style={styles.estimateText}>
                  AI ประเมิน {gramsRange.min}–{gramsRange.max} กรัม · ความมั่นใจ{' '}
                  {Math.round((item.confidence || 0) * 100)}%
                </Text>
              </View>
            )}

            <View style={styles.searchRow}>
              <TextInput
                value={queries[item.id] ?? item.name}
                onChangeText={(value) => {
                  setQueries((previous) => ({ ...previous, [item.id]: value }));
                  setSearchResults((previous) => ({ ...previous, [item.id]: [] }));
                  setSearchErrors((previous) => ({ ...previous, [item.id]: '' }));
                }}
                onSubmitEditing={() => searchForItem(item)}
                returnKeyType="search"
                style={[styles.input, styles.searchInput]}
                placeholder="ค้นหาเมนูในฐานข้อมูล"
                placeholderTextColor={colors.inkFaint}
              />
              <Pressable
                onPress={() => searchForItem(item)}
                disabled={searching[item.id]}
                accessibilityRole="button"
                accessibilityLabel={`ค้นหา ${item.name} ในฐานข้อมูล`}
                style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.85 }]}
              >
                {searching[item.id] ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Ionicons name="search" size={18} color={colors.white} />
                )}
              </Pressable>
            </View>

            {(searchResults[item.id] || []).map((food) => (
              <Pressable
                key={food.foodId}
                onPress={() => chooseFood(item, food)}
                accessibilityRole="button"
                accessibilityLabel={`เลือก ${food.name}`}
                style={({ pressed }) => [styles.searchResult, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.searchResultName}>{food.name}</Text>
                <Text style={styles.searchResultMeta}>
                  {food.nameEn ? `${food.nameEn} · ` : ''}
                  {food.per100g.kcal ?? '-'} kcal / 100 g
                </Text>
              </Pressable>
            ))}
            {!!searchErrors[item.id] && (
              <View style={styles.errorBlock}>
                <Banner tone="error" message={searchErrors[item.id]} />
              </View>
            )}

            <View style={styles.sourceRow}>
              <View style={[styles.sourceChip, item.foodId ? styles.sourceChipDb : styles.sourceChipAi]}>
                <Text
                  style={[
                    styles.sourceChipText,
                    item.foodId ? styles.sourceChipTextDb : styles.sourceChipTextAi,
                  ]}
                >
                  {item.foodId ? 'ฐานข้อมูลโภชนาการ' : 'ค่าประมาณจาก AI'}
                </Text>
              </View>
              {!!nutrition && (
                <Text style={styles.nutritionText} numberOfLines={2}>
                  {nutrition.kcal == null ? '—' : Math.round(nutrition.kcal)} kcal · P{' '}
                  {formatAmount(nutrition.protein)} · C {formatAmount(nutrition.carbs)} · F{' '}
                  {formatAmount(nutrition.fat)} g
                </Text>
              )}
            </View>
            {Boolean(item.foodId) && Boolean(calculating) ? (
              <Text style={styles.estimateText}>กำลังคำนวณจากฐานข้อมูล...</Text>
            ) : null}
          </View>
        );
      })}

      {items.length === 0 && (
        <View style={styles.errorBlock}>
          <Banner tone="warning" message="ยังไม่มีรายการอาหาร กรุณาสแกนใหม่หรือค้นหาเมนูจากฐานข้อมูล" />
        </View>
      )}

      <Pressable
        onPress={() => setItems((previous) => [...previous, {
          id: `manual_${Date.now()}`,
          name: '',
          grams: '',
          estimatedGrams: 0,
          estimatedNutrition: null,
          confidence: 0,
          foodId: '',
        }])}
        accessibilityRole="button"
        accessibilityLabel="เพิ่มรายการอาหาร"
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="add" size={20} color={colors.primaryDark} />
        <Text style={styles.addBtnText}>เพิ่มรายการอาหาร</Text>
      </Pressable>

      {items.length > 0 && (
        <View style={styles.totalsCard}>
          <Text style={styles.totalsTitle}>ยอดรวมโดยประมาณ</Text>
          <Text style={styles.totalsKcal}>{formatAmount(totals.kcal, 0)} kcal</Text>
          <View style={styles.totalsMacroRow}>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.protein }]} />
              <Text style={styles.macroText}>โปรตีน {formatAmount(totals.protein)} g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.carbs }]} />
              <Text style={styles.macroText}>คาร์บ {formatAmount(totals.carbs)} g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.fat }]} />
              <Text style={styles.macroText}>ไขมัน {formatAmount(totals.fat)} g</Text>
            </View>
          </View>
          <Text style={styles.totalsMicro}>
            ใยอาหาร {formatAmount(totals.fiber)} g · น้ำตาล {formatAmount(totals.sugar)} g · โซเดียม{' '}
            {formatAmount(totals.sodium, 0)} mg
          </Text>
        </View>
      )}

      {calculating && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadingText}>กำลังคำนวณสารอาหารจากฐานข้อมูล...</Text>
        </View>
      )}
      {!!calculationError && (
        <View style={styles.errorBlock}>
          <Banner tone="error" message={calculationError} />
        </View>
      )}
      {invalidItems.length > 0 && (
        <View style={styles.errorBlock}>
          <Banner
            tone="error"
            message={`กรอกชื่ออาหารและน้ำหนัก 1–${MAX_GRAMS} กรัมให้ครบทุกแถวก่อนบันทึก`}
          />
        </View>
      )}
      {missingNutrition && (
        <View style={styles.errorBlock}>
          <Banner
            tone="error"
            message="ต้องมีค่าพลังงาน โปรตีน คาร์บ และไขมันของทุกรายการก่อนบันทึก (เลือกอาหารจากฐานข้อมูลได้)"
          />
        </View>
      )}

      {!!saveError && (
        <View style={styles.errorBlock}>
          <Banner tone="error" message={saveError} />
        </View>
      )}

      <View style={styles.actionRow}>
        <PrimaryButton
          title="ยกเลิก"
          variant="outline"
          onPress={onReset}
          disabled={saving}
          style={[styles.actionGap, { flex: 1 }]}
        />
        <PrimaryButton
          title="ยืนยันและบันทึก"
          onPress={confirm}
          loading={saving}
          disabled={!canSave || saving}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
