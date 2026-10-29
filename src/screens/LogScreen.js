import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { searchNutritionFoods } from '../services/foodService';
import { isOfflineError } from '../services/atlasService';
import { useApp } from '../context/AppContext';
import Screen from '../components/Screen';
import FoodSearchRow from '../components/FoodSearchRow';
import SkeletonRows from '../components/SkeletonRows';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import IconButton from '../components/IconButton';
import { MEAL_OPTIONS, defaultMealForNow } from '../components/MealChips';
import EmptyState from '../components/EmptyState';
import Banner from '../components/Banner';
import OfflineState from '../components/OfflineState';
import ScreenHeader from '../components/ScreenHeader';
import SectionHeader from '../components/SectionHeader';
import SegmentedControl from '../components/SegmentedControl';
import styles from '../style/screens/LogScreenStyles';

const SEARCH_DEBOUNCE_MS = 200;
const SEARCH_LIMIT = 20;
const RECENT_LIMIT = 6;

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');

/**
 * Database foods the user logged most recently (newest first, one per food),
 * so everyday dishes are one tap away. Built from the user's own logs only.
 */
function recentFoodsFrom(logsByDay) {
  const seen = new Set();
  const out = [];
  Object.keys(logsByDay)
    .sort((a, b) => (a < b ? 1 : -1))
    .forEach((dateKey) => {
      [...(logsByDay[dateKey] || [])]
        .sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))
        .forEach((entry) => {
          const id = entry.foodId != null ? String(entry.foodId) : '';
          if (!id || seen.has(id) || out.length >= RECENT_LIMIT) return;
          seen.add(id);
          out.push(entry);
        });
    });
  return out;
}

/**
 * Log search screen: pick a meal, search the real food service, open the
 * portion screen for a result (or a recent food), or add a food manually.
 */
export default function LogScreen({ navigation, route }) {
  const { addFoodLog, logsByDay } = useApp();
  const requestedMeal = route?.params?.meal;
  const [meal, setMeal] = useState(() => requestedMeal || defaultMealForNow());

  // Home's per-meal "+" opens this tab with that meal preselected.
  useEffect(() => {
    if (requestedMeal) setMeal(requestedMeal);
  }, [requestedMeal, route?.params?.requestedAt]);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  // Set (to { timedOut }) when the server couldn't be reached, so we show an offline state.
  const [searchOffline, setSearchOffline] = useState(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedNotice, setSavedNotice] = useState('');
  const searchInput = useRef(null);

  const recentFoods = useMemo(() => recentFoodsFrom(logsByDay), [logsByDay]);

  // Debounced search of the server's food database (with stale-response guard).
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      setSearchError('');
      setSearchOffline(null);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError('');
    setSearchOffline(null);
    const timer = setTimeout(async () => {
      try {
        const data = await searchNutritionFoods(trimmed, SEARCH_LIMIT);
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) {
          setResults([]);
          if (isOfflineError(error)) setSearchOffline({ timedOut: !!error.timedOut });
          setSearchError(error?.message || 'ค้นหาอาหารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchAttempt]);

  const goToPortion = (food) => {
    navigation.navigate('Portion', {
      food,
      foodId: String(food.foodId || food.id),
      meal,
    });
  };

  // Recent entries only carry the foodId; Portion loads the food by id.
  const goToRecent = (entry) => {
    navigation.navigate('Portion', { foodId: String(entry.foodId), meal });
  };

  const openManual = () => {
    setManualOpen(true);
    setSavedNotice('');
    if (!manualName && query.trim()) setManualName(query.trim());
  };

  const saveManual = async () => {
    const name = manualName.trim();
    if (!name || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await addFoodLog({
        name,
        meal,
        kcal: Number(manualKcal) || 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        servings: 1,
        source: 'manual',
      });
      setManualName('');
      setManualKcal('');
      setManualOpen(false);
      setQuery('');
      setSavedNotice(`บันทึก “${name}” แล้ว ดูได้ที่หน้าหลัก`);
    } catch (error) {
      // Keep the form open (with the typed values) so the user can retry.
      setSaveError(error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const trimmedQuery = query.trim();

  let body;
  if (!trimmedQuery) {
    body = recentFoods.length > 0 ? (
      <>
        <SectionHeader title="เมนูที่บันทึกล่าสุด" meta={`${recentFoods.length} รายการ`} />
        {recentFoods.map((entry) => (
          <FoodSearchRow
            key={String(entry.foodId)}
            name={entry.name}
            subtitle={`ครั้งก่อน ${entry.servings || 1} ${entry.unit || 'หน่วย'}${entry.grams ? ` · ${formatNumber(entry.grams)} กรัม` : ''}`}
            kcal={entry.kcal}
            onPress={() => goToRecent(entry)}
          />
        ))}
      </>
    ) : (
      <Card>
        <EmptyState
          icon="search-outline"
          title="พิมพ์ชื่ออาหารเพื่อค้นหา"
          message="ค้นได้ทั้งชื่อไทยและอังกฤษ จากฐานข้อมูลอาหารไทยกว่า 1,000 รายการ"
        />
      </Card>
    );
  } else if (searching) {
    body = (
      <>
        <SectionHeader title="อาหารที่พบ" meta="กำลังค้นหา…" />
        <SkeletonRows count={3} label="กำลังค้นหาอาหาร" />
      </>
    );
  } else if (searchOffline) {
    body = (
      <Card>
        <OfflineState timedOut={searchOffline.timedOut} onRetry={() => setSearchAttempt((attempt) => attempt + 1)} />
      </Card>
    );
  } else if (searchError) {
    body = (
      <Card>
        <EmptyState
          icon="alert-circle-outline"
          title="ค้นหาไม่สำเร็จ"
          message={searchError}
          actionTitle="ลองใหม่"
          actionIcon="refresh"
          onAction={() => setSearchAttempt((attempt) => attempt + 1)}
        />
      </Card>
    );
  } else if (results.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon="search-outline"
          title={`ไม่พบ “${trimmedQuery}”`}
          message="ลองพิมพ์ให้สั้นลง หรือใช้ชื่อเรียกอื่น เช่น “กะเพรา” แทน “ผัดกะเพราไก่ไข่ดาว”"
          actionTitle="เพิ่มเมนูนี้เอง"
          actionIcon="create-outline"
          onAction={openManual}
          secondaryTitle="ล้างคำค้น"
          onSecondary={() => setQuery('')}
        />
      </Card>
    );
  } else {
    body = (
      <>
        <SectionHeader title="อาหารที่พบ" meta={`${results.length} รายการ`} />
        {results.map((food) => (
          <FoodSearchRow
            key={String(food.id)}
            name={food.name}
            query={trimmedQuery}
            subtitle={food.nameEn || undefined}
            kcal={food.per100g?.kcal}
            kcalSuffix="/ 100 กรัม"
            kcalEstimated={food.estimated?.includes('kcal')}
            onPress={() => goToPortion(food)}
          />
        ))}
      </>
    );
  }

  return (
    <Screen variant="flow">
      <ScreenHeader title="บันทึกอาหาร" subtitle="เลือกมื้อ แล้วค้นหาอาหารที่ทาน" />

      <View style={styles.mealWrap}>
        <SegmentedControl options={MEAL_OPTIONS} value={meal} onChange={setMeal} label="มื้ออาหาร" />
      </View>

      {/* Search field */}
      <View style={[styles.searchWrap, focused && styles.searchWrapFocused]}>
        <Ionicons name="search" size={22} color={colors.primaryDark} />
        <TextInput
          ref={searchInput}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="ค้นหาอาหาร เช่น ข้าวกะเพรา"
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search"
          accessibilityLabel="ค้นหาอาหาร"
        />
        {query.length > 0 && (
          <IconButton
            icon="close"
            variant="ghost"
            color={colors.inkMuted}
            onPress={() => {
              setQuery('');
              searchInput.current?.focus?.();
            }}
            accessibilityLabel="ล้างคำค้น"
          />
        )}
        <IconButton
          icon="camera-outline"
          variant="soft"
          onPress={() => navigation.navigate('Scan', { meal })}
          accessibilityLabel="สแกนอาหารด้วย AI"
          accessibilityHint="ถ่ายหรือเลือกรูปอาหารแทนการพิมพ์ค้นหา"
        />
      </View>

      {!!savedNotice && (
        <Banner tone="success" message={savedNotice} onDismiss={() => setSavedNotice('')} style={styles.banner} />
      )}

      <View accessibilityLiveRegion="polite">{body}</View>

      {/* Add manually */}
      <Pressable
        onPress={() => (manualOpen ? setManualOpen(false) : openManual())}
        accessibilityRole="button"
        accessibilityLabel="ไม่พบเมนูที่ต้องการ? เพิ่มชื่ออาหารและโภชนาการเอง"
        accessibilityState={{ expanded: manualOpen }}
        style={({ pressed }) => [styles.manualToggle, pressed && styles.pressed]}
      >
        <Ionicons name="create-outline" size={24} color={colors.primary} />
        <View style={styles.manualTextCol}>
          <Text style={styles.manualTitle}>ไม่พบเมนูที่ต้องการ?</Text>
          <Text style={styles.manualSubtitle}>เพิ่มชื่ออาหารและพลังงานเอง</Text>
        </View>
        <Ionicons name={manualOpen ? 'chevron-down' : 'chevron-forward'} size={22} color={colors.primaryDark} />
      </Pressable>

      {manualOpen && (
        <Card style={styles.manualForm}>
          <Text style={styles.fieldLabel}>ชื่ออาหาร</Text>
          <TextInput
            style={styles.input}
            value={manualName}
            onChangeText={setManualName}
            placeholder="เช่น ข้าวกะเพราไก่"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="ชื่ออาหาร"
            returnKeyType="next"
          />
          <Text style={[styles.fieldLabel, styles.fieldGap]}>พลังงาน (kcal)</Text>
          <TextInput
            style={styles.input}
            value={manualKcal}
            onChangeText={setManualKcal}
            placeholder="เช่น 560"
            placeholderTextColor={colors.inkFaint}
            keyboardType="numeric"
            accessibilityLabel="พลังงาน กิโลแคลอรี"
            returnKeyType="done"
            onSubmitEditing={saveManual}
          />
          <Text style={styles.hint}>ไม่ทราบตัวเลขก็เว้นว่างได้ จะบันทึกเป็น 0 kcal และแก้ทีหลังได้</Text>

          {!!saveError && (
            <Banner tone="error" message={saveError} onDismiss={() => setSaveError('')} style={styles.banner} />
          )}

          <View style={styles.manualActions}>
            <PrimaryButton
              title="บันทึก"
              icon="checkmark"
              onPress={saveManual}
              loading={saving}
              disabled={!manualName.trim()}
              style={styles.flex}
            />
            <PrimaryButton
              title="ยกเลิก"
              variant="outline"
              onPress={() => setManualOpen(false)}
              disabled={saving}
              style={styles.flex}
            />
          </View>
        </Card>
      )}

      <Text style={styles.footnote}>
        แตะรายการเพื่อปรับปริมาณก่อนบันทึก{'\n'}ค่าประมาณอาจต่างกันตามสูตรและวัตถุดิบ
      </Text>
    </Screen>
  );
}
