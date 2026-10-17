import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { searchFood } from '../services/foodService';
import { useApp } from '../context/AppContext';
import FoodItemRow from '../components/FoodItemRow';
import PrimaryButton from '../components/PrimaryButton';
import MealChips, { defaultMealForNow } from '../components/MealChips';
import EmptyState from '../components/EmptyState';
import Banner from '../components/Banner';
import ScreenHeader from '../components/ScreenHeader';
import styles from '../style/screens/LogScreenStyles';

const STEP = 0.5;

export default function LogScreen({ navigation }) {
  const { addFoodLog } = useApp();
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [servings, setServings] = useState('1');
  const [meal, setMeal] = useState(defaultMealForNow);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(true);

  const serversMultiplier = Number(servings);
  const servingsValid = Number.isFinite(serversMultiplier) && serversMultiplier > 0;

  useEffect(() => {
    let cancelled = false;
    setSearching(true);
    setSearchError('');
    (async () => {
      try {
        const data = await searchFood(query);
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) {
          setResults([]);
          setSearchError(error?.message || 'ค้นหาอาหารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [query]);

  const openFood = (food) => {
    setSelectedFood(food);
    setServings('1');
    setSaved(false);
    setSaving(false);
  };

  const closeModal = () => {
    setSelectedFood(null);
    setSaved(false);
    setSaving(false);
  };

  const adjustServings = (delta) => {
    const base = Number.isFinite(serversMultiplier) ? serversMultiplier : 1;
    const next = Math.max(0.5, Math.round((base + delta) * 100) / 100);
    setServings(String(next));
  };

  const confirmAdd = async () => {
    if (!servingsValid) return;
    setSaving(true);
    try {
      await addFoodLog({
        name: selectedFood.name,
        meal,
        kcal: selectedFood.kcal * serversMultiplier,
        protein: selectedFood.protein * serversMultiplier,
        carbs: selectedFood.carbs * serversMultiplier,
        fat: selectedFood.fat * serversMultiplier,
        servings: serversMultiplier,
        source: 'database_search',
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const preview = selectedFood && servingsValid
    ? {
      kcal: Math.round(selectedFood.kcal * serversMultiplier),
      protein: Math.round(selectedFood.protein * serversMultiplier),
      carbs: Math.round(selectedFood.carbs * serversMultiplier),
      fat: Math.round(selectedFood.fat * serversMultiplier),
    }
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <ScreenHeader
          title="บันทึกอาหาร"
          subtitle="ค้นหาเมนู เลือกมื้อ และปรับปริมาณได้ตามจริง"
        />
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.inkMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder="ค้นหาเมนู เช่น กะเพรา, ไก่ย่าง, ข้าวกล้อง"
            placeholderTextColor={colors.inkFaint}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            accessibilityLabel="ค้นหาอาหาร"
          />
          {searching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="ล้างคำค้นหา"
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={20} color={colors.inkFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <FoodItemRow
            name={item.name}
            subtitle={[item.nameEn, item.serving].filter(Boolean).join(' · ')}
            kcal={item.kcal}
            onPress={() => openFood(item)}
          />
        )}
        ListHeaderComponent={
          results.length > 0 ? (
            <Text style={styles.resultHint}>พบ {results.length} เมนู — แตะเพื่อระบุปริมาณ</Text>
          ) : null
        }
        ListEmptyComponent={
          searching ? null : searchError ? (
            <Banner tone="error" message={searchError} />
          ) : query.trim() ? (
            <EmptyState
              icon="search-outline"
              title="ไม่พบเมนูที่ค้นหา"
              message="ลองใช้คำสั้นลง เช่น ชื่ออาหารหลัก หรือสะกดแบบอื่น"
              actionTitle="ล้างคำค้นหา"
              onAction={() => setQuery('')}
            />
          ) : (
            <EmptyState
              icon="book-outline"
              title="เริ่มค้นหาเมนูอาหาร"
              message="พิมพ์ชื่อเมนูไทยที่ต้องการ แล้วแตะรายการเพื่อระบุปริมาณและมื้ออาหาร"
            />
          )
        }
      />

      <Modal visible={!!selectedFood} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View style={styles.modalSheet}>
              <View style={styles.sheetHandle} />
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {selectedFood && saved && (
                  <View style={styles.successWrap}>
                    <View style={styles.successIcon}>
                      <Ionicons name="checkmark" size={38} color={colors.primary} />
                    </View>
                    <Text style={styles.successTitle}>บันทึกแล้ว</Text>
                    <Text style={styles.successText}>
                      {selectedFood.name} · {preview ? preview.kcal : 0} kcal ถูกเพิ่มในมื้อที่เลือกแล้ว
                    </Text>
                    <View style={styles.successActions}>
                      <PrimaryButton
                        title="บันทึกเมนูอื่น"
                        onPress={() => {
                          closeModal();
                          setQuery('');
                        }}
                        style={[styles.actionGap, { flex: 1 }]}
                      />
                      <PrimaryButton
                        title="กลับหน้าหลัก"
                        variant="outline"
                        onPress={() => {
                          closeModal();
                          navigation?.navigate('Home');
                        }}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}

                {selectedFood && !saved && (
                  <>
                    <View style={styles.sheetHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sheetTitle}>{selectedFood.name}</Text>
                        <Text style={styles.sheetSubtitle}>
                          {[selectedFood.nameEn, `1 หน่วย = ${selectedFood.serving}`].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <Pressable
                        onPress={closeModal}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="ปิดหน้าต่างบันทึกอาหาร"
                        style={styles.closeBtn}
                      >
                        <Ionicons name="close" size={20} color={colors.ink} />
                      </Pressable>
                    </View>

                    <Text style={styles.fieldLabel}>จำนวนหน่วยบริโภค</Text>
                    <View style={styles.stepperRow}>
                      <Pressable
                        onPress={() => adjustServings(-STEP)}
                        accessibilityRole="button"
                        accessibilityLabel="ลดปริมาณลงครึ่งหน่วย"
                        style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
                      >
                        <Ionicons name="remove" size={20} color={colors.ink} />
                      </Pressable>
                      <TextInput
                        style={[styles.stepInput, !servingsValid && styles.stepInputInvalid]}
                        keyboardType="decimal-pad"
                        value={servings}
                        onChangeText={setServings}
                        accessibilityLabel="จำนวนหน่วยบริโภค"
                      />
                      <Pressable
                        onPress={() => adjustServings(STEP)}
                        accessibilityRole="button"
                        accessibilityLabel="เพิ่มปริมาณขึ้นครึ่งหน่วย"
                        style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
                      >
                        <Ionicons name="add" size={20} color={colors.ink} />
                      </Pressable>
                    </View>
                    <Text style={[styles.hint, !servingsValid && styles.hintError]}>
                      {servingsValid
                        ? 'ปรับได้ทีละ 0.5 หน่วย หรือพิมพ์ตัวเลขเอง'
                        : 'กรุณากรอกจำนวนมากกว่า 0'}
                    </Text>

                    <MealChips value={meal} onChange={setMeal} />

                    <View style={[styles.summaryBox, { marginTop: 16 }]}>
                      <Text style={styles.summaryLabel}>แคลอรี่และสารอาหารที่จะบันทึก</Text>
                      <Text style={styles.summaryKcal}>{preview ? preview.kcal : 0} kcal</Text>
                      <View style={styles.summaryMacroRow}>
                        <View style={styles.macroItem}>
                          <View style={[styles.macroDot, { backgroundColor: colors.protein }]} />
                          <Text style={styles.macroText}>โปรตีน {preview ? preview.protein : 0} g</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <View style={[styles.macroDot, { backgroundColor: colors.carbs }]} />
                          <Text style={styles.macroText}>คาร์บ {preview ? preview.carbs : 0} g</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <View style={[styles.macroDot, { backgroundColor: colors.fat }]} />
                          <Text style={styles.macroText}>ไขมัน {preview ? preview.fat : 0} g</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalActions}>
                      <PrimaryButton
                        title="ยกเลิก"
                        variant="outline"
                        onPress={closeModal}
                        style={[styles.actionGap, { flex: 1 }]}
                      />
                      <PrimaryButton
                        title="บันทึก"
                        icon="checkmark"
                        onPress={confirmAdd}
                        loading={saving}
                        disabled={!servingsValid}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
