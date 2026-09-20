import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, radius } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { getAllFoods, searchFood } from '../services/foodService';
import { analyzeFoodImage } from '../services/aiVisionService';
import { calculateSingleFoodMacros } from '../services/nutritionService';
import styles from '../style/screens/ScanScreenStyles';

const MEALS = [
  { key: 'breakfast', label: 'มื้อเช้า' },
  { key: 'lunch', label: 'มื้อเที่ยง' },
  { key: 'dinner', label: 'มื้อเย็น' },
  { key: 'snack', label: 'ของว่าง' },
];

const DEFAULT_DB_GRAMS = '100';
const FOOD_CATEGORIES = [
  ['ข้าว / แป้ง', 'restaurant-outline'],
  ['เนื้อสัตว์', 'fish-outline'],
  ['ผัก / ผลไม้', 'leaf-outline'],
  ['นม / ไข่', 'egg-outline'],
  ['เครื่องดื่ม', 'cafe-outline'],
  ['อื่น ๆ', 'grid-outline'],
];

export default function ScanScreen({ navigation }) {
  const { addFoodLog, user } = useApp();
  const [foodData, setFoodData] = useState([]);
  const [imageUri, setImageUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [meal, setMeal] = useState('lunch');
  const [saved, setSaved] = useState(false);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [searchingFoods, setSearchingFoods] = useState(false);

  // --- dbMatch confirmation state ---
  const [dbGrams, setDbGrams] = useState(DEFAULT_DB_GRAMS);
  const [applyingDbMatch, setApplyingDbMatch] = useState(false);
  const [dbMatchApplied, setDbMatchApplied] = useState(false);
  const [dbMatchError, setDbMatchError] = useState('');

  useEffect(() => {
    (async () => {
      const data = await getAllFoods();
      setFoodData(data);
    })();
  }, []);

  useEffect(() => {
    const query = foodQuery.trim();
    if (!query) {
      setFoodResults([]);
      setSearchingFoods(false);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearchingFoods(true);
      try {
        const results = await searchFood(query);
        if (active) setFoodResults(results.slice(0, 8));
      } catch (error) {
        console.warn('Food search error:', error);
        if (active) setFoodResults([]);
      } finally {
        if (active) setSearchingFoods(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [foodQuery]);

  const runAiAnalysis = async (asset) => {
    setAnalyzing(true);
    setResult(null);
    setSaved(false);
    setDbMatchApplied(false);
    setDbMatchError('');
    setDbGrams(DEFAULT_DB_GRAMS);

    try {
      const aiResult = await analyzeFoodImage(asset.base64, asset.mimeType || 'image/jpeg', user?.id);
      setResult(aiResult);
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback if exception occurs
      const sample = foodData[Math.floor(Math.random() * foodData.length)];
      setResult({
        name: sample?.name || 'ผัดไทยกุ้งสด',
        kcal: sample?.kcal || 540,
        protein: sample?.protein || 22,
        carbs: sample?.carbs || 65,
        fat: sample?.fat || 20,
        fiber: sample?.fiber || 0,
        sugar: sample?.sugar || 0,
        sodium: sample?.sodium || 0,
        calcium: sample?.calcium || 0,
        iron: sample?.iron || 0,
        vitaminC: sample?.vitaminC || 0,
        foodGroups: [],
        confidence: 0.85,
        source: 'mock_fallback',
        dbMatch: null,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const pickFrom = async (source) => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const res = await picker({ quality: 0.7, base64: true, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
      runAiAnalysis(res.assets[0]);
    }
  };

  const updateResultField = (key, value) => setResult((r) => ({ ...r, [key]: value }));

  const selectFoodFromDatabase = (food) => {
    setImageUri(null);
    setFoodQuery(food.name);
    setFoodResults([]);
    setSaved(false);
    setDbMatchApplied(true);
    setDbMatchError('');
    setResult({
      name: food.name,
      kcal: food.kcal,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber || 0,
      sugar: food.sugar || 0,
      sodium: food.sodium || 0,
      calcium: food.calcium || 0,
      iron: food.iron || 0,
      vitaminC: food.vitaminC || 0,
      foodGroups: [],
      confidence: 1,
      source: 'database_search',
      dbMatch: null,
    });
  };

  // Pulls real per-100g nutrition for the matched database food, scaled by
  // the grams the user enters, and overwrites the editable macro fields.
  const applyDbMatch = async () => {
    if (!result?.dbMatch?.foodId) return;
    const grams = Number(dbGrams);
    if (!grams || grams <= 0) {
      setDbMatchError('กรุณาใส่น้ำหนักเป็นตัวเลขมากกว่า 0');
      return;
    }

    setApplyingDbMatch(true);
    setDbMatchError('');
    try {
      const macros = await calculateSingleFoodMacros(result.dbMatch.foodId, grams);
      setResult((r) => ({
        ...r,
        kcal: macros.kcal,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        fiber: macros.fiber,
        sugar: macros.sugar,
        sodium: macros.sodium,
        calcium: macros.calcium,
        iron: macros.iron,
        vitaminC: macros.vitaminC,
        source: 'gemini_vision_db_matched',
      }));
      setDbMatchApplied(true);
    } catch (err) {
      setDbMatchError(err.message || 'คำนวณไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setApplyingDbMatch(false);
    }
  };

  const confirmAdd = async () => {
    await addFoodLog({
      name: result.name,
      meal,
      kcal: Number(result.kcal) || 0,
      protein: Number(result.protein) || 0,
      carbs: Number(result.carbs) || 0,
      fat: Number(result.fat) || 0,
      fiber: Number(result.fiber) || 0,
      sugar: Number(result.sugar) || 0,
      sodium: Number(result.sodium) || 0,
      calcium: Number(result.calcium) || 0,
      iron: Number(result.iron) || 0,
      vitaminC: Number(result.vitaminC) || 0,
      foodGroups: result.foodGroups || [],
      servings: 1,
      source: result?.source || 'ai_scan',
      scanId: result?.scanId || null,
    });
    setSaved(true);
  };

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setSaved(false);
    setDbMatchApplied(false);
    setDbMatchError('');
    setDbGrams(DEFAULT_DB_GRAMS);
  };

  const isRealAi = result?.source?.includes('gemini_vision');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>สแกนอาหารด้วย AI</Text>
        <Text style={styles.subtitle}>ถ่ายรูปมื้ออาหาร แล้วให้ระบบช่วยประเมินแคลอรี่เบื้องต้น</Text>

        {!imageUri && (
          <View>
            <View style={styles.databaseSearchCard}>
              <View style={styles.databaseSearchHeader}>
                <View style={styles.databaseSearchIcon}>
                  <Ionicons name="search" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.databaseSearchTitle}>ค้นหาอาหารในฐานข้อมูล</Text>
                  <Text style={styles.databaseSearchSubtitle}>เลือกเมนูเพื่อบันทึกโดยไม่ต้องถ่ายรูป</Text>
                </View>
              </View>
              <View style={styles.databaseSearchInputWrap}>
                <Ionicons name="search-outline" size={18} color={colors.inkFaint} />
                <TextInput
                  value={foodQuery}
                  onChangeText={setFoodQuery}
                  placeholder="เช่น ข้าวกะเพรา, ผัดไทย"
                  placeholderTextColor={colors.inkFaint}
                  style={styles.databaseSearchInput}
                  returnKeyType="search"
                />
                {searchingFoods && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
              {foodQuery.trim() && !searchingFoods && foodResults.length === 0 && (
                <Text style={styles.noSearchResults}>ไม่พบอาหารที่ค้นหา ลองใช้ชื่อเมนูอื่น</Text>
              )}
              {foodResults.length > 0 && (
                <View style={styles.searchResults}>
                  {foodResults.map((food) => (
                    <Pressable
                      key={food.id}
                      onPress={() => selectFoodFromDatabase(food)}
                      style={({ pressed }) => [styles.searchResultItem, pressed && { opacity: 0.7 }]}
                    >
                      <View style={styles.searchResultIcon}>
                        <Ionicons name="restaurant-outline" size={17} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchResultName} numberOfLines={1}>{food.name}</Text>
                        <Text style={styles.searchResultMeta}>{food.serving} · {Math.round(food.kcal)} kcal</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.scanHero}>
              <View style={styles.scanHeroIcon}><Ionicons name="camera" size={34} color={colors.primary} /></View>
              <Text style={{ color: colors.ink, fontWeight: '800', fontSize: 18 }}>สแกนอาหาร</Text>
              <Text style={{ color: colors.inkMuted, textAlign: 'center', marginTop: 4 }}>ใช้กล้องถ่ายรูปเพื่อวิเคราะห์แคลอรี่ด้วย AI</Text>
              <PrimaryButton title="เริ่มสแกน" onPress={() => pickFrom('camera')} style={{ width: '100%', marginTop: spacing.md }} />
            </View>
            <Text style={styles.sectionTitle}>หรือเลือกจากหมวดหมู่</Text>
            <View style={styles.categoryGrid}>
              {FOOD_CATEGORIES.map(([label, icon]) => (
                <Pressable key={label} style={styles.categoryItem} onPress={() => pickFrom('library')}>
                  <Ionicons name={icon} size={22} color={colors.primary} />
                  <Text style={{ color: colors.inkMuted, fontSize: 11, marginTop: 4 }}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.actionsRow}>
              <PrimaryButton title="เลือกจากคลังภาพ" variant="outline" onPress={() => pickFrom('library')} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {imageUri && (
          <Card style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </Card>
        )}

        {analyzing && (
          <View style={styles.analyzingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.analyzingText}>AI กำลังวิเคราะห์ภาพอาหาร...</Text>
          </View>
        )}

        {result && !analyzing && (
          <Card style={{ marginTop: spacing.md }}>
            {saved && (
              <View style={styles.successState}>
                <View style={styles.successIcon}>
                  <Ionicons name="heart" size={34} color={colors.primary} />
                </View>
                <Text style={styles.successTitle}>บันทึกมื้อนี้แล้ว</Text>
                <Text style={styles.successText}>ทุกมื้อที่ดี คืออีกก้าวเล็ก ๆ สู่สุขภาพที่ดีในอนาคต</Text>
                <View style={styles.successActions}>
                  <PrimaryButton title="สแกนมื้อถัดไป" onPress={reset} style={{ flex: 1, marginRight: spacing.sm }} />
                  <PrimaryButton title="กลับหน้าหลัก" variant="outline" onPress={() => navigation.navigate('Home')} style={{ flex: 1 }} />
                </View>
              </View>
            )}

            {!saved && <>
            <View style={[styles.demoTag, isRealAi && { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.demoTagText, isRealAi && { color: '#2E7D32' }]}>
                {isRealAi ? '✨ วิเคราะห์โดย Vision AI' : '⚠️ ผลลัพธ์จำลอง (Demo Mode)'}
              </Text>
            </View>
            <Text style={styles.resultConfidence}>
              ความมั่นใจของโมเดล ~{Math.round((result.confidence || 0.85) * 100)}% — กรุณาตรวจสอบและแก้ไขก่อนบันทึก
            </Text>

            <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm }}>
              <Text style={{ fontWeight: '700', color: colors.ink, marginBottom: 6 }}>สารอาหารและหมู่อาหารที่ตรวจพบ</Text>
              <Text style={{ color: colors.inkMuted, marginBottom: 8 }}>
                {(result.foodGroups || []).length > 0 ? result.foodGroups.join(' · ') : 'ยังระบุหมู่อาหารจากภาพไม่ได้'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  ['ใยอาหาร', result.fiber, 'g'],
                  ['น้ำตาล', result.sugar, 'g'],
                  ['โซเดียม', result.sodium, 'mg'],
                  ['แคลเซียม', result.calcium, 'mg'],
                  ['ธาตุเหล็ก', result.iron, 'mg'],
                  ['วิตามิน C', result.vitaminC, 'mg'],
                ].map(([label, value, unit]) => (
                  <View key={label} style={{ width: '30%' }}>
                    <Text style={{ color: colors.inkMuted, fontSize: 12 }}>{label}</Text>
                    <Text style={{ color: colors.ink, fontWeight: '700' }}>{Number(value || 0).toFixed(1)} {unit}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* --- Database match confirmation card --- */}
            {result.dbMatch && (
              <View
                style={{
                  backgroundColor: dbMatchApplied ? colors.primarySoft : colors.turmericSoft,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  marginTop: spacing.sm,
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ fontWeight: '600', color: colors.ink, marginBottom: 4 }}>
                  {dbMatchApplied ? '✓ ใช้ค่าจากฐานข้อมูลแล้ว' : '📚 พบข้อมูลจริงในฐานข้อมูล'}
                </Text>
                <Text style={{ color: colors.inkMuted, marginBottom: spacing.sm }}>
                  {result.dbMatch.nameTh} — ค่าต่อ 100 กรัม: {result.dbMatch.per100g?.kcal ?? '-'} kcal,{' '}
                  โปรตีน {result.dbMatch.per100g?.protein_g ?? '-'} g
                </Text>

                <Text style={styles.fieldLabel}>น้ำหนักที่กินจริง (กรัม)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: spacing.sm }]}
                    keyboardType="number-pad"
                    value={dbGrams}
                    onChangeText={(v) => {
                      setDbGrams(v);
                      setDbMatchApplied(false);
                    }}
                    placeholder="เช่น 150"
                  />
                  <Pressable
                    onPress={applyDbMatch}
                    disabled={applyingDbMatch}
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.sm,
                      opacity: applyingDbMatch ? 0.6 : 1,
                    }}
                  >
                    {applyingDbMatch ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '600' }}>ใช้ค่านี้</Text>
                    )}
                  </Pressable>
                </View>

                {!!dbMatchError && (
                  <Text style={{ color: colors.chili, marginTop: 6 }}>{dbMatchError}</Text>
                )}
              </View>
            )}

            <Text style={styles.fieldLabel}>ชื่อเมนู</Text>
            <TextInput style={styles.input} value={result.name} onChangeText={(v) => updateResultField('name', v)} />

            <View style={styles.macroInputRow}>
              <View style={styles.macroInputCol}>
                <Text style={styles.fieldLabel}>kcal</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(result.kcal)}
                  onChangeText={(v) => updateResultField('kcal', v)}
                />
              </View>
              <View style={styles.macroInputCol}>
                <Text style={styles.fieldLabel}>โปรตีน (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(result.protein)}
                  onChangeText={(v) => updateResultField('protein', v)}
                />
              </View>
            </View>
            <View style={styles.macroInputRow}>
              <View style={styles.macroInputCol}>
                <Text style={styles.fieldLabel}>คาร์บ (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(result.carbs)}
                  onChangeText={(v) => updateResultField('carbs', v)}
                />
              </View>
              <View style={styles.macroInputCol}>
                <Text style={styles.fieldLabel}>ไขมัน (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(result.fat)}
                  onChangeText={(v) => updateResultField('fat', v)}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>มื้ออาหาร</Text>
            <View style={styles.mealRow}>
              {MEALS.map((m) => (
                <Pressable key={m.key} onPress={() => setMeal(m.key)} style={[styles.mealChip, meal === m.key && styles.mealChipActive]}>
                  <Text style={[styles.mealChipText, meal === m.key && styles.mealChipTextActive]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.actionsRow}>
              <PrimaryButton title="สแกนใหม่" variant="outline" onPress={reset} style={{ flex: 1, marginRight: spacing.sm }} />
              <PrimaryButton title={saved ? 'บันทึกแล้ว ✓' : 'บันทึกลงไดอารี่'} onPress={confirmAdd} style={{ flex: 1 }} />
            </View>
            </>}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}