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
// Portion chips are multiples of the AI's estimate (or 100 g for a manual pick).
const PORTION_STEPS = [
  { factor: 0.5, label: '½' },
  { factor: 1, label: '1' },
  { factor: 1.5, label: '1½' },
  { factor: 2, label: '2' },
];
const MAX_CANDIDATE_CHIPS = 3;
const DEFAULT_MANUAL_GRAMS = 100;

function validGrams(value) {
  const grams = Number(value);
  return Number.isFinite(grams) && grams > 0 && grams <= MAX_GRAMS;
}

function calculationKey(items) {
  return items
    .filter((item) => item.included && item.foodId && validGrams(item.grams))
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

function hasCoreNutrition(nutrition) {
  return Boolean(nutrition) && ['kcal', 'protein', 'carbs', 'fat'].every(
    (key) => nutrition[key] != null && Number.isFinite(Number(nutrition[key]))
  );
}

function formatAmount(value, digits = 1) {
  return value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toFixed(digits);
}

function formatKcal(value) {
  return value == null || !Number.isFinite(Number(value))
    ? '—'
    : Math.round(Number(value)).toLocaleString('th-TH');
}

function toCandidate(candidate) {
  const per100g = candidate.per100g || {};
  return {
    foodId: String(candidate.foodId),
    name: candidate.nameTh || candidate.nameEn || 'อาหารไม่ทราบชื่อ',
    nameEn: candidate.nameEn || '',
    confident: Boolean(candidate.confident),
    estimated: Array.isArray(candidate.estimated) ? candidate.estimated : [],
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

function initialItem(item, index) {
  const aiName = item.name_th || item.nameTh || item.name || '';
  const candidates = (item.candidates || []).map(toCandidate);
  // When the server marks the top database candidate as a confident match
  // (exact dish name or a listed variant, complete nutrition, not raw), start
  // from database values; the AI estimate stays one tap away.
  const best = !item.foodId && candidates[0]?.confident ? candidates[0] : null;
  const aiGrams = Number(item.estimated_grams?.likely ?? item.estimatedGrams) || 0;
  const baseGrams = aiGrams || DEFAULT_MANUAL_GRAMS;
  const chosen = best || (item.foodId
    ? { foodId: String(item.foodId), name: aiName, nameEn: item.name_en || '', per100g: item.per100g || null, estimated: [] }
    : null);
  return {
    ...item,
    id: item.id || `${Date.now()}_${index}`,
    included: true,
    name: chosen ? chosen.name : aiName,
    aiName,
    grams: String(baseGrams),
    baseGrams,
    estimatedGrams: aiGrams,
    estimatedNutrition: item.estimated_nutrition || item.estimatedNutrition || null,
    foodId: chosen ? chosen.foodId : '',
    per100g: chosen ? chosen.per100g : null,
    estimatedFields: chosen ? chosen.estimated || [] : [],
    autoMatched: Boolean(best),
    candidateList: chosen && !candidates.some((c) => c.foodId === chosen.foodId)
      ? [chosen, ...candidates]
      : candidates,
  };
}

export default function FoodScanReview({ analysis, onConfirm, onReset }) {
  const [items, setItems] = useState(() => (analysis.items || []).map(initialItem));
  const [searchOpen, setSearchOpen] = useState({});
  const [queries, setQueries] = useState({});
  const [searchResults, setSearchResults] = useState({});
  const [searching, setSearching] = useState({});
  const [searchErrors, setSearchErrors] = useState({});
  const [computedByItem, setComputedByItem] = useState({});
  const [computedKey, setComputedKey] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const includedItems = items.filter((item) => item.included);
  const currentCalculationKey = calculationKey(items);
  const dbItems = includedItems.filter((item) => item.foodId && validGrams(item.grams));

  useEffect(() => {
    if (dbItems.length === 0) {
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
          dbItems.map((item) => ({ foodId: item.foodId, grams: Number(item.grams) }))
        );
        if (response.notFound?.length) {
          throw new Error(`อาหารไม่อยู่ในฐานข้อมูล: ${response.notFound.join(', ')}`);
        }
        if (!active) return;

        const nextValues = {};
        dbItems.forEach((item, index) => {
          const breakdown = response.breakdown?.[index];
          if (breakdown) nextValues[item.id] = displayNutrition(breakdown.nutrition);
        });
        setComputedByItem(nextValues);
        setComputedKey(currentCalculationKey);
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
    const query = (queries[item.id] ?? item.aiName ?? '').trim();
    if (!query) return;

    setSearching((previous) => ({ ...previous, [item.id]: true }));
    setSearchErrors((previous) => ({ ...previous, [item.id]: '' }));
    try {
      const matches = await searchNutritionFoods(query, 5);
      setSearchResults((previous) => ({ ...previous, [item.id]: matches }));
      if (matches.length === 0) {
        setSearchErrors((previous) => ({ ...previous, [item.id]: 'ไม่พบเมนูนี้ ลองใช้ชื่ออื่น' }));
      }
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
      estimatedFields: food.estimated || [],
      autoMatched: false,
      source: 'nutrition_database',
      // A food picked from search joins the chips so the user can switch back to it.
      candidateList: item.candidateList.some((c) => c.foodId === food.foodId)
        ? item.candidateList
        : [food, ...item.candidateList],
    });
    setSearchOpen((previous) => ({ ...previous, [item.id]: false }));
    setSearchResults((previous) => ({ ...previous, [item.id]: [] }));
  };

  // Back to the AI's own name and nutrition estimate.
  const chooseAiEstimate = (item) => {
    updateItem(item.id, {
      foodId: '',
      name: item.aiName,
      per100g: null,
      estimatedFields: [],
      autoMatched: false,
      source: 'ai_estimate',
    });
  };

  const getItemNutrition = (item) => {
    if (item.foodId) return computedByItem[item.id] || null;
    if (!item.estimatedNutrition) return null;
    const base = displayNutrition(item.estimatedNutrition);
    const baselineGrams = item.estimatedGrams;
    const grams = Number(item.grams);
    if (!baselineGrams || !Number.isFinite(grams) || grams <= 0) return base;
    const factor = grams / baselineGrams;
    return Object.fromEntries(
      Object.entries(base).map(([key, value]) => [key, value == null ? null : Number(value) * factor])
    );
  };

  const totals = includedItems.reduce((sum, item) => {
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

  const unchosenItems = includedItems.filter((item) => !item.foodId && !item.estimatedNutrition);
  const invalidGramItems = includedItems.filter((item) => !validGrams(item.grams));
  const missingNutrition = includedItems.some((item) => {
    if (!item.foodId && !item.estimatedNutrition) return false; // reported as unchosen
    const nutrition = item.foodId ? computedByItem[item.id] : displayNutrition(item.estimatedNutrition);
    if (item.foodId && !nutrition) return false; // still calculating
    return !hasCoreNutrition(nutrition);
  });
  const dbCalculationPending = dbItems.length > 0 && computedKey !== currentCalculationKey;
  const canSave =
    includedItems.length > 0 &&
    unchosenItems.length === 0 &&
    invalidGramItems.length === 0 &&
    !missingNutrition &&
    !calculating &&
    !dbCalculationPending &&
    !calculationError;

  const confirm = async () => {
    if (saving || !canSave) return;
    // Only ticked items are saved; candidate lists are only needed on this screen.
    const reviewItems = includedItems.map(
      ({ candidates: _candidates, candidateList: _candidateList, included: _included, baseGrams: _baseGrams, ...item }) => ({
        ...item,
        grams: Number(item.grams),
        nutrition: getItemNutrition(item),
        nutritionSource: item.foodId ? 'database' : 'ai_estimate',
      })
    );
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

  const addManualItem = () => {
    const id = `manual_${Date.now()}`;
    setItems((previous) => [...previous, {
      id,
      included: true,
      name: '',
      aiName: '',
      grams: String(DEFAULT_MANUAL_GRAMS),
      baseGrams: DEFAULT_MANUAL_GRAMS,
      estimatedGrams: 0,
      estimatedNutrition: null,
      confidence: 0,
      foodId: '',
      per100g: null,
      estimatedFields: [],
      candidateList: [],
    }]);
    setSearchOpen((previous) => ({ ...previous, [id]: true }));
    setQueries((previous) => ({ ...previous, [id]: '' }));
  };

  const ctaTitle = includedItems.length === 0
    ? 'เลือกอย่างน้อย 1 รายการ'
    : `บันทึก ${includedItems.length} รายการ${totals.kcal != null ? ` · ${formatKcal(totals.kcal)} kcal` : ''}`;

  return (
    <View>
      <Text style={styles.title}>ใช่เมนูเหล่านี้ไหม?</Text>
      <Text style={styles.helper}>AI ประเมินจากภาพ ค่าจริงอาจต่างตามสูตรและปริมาณ</Text>

      {items.map((item, index) => {
        const nutrition = item.included ? getItemNutrition(item) : null;
        const gramsValid = validGrams(item.grams);
        const chips = item.candidateList.slice(0, MAX_CANDIDATE_CHIPS);
        // Keep the current database pick visible even when it ranks below the cut.
        if (item.foodId && !chips.some((c) => c.foodId === item.foodId)) {
          const current = item.candidateList.find((c) => c.foodId === item.foodId);
          if (current) chips[chips.length - 1] = current;
        }
        const aiChipAvailable = Boolean(item.aiName) && hasCoreNutrition(displayNutrition(item.estimatedNutrition));
        const isSearchOpen = searchOpen[item.id] || (!item.foodId && !aiChipAvailable && chips.length === 0);
        const title = item.name || 'เลือกเมนู';
        const grams = Number(item.grams);
        return (
          <View key={item.id} style={[styles.itemCard, !item.included && styles.itemCardExcluded]}>
            <Pressable
              onPress={() => updateItem(item.id, { included: !item.included })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.included }}
              accessibilityLabel={`รวม ${title} ในบันทึก`}
              style={styles.itemHeader}
            >
              <View style={styles.indexBadge}>
                <Text style={styles.indexBadgeText}>{index + 1}</Text>
              </View>
              <View style={styles.itemHeaderText}>
                <Text style={styles.itemTitle} numberOfLines={2}>{title}</Text>
                <Text style={styles.itemMeta}>
                  {gramsValid ? `${Math.round(grams)} กรัม` : 'ใส่น้ำหนัก'}
                  {item.foodId ? '' : item.aiName && item.name === item.aiName ? ' · ค่าประมาณจาก AI' : ''}
                </Text>
              </View>
              <Ionicons
                name={item.included ? 'checkbox' : 'square-outline'}
                size={26}
                color={item.included ? colors.primary : colors.inkMuted}
              />
            </Pressable>

            {item.included && (
              <>
                <Text style={styles.label}>เมนูที่ใกล้เคียง</Text>
                <View style={styles.chipRow}>
                  {chips.map((food) => {
                    const selected = item.foodId === food.foodId;
                    return (
                      <Pressable
                        key={food.foodId}
                        onPress={() => chooseFood(item, food)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`เลือก ${food.name}`}
                        style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                          {food.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {aiChipAvailable && (
                    <Pressable
                      onPress={() => chooseAiEstimate(item)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: !item.foodId }}
                      accessibilityLabel={`ใช้ค่าประมาณจาก AI: ${item.aiName}`}
                      style={({ pressed }) => [styles.chip, !item.foodId && styles.chipSelected, pressed && styles.pressed]}
                    >
                      <Ionicons name="sparkles-outline" size={14} color={!item.foodId ? colors.white : colors.turmericDark} />
                      <Text style={[styles.chipText, !item.foodId && styles.chipTextSelected]} numberOfLines={1}>
                        {item.aiName} (AI)
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => setSearchOpen((previous) => ({ ...previous, [item.id]: !isSearchOpen }))}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isSearchOpen }}
                    accessibilityLabel="ค้นหาเมนูอื่น"
                    style={({ pressed }) => [styles.chip, styles.chipDashed, pressed && styles.pressed]}
                  >
                    <Ionicons name="search" size={14} color={colors.primary} />
                    <Text style={[styles.chipText, styles.chipTextLink]}>เมนูอื่น</Text>
                  </Pressable>
                </View>

                {isSearchOpen && (
                  <View style={styles.searchBlock}>
                    <View style={styles.searchRow}>
                      <TextInput
                        value={queries[item.id] ?? item.aiName ?? ''}
                        onChangeText={(value) => {
                          setQueries((previous) => ({ ...previous, [item.id]: value }));
                          setSearchResults((previous) => ({ ...previous, [item.id]: [] }));
                          setSearchErrors((previous) => ({ ...previous, [item.id]: '' }));
                        }}
                        onSubmitEditing={() => searchForItem(item)}
                        returnKeyType="search"
                        style={[styles.input, styles.searchInput]}
                        placeholder="พิมพ์ชื่อเมนู เช่น ผัดกะเพรา"
                        placeholderTextColor={colors.inkFaint}
                        accessibilityLabel="ค้นหาเมนูในฐานข้อมูล"
                      />
                      <Pressable
                        onPress={() => searchForItem(item)}
                        disabled={searching[item.id]}
                        accessibilityRole="button"
                        accessibilityLabel="ค้นหา"
                        style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
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
                        style={({ pressed }) => [styles.searchResult, pressed && styles.pressed]}
                      >
                        <Text style={styles.searchResultName}>{food.name}</Text>
                        <Text style={styles.searchResultMeta}>
                          {food.estimated?.includes('kcal') ? '≈' : ''}
                          {food.per100g.kcal ?? '—'} kcal / 100 กรัม
                        </Text>
                      </Pressable>
                    ))}
                    {!!searchErrors[item.id] && (
                      <Text style={styles.searchError}>{searchErrors[item.id]}</Text>
                    )}
                  </View>
                )}

                <Text style={styles.label}>
                  {item.estimatedGrams ? 'ปริมาณ (เท่าของที่ AI ประเมิน)' : `ปริมาณ (เท่าของ ${DEFAULT_MANUAL_GRAMS} กรัม)`}
                </Text>
                <View style={styles.portionRow}>
                  {PORTION_STEPS.map((step) => {
                    const stepGrams = Math.round(item.baseGrams * step.factor);
                    const selected = gramsValid && Math.round(grams) === stepGrams;
                    return (
                      <Pressable
                        key={step.label}
                        onPress={() => updateItem(item.id, { grams: String(stepGrams) })}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${step.label} เท่า ${stepGrams} กรัม`}
                        style={({ pressed }) => [styles.portionChip, selected && styles.chipSelected, pressed && styles.pressed]}
                      >
                        <Text style={[styles.portionChipText, selected && styles.chipTextSelected]}>{step.label}</Text>
                      </Pressable>
                    );
                  })}
                  <View style={[styles.gramsBox, !gramsValid && styles.inputInvalid]}>
                    <TextInput
                      value={item.grams}
                      onChangeText={(value) => updateItem(item.id, { grams: value })}
                      keyboardType="decimal-pad"
                      style={styles.gramsInput}
                      accessibilityLabel={`น้ำหนัก ${title} เป็นกรัม`}
                    />
                    <Text style={styles.gramsUnit}>ก.</Text>
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.itemMacros} numberOfLines={1}>
                    {nutrition
                      ? `P ${formatAmount(nutrition.protein, 0)} · C ${formatAmount(nutrition.carbs, 0)} · F ${formatAmount(nutrition.fat, 0)} ก.`
                      : item.foodId && calculating ? 'กำลังคำนวณ…' : ''}
                    {item.foodId && item.estimatedFields?.length ? ' · บางค่าเป็นค่าประมาณ' : ''}
                  </Text>
                  <Text style={styles.itemKcal}>
                    {formatKcal(nutrition?.kcal)}
                    <Text style={styles.itemKcalUnit}> kcal</Text>
                  </Text>
                </View>
              </>
            )}
          </View>
        );
      })}

      {items.length === 0 && (
        <View style={styles.errorBlock}>
          <Banner tone="warning" message="ไม่พบอาหารในภาพ เพิ่มรายการเองหรือสแกนใหม่ได้เลย" />
        </View>
      )}

      <Pressable
        onPress={addManualItem}
        accessibilityRole="button"
        accessibilityLabel="เพิ่มรายการที่ AI มองไม่เห็น"
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={20} color={colors.primaryDark} />
        <Text style={styles.addBtnText}>เพิ่มสิ่งที่ AI มองไม่เห็น</Text>
      </Pressable>

      {includedItems.length > 0 && (
        <View style={styles.totalsCard}>
          <View style={styles.totalsHeader}>
            <Text style={styles.totalsTitle}>รวม {includedItems.length} รายการ</Text>
            <Text style={styles.totalsKcal}>
              {formatKcal(totals.kcal)}
              <Text style={styles.totalsKcalUnit}> kcal</Text>
            </Text>
          </View>
          <View style={styles.totalsMacroRow}>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.protein }]} />
              <Text style={styles.macroText}>โปรตีน {formatAmount(totals.protein, 0)} ก.</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.carbs }]} />
              <Text style={styles.macroText}>คาร์บ {formatAmount(totals.carbs, 0)} ก.</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: colors.fat }]} />
              <Text style={styles.macroText}>ไขมัน {formatAmount(totals.fat, 0)} ก.</Text>
            </View>
          </View>
        </View>
      )}

      {!!calculationError && (
        <View style={styles.errorBlock}>
          <Banner tone="error" message={calculationError} />
        </View>
      )}
      {unchosenItems.length > 0 && (
        <View style={styles.errorBlock}>
          <Banner tone="warning" message="เลือกเมนูให้ครบทุกรายการที่ติ๊กไว้ หรือเอาติ๊กออก" />
        </View>
      )}
      {invalidGramItems.length > 0 && (
        <View style={styles.errorBlock}>
          <Banner tone="error" message={`น้ำหนักต้องอยู่ระหว่าง 1–${MAX_GRAMS} กรัม`} />
        </View>
      )}
      {missingNutrition && (
        <View style={styles.errorBlock}>
          <Banner tone="error" message="บางรายการยังไม่มีค่าพลังงานหรือสารอาหารหลัก ลองเลือกเมนูอื่นที่ใกล้เคียง" />
        </View>
      )}
      {!!saveError && (
        <View style={styles.errorBlock}>
          <Banner tone="error" message={saveError} />
        </View>
      )}

      <PrimaryButton
        title={ctaTitle}
        icon="checkmark"
        onPress={confirm}
        loading={saving}
        disabled={!canSave || saving}
      />
      <Pressable
        onPress={onReset}
        disabled={saving}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
      >
        <Text style={styles.cancelText}>ยกเลิกและถ่ายใหม่</Text>
      </Pressable>
    </View>
  );
}
