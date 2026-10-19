import React, { useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { searchNutritionFoods } from '../services/foodService';
import { useApp } from '../context/AppContext';
import FoodSearchRow from '../components/FoodSearchRow';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { defaultMealForNow } from '../components/MealChips';
import EmptyState from '../components/EmptyState';
import Banner from '../components/Banner';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedControl from '../components/SegmentedControl';
import styles from '../style/screens/LogScreenStyles';

const SEARCH_DEBOUNCE_MS = 200;
const SEARCH_LIMIT = 20;

// Short meal labels — same wording as the web prototype (meals.*Short).
const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'เช้า' },
  { value: 'lunch', label: 'กลางวัน' },
  { value: 'dinner', label: 'เย็น' },
  { value: 'snack', label: 'ว่าง' },
];

/**
 * Log search screen (mirrors the web LogSearchScreen): pick a meal, search the
 * real food service, jump to the portion screen with "+", or add a food manually.
 */
export default function LogScreen({ navigation }) {
  const { addFoodLog } = useApp();
  const [meal, setMeal] = useState(defaultMealForNow);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Debounced search of the server's food database (with stale-response guard).
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      setSearchError('');
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError('');
    const timer = setTimeout(async () => {
      try {
        const data = await searchNutritionFoods(trimmed, SEARCH_LIMIT);
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) {
          setResults([]);
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
  }, [query]);

  const goToPortion = (food) => {
    navigation.navigate('Portion', {
      food,
      foodId: String(food.foodId || food.id),
      meal,
    });
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
    } catch (error) {
      // Keep the form open (with the typed values) so the user can retry.
      setSaveError(error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="บันทึกอาหาร" subtitle="เลือกมื้อ แล้วค้นหาอาหารที่ทาน" />

        {/* Meal */}
        <View style={styles.mealWrap}>
          <SegmentedControl options={MEAL_OPTIONS} value={meal} onChange={setMeal} label="มื้ออาหาร" />
        </View>

        {/* Search field */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={colors.inkMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="ค้นหาอาหาร เช่น ข้าวกะเพราไก่"
            placeholderTextColor={colors.inkFaint}
            returnKeyType="search"
            autoFocus
            accessibilityLabel="ค้นหาอาหาร"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="ล้างคำค้น"
              style={({ pressed }) => [styles.clearBtn, pressed && styles.clearBtnPressed]}
            >
              <Ionicons name="close" size={20} color={colors.inkMuted} />
            </Pressable>
          )}
        </View>

        {/* Results */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>อาหารที่พบ</Text>
          {!!query.trim() && !searching && !searchError && (
            <Text style={styles.resultsCount}>{results.length} รายการ</Text>
          )}
        </View>

        {!query.trim() ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="search-outline"
              title="พิมพ์ชื่ออาหารเพื่อค้นหา"
              message="ค้นได้ทั้งชื่อไทยและอังกฤษ จากฐานข้อมูลอาหารไทยกว่า 1,000 รายการ"
            />
          </Card>
        ) : searching ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>กำลังค้นหา…</Text>
          </View>
        ) : searchError ? (
          <Banner tone="error" message={searchError} />
        ) : results.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="restaurant-outline"
              title={`ไม่พบเมนูที่ตรงกับ “${query}”`}
              message="ลองพิมพ์คำอื่นสั้นลง หรือเพิ่มชื่ออาหารและโภชนาการเองได้เลย"
            />
          </Card>
        ) : (
          <View>
            {results.map((food) => (
              <FoodSearchRow
                key={String(food.id)}
                name={food.name}
                subtitle={[food.nameEn, 'ต่อ 100 กรัม'].filter(Boolean).join(' · ')}
                kcal={food.per100g?.kcal}
                onPress={() => goToPortion(food)}
              />
            ))}
          </View>
        )}

        {/* Add manually */}
        <View style={styles.manualSection}>
          <Pressable
            onPress={() => setManualOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="ไม่พบเมนูที่ต้องการ? เพิ่มชื่ออาหารและโภชนาการเอง"
            accessibilityState={{ expanded: manualOpen }}
            style={({ pressed }) => [styles.manualToggle, pressed && styles.manualTogglePressed]}
          >
            <View style={styles.manualTile}>
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </View>
            <View style={styles.manualTextCol}>
              <Text style={styles.manualTitle}>ไม่พบเมนูที่ต้องการ?</Text>
              <Text style={styles.manualSubtitle}>เพิ่มชื่ออาหารและโภชนาการเอง</Text>
            </View>
            <View style={[styles.chevron, manualOpen && styles.chevronOpen]}>
              <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
            </View>
          </Pressable>

          {manualOpen && (
            <Card style={styles.manualForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>ชื่ออาหาร</Text>
                <TextInput
                  style={styles.manualInput}
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="เช่น ข้าวกะเพราไก่"
                  placeholderTextColor={colors.inkFaint}
                  accessibilityLabel="ชื่ออาหาร"
                  returnKeyType="done"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>พลังงาน (kcal)</Text>
                <TextInput
                  style={styles.manualInput}
                  value={manualKcal}
                  onChangeText={setManualKcal}
                  placeholder="เช่น 560"
                  placeholderTextColor={colors.inkFaint}
                  keyboardType="numeric"
                  accessibilityLabel="พลังงาน (kcal)"
                  returnKeyType="done"
                />
              </View>

              {!!saveError && <Banner tone="error" message={saveError} onDismiss={() => setSaveError('')} />}

              <View style={styles.manualActions}>
                <PrimaryButton
                  title="บันทึก"
                  icon="checkmark"
                  onPress={saveManual}
                  loading={saving}
                  disabled={!manualName.trim()}
                  style={[styles.actionGap, { flex: 1 }]}
                />
                <PrimaryButton
                  title="ยกเลิก"
                  variant="outline"
                  onPress={() => setManualOpen(false)}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}
        </View>

        {/* Gentle info notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={20} color={colors.primaryDark} style={styles.noticeIcon} />
          <View style={styles.noticeTextCol}>
            <Text style={styles.noticeText}>เลือก + เพื่อปรับปริมาณก่อนบันทึก</Text>
            <Text style={styles.noticeSub}>ข้อมูลโภชนาการอาจต่างกันตามสูตรและวัตถุดิบ</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
