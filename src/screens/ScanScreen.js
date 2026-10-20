import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator, Pressable, ScrollView, Switch } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import FoodScanReview from '../components/FoodScanReview';
import MealChips, { defaultMealForNow } from '../components/MealChips';
import Banner from '../components/Banner';
import ScreenHeader from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { searchNutritionFoods } from '../services/foodService';
import { analyzeFoodImage } from '../services/aiVisionService';
import styles from '../style/screens/ScanScreenStyles';

function FoodBoxOverlays({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return items.map((item, index) => {
    if (!Array.isArray(item.box_2d) || item.box_2d.length !== 4) return null;
    const [ymin, xmin, ymax, xmax] = item.box_2d.map((value) =>
      Math.max(0, Math.min(1000, Number(value)))
    );
    if (![ymin, xmin, ymax, xmax].every(Number.isFinite) || ymax <= ymin || xmax <= xmin) return null;

    return (
      <View
        key={`${item.name_th || 'food'}_${index}`}
        style={{
          position: 'absolute',
          top: `${ymin / 10}%`,
          left: `${xmin / 10}%`,
          width: `${(xmax - xmin) / 10}%`,
          height: `${(ymax - ymin) / 10}%`,
          borderWidth: 2,
          borderColor: colors.primary,
          pointerEvents: 'none', // แก้จาก prop pointerEvents บน View มาไว้ใน style
        }}
      >
        <Text style={{ alignSelf: 'flex-start', backgroundColor: colors.primary, color: '#fff', fontSize: 10 }}>
          {item.name_th}
        </Text>
      </View>
    );
  });
}

export default function ScanScreen({ navigation }) {
  const { addFoodLog, user } = useApp();
  const [imageUri, setImageUri] = useState(null);
  const [lastAsset, setLastAsset] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [notice, setNotice] = useState('');
  const [meal, setMeal] = useState(defaultMealForNow);
  const [saved, setSaved] = useState(false);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [searchingFoods, setSearchingFoods] = useState(false);
  const [foodSearchError, setFoodSearchError] = useState('');
  const [storeImageConsent, setStoreImageConsent] = useState(false);

  useEffect(() => {
    const query = foodQuery.trim();
    if (!query) {
      setFoodResults([]);
      setSearchingFoods(false);
      setFoodSearchError('');
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearchingFoods(true);
      setFoodSearchError('');
      try {
        const results = await searchNutritionFoods(query, 8);
        if (active) setFoodResults(results.slice(0, 8));
      } catch (error) {
        if (active) {
          setFoodResults([]);
          setFoodSearchError(error.message || 'ค้นหาฐานข้อมูลอาหารไม่สำเร็จ');
        }
      } finally {
        if (active) setSearchingFoods(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [foodQuery]);

  const runAiAnalysis = async (asset, storeImage) => {
    setAnalyzing(true);
    setResult(null);
    setSaved(false);
    setAnalysisError('');
    setNotice('');
    setLastAsset(asset);

    try {
      const aiResult = await analyzeFoodImage(
        asset.base64,
        asset.mimeType || 'image/jpeg',
        user?.id,
        storeImage
      );
      setResult({ ...aiResult, reviewKey: aiResult.scanId || `scan_${Date.now()}` });
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'วิเคราะห์ภาพไม่สำเร็จ กรุณาลองใหม่หรือค้นหาอาหารด้วยตนเอง');
    } finally {
      setAnalyzing(false);
    }
  };

  const pickFrom = async (source) => {
    setNotice('');
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setNotice(
        source === 'camera'
          ? 'ต้องอนุญาตให้ใช้กล้องก่อนจึงจะสแกนได้ หรือเลือกจากคลังภาพแทน'
          : 'ต้องอนุญาตให้เข้าถึงรูปภาพก่อนจึงจะเลือกจากคลังภาพได้'
      );
      return;
    }

    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const res = await picker({ quality: 0.7, base64: true, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
      runAiAnalysis(res.assets[0], storeImageConsent);
      setStoreImageConsent(false);
    }
  };

  const selectFoodFromDatabase = (food) => {
    setImageUri(null);
    setLastAsset(null);
    setFoodQuery(food.name);
    setFoodResults([]);
    setSaved(false);
    setAnalysisError('');
    setNotice('');
    setStoreImageConsent(false);
    setResult({
      reviewKey: `manual_${Date.now()}`,
      items: [{
        name_th: food.name,
        name_en: food.nameEn,
        foodId: food.foodId,
        per100g: food.per100g,
        estimated_grams: null,
        estimated_nutrition: null,
        confidence: 1,
      }],
      reference_object: '',
      source: 'database_search',
      scanId: null,
    });
  };

  const confirmAdd = async ({ items, totals }) => {
    await addFoodLog({
      name: items.map((item) => item.name).join(' + '),
      meal,
      kcal: totals.kcal,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      fiber: totals.fiber,
      sugar: totals.sugar,
      sodium: totals.sodium,
      calcium: totals.calcium,
      iron: totals.iron,
      vitaminC: totals.vitaminC,
      items,
      // What the AI said, kept for feedback; the database candidate lists aren't needed in the log.
      aiPredictions: result?.source === 'gemini_vision'
        ? result.items.map(({ candidates: _candidates, ...prediction }) => prediction)
        : undefined,
      feedbackCapturedAt: result?.source === 'gemini_vision' ? new Date().toISOString() : undefined,
      servings: 1,
      source: result?.source || 'ai_scan',
      scanId: result?.scanId || null,
    });
    setSaved(true);
  };

  const reset = () => {
    setImageUri(null);
    setLastAsset(null);
    setResult(null);
    setSaved(false);
    setAnalysisError('');
    setNotice('');
    setStoreImageConsent(false);
  };

  const isRealAi = result?.source === 'gemini_vision';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="สแกนอาหารด้วย AI"
          subtitle="ถ่ายรูปมื้ออาหาร แล้วให้ระบบช่วยประเมินแคลอรี่เบื้องต้นให้"
        />

        {!!notice && <Banner tone="warning" message={notice} onDismiss={() => setNotice('')} style={{ marginBottom: spacing.md }} />}

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
                  accessibilityLabel="ค้นหาอาหารในฐานข้อมูล"
                />
                {searchingFoods && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
              {Boolean(foodQuery.trim()) && !searchingFoods && foodResults.length === 0 && (
                <Text style={styles.noSearchResults}>
                  {foodSearchError || 'ไม่พบอาหารที่ค้นหา ลองใช้ชื่อเมนูอื่น'}
                </Text>
              )}
              {foodResults.length > 0 && (
                <View style={styles.searchResults}>
                  {foodResults.map((food) => (
                    <Pressable
                      key={food.id}
                      onPress={() => selectFoodFromDatabase(food)}
                      accessibilityRole="button"
                      accessibilityLabel={`เลือก ${food.name}`}
                      style={({ pressed }) => [styles.searchResultItem, pressed && { opacity: 0.7 }]}
                    >
                      <View style={styles.searchResultIcon}>
                        <Ionicons name="restaurant-outline" size={17} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchResultName} numberOfLines={1}>{food.name}</Text>
                        <Text style={styles.searchResultMeta}>
                          {food.serving ? `${food.serving} · ` : ''}
                          {food.estimated?.includes('kcal') ? '≈' : ''}{food.per100g?.kcal ?? '—'} kcal / 100 g
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.scanHero}>
              <View style={styles.scanHeroIcon}><Ionicons name="camera" size={34} color={colors.primary} /></View>
              <Text style={styles.scanHeroTitle}>สแกนอาหารด้วยกล้อง</Text>
              <Text style={styles.scanHeroText}>ถ่ายให้เห็นอาหารทั้งจานในที่ที่มีแสงพอ เพื่อให้ AI ประเมินได้แม่นขึ้น</Text>

              <View style={styles.stepsRow}>
                <View style={styles.stepItem}>
                  <View style={styles.stepIcon}><Ionicons name="camera-outline" size={15} color={colors.primary} /></View>
                  <Text style={styles.stepText}>จัดจานให้อยู่ในกรอบ อย่าให้มือบัง</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepIcon}><Ionicons name="sunny-outline" size={15} color={colors.primary} /></View>
                  <Text style={styles.stepText}>ถ่ายในที่แสงสว่าง เลี่ยงเงาที่บังอาหาร</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepIcon}><Ionicons name="create-outline" size={15} color={colors.primary} /></View>
                  <Text style={styles.stepText}>ตรวจสอบชื่อและปริมาณก่อนบันทึกทุกครั้ง</Text>
                </View>
              </View>

              <PrimaryButton
                title="เริ่มสแกนด้วยกล้อง"
                icon="camera"
                onPress={() => pickFrom('camera')}
                style={{ width: '100%', marginTop: spacing.md }}
              />
              <View style={styles.consentRow}>
                <Switch
                  value={storeImageConsent}
                  onValueChange={setStoreImageConsent}
                  accessibilityLabel="ยินยอมให้เก็บรูปสแกนเพื่อทบทวนผล"
                />
                <Text style={styles.consentText}>
                  เก็บรูปนี้ไว้ทบทวนผลภายหลัง (ไม่บังคับ)
                </Text>
              </View>
            </View>

            <Banner
              tone="info"
              icon="information-circle-outline"
              message="ค่าที่ได้จากการประเมินเป็นเพียงค่าประมาณ ไม่ใช่คำแนะนำทางการแพทย์หรือโภชนาการ"
              style={{ marginBottom: spacing.md }}
            />

            <Text style={styles.sectionTitle}>หรือเลือกรูปจากคลังภาพ</Text>
            <View style={styles.actionsRow}>
              <PrimaryButton title="เลือกจากคลังภาพ" variant="outline" icon="images-outline" onPress={() => pickFrom('library')} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {Boolean(imageUri) && (
          <Card style={styles.imageCard}>
            <View style={{ position: 'relative', width: '100%', aspectRatio: 1 }}>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="stretch" />
              <FoodBoxOverlays items={result?.items} />
            </View>
          </Card>
        )}

        {Boolean(analysisError) && !analyzing && (
          <View style={{ marginTop: spacing.md }}>
            <Banner tone="error" message={analysisError} />
            <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
              {lastAsset && (
                <PrimaryButton
                  title="ลองวิเคราะห์อีกครั้ง"
                  icon="refresh"
                  onPress={() => runAiAnalysis(lastAsset, storeImageConsent)}
                  style={[styles.actionGap, { flex: 1 }]}
                />
              )}
              <PrimaryButton title="สแกนใหม่" variant="outline" onPress={reset} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {analyzing && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.analyzingBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.analyzingText}>กำลังวิเคราะห์ภาพอาหาร...</Text>
              <Text style={styles.analyzingHint}>ขั้นตอนนี้อาจใช้เวลาประมาณ 5–15 วินาที กรุณารอสักครู่</Text>
            </View>
          </Card>
        )}

        {Boolean(result) && !analyzing && (
          <Card style={{ marginTop: spacing.md }}>
            {saved ? (
              <View style={styles.successState}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={38} color={colors.primary} />
                </View>
                <Text style={styles.successTitle}>บันทึกมื้อนี้แล้ว</Text>
                <Text style={styles.successText}>ดูรายการและยอดสารอาหารของวันนี้ได้ที่หน้าหลัก</Text>
                <View style={styles.successActions}>
                  <PrimaryButton title="สแกนมื้อถัดไป" onPress={reset} style={[styles.actionGap, { flex: 1 }]} />
                  <PrimaryButton title="กลับหน้าหลัก" variant="outline" onPress={() => navigation.navigate('Home')} style={{ flex: 1 }} />
                </View>
              </View>
            ) : (
              <>
                <View style={[styles.demoTag, isRealAi && { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.demoTagText, isRealAi && { color: colors.primaryDark }]}>
                    {isRealAi ? 'วิเคราะห์โดย Vision AI' : 'เลือกจากฐานข้อมูล'}
                  </Text>
                </View>
                {Boolean(imageUri) && (
                  <Text style={styles.resultConfidence}>
                    ผลการระบุชื่อและน้ำหนักเป็นค่าประมาณ โปรดยืนยันรายการและปริมาณก่อนบันทึก
                  </Text>
                )}
                <View style={styles.mealSection}>
                  <MealChips value={meal} onChange={setMeal} />
                </View>
                <FoodScanReview
                  key={result.reviewKey}
                  analysis={result}
                  onConfirm={confirmAdd}
                  onReset={reset}
                />
              </>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
