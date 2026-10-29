import React, { useRef, useState } from 'react';
import { View, Image, ActivityIndicator, Pressable, Switch } from 'react-native';
import { Text } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import Screen from '../components/Screen';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import FoodScanReview from '../components/FoodScanReview';
import { MEAL_LABEL, MEAL_OPTIONS, defaultMealForNow } from '../components/MealChips';
import Banner from '../components/Banner';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedControl from '../components/SegmentedControl';
import { useApp } from '../context/AppContext';
import { isOfflineError } from '../services/atlasService';
import { analyzeFoodImage, prepareScanImage } from '../services/aiVisionService';
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
        style={[
          styles.box,
          {
            top: `${ymin / 10}%`,
            left: `${xmin / 10}%`,
            width: `${(xmax - xmin) / 10}%`,
            height: `${(ymax - ymin) / 10}%`,
          },
        ]}
      >
        {/* Same number as the item's card in the review below. */}
        <Text style={styles.boxLabel} accessibilityLabel={`รายการที่ ${index + 1} ${item.name_th || ''}`}>
          {index + 1}
        </Text>
      </View>
    );
  });
}

/**
 * AI scan flow, one step at a time:
 *   capture → analyzing (cancellable) → review → saved
 *   and recovery when the analysis fails (retry, other photo, or log manually).
 * Nothing is logged until the user confirms on the review step.
 */
export default function ScanScreen({ navigation, route }) {
  const { addFoodLog, user } = useApp();
  const [imageUri, setImageUri] = useState(null);
  const [lastAsset, setLastAsset] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisOffline, setAnalysisOffline] = useState(null);
  const [notice, setNotice] = useState('');
  const [meal, setMeal] = useState(() => route?.params?.meal || defaultMealForNow());
  const [saved, setSaved] = useState(null);
  const [storeImageConsent, setStoreImageConsent] = useState(false);
  // Each analysis gets an id; cancelling bumps it so a late answer is ignored.
  const runId = useRef(0);

  const step = saved
    ? 'saved'
    : analyzing
      ? 'analyzing'
      : analysisError
        ? 'recovery'
        : result
          ? 'review'
          : 'capture';

  const runAiAnalysis = async (asset, storeImage) => {
    const id = ++runId.current;
    setAnalyzing(true);
    setResult(null);
    setSaved(null);
    setAnalysisError('');
    setAnalysisOffline(null);
    setNotice('');
    setLastAsset(asset);

    try {
      const upload = await prepareScanImage(asset);
      const aiResult = await analyzeFoodImage(upload.base64, upload.mimeType, user?.id, storeImage);
      if (id !== runId.current) return;
      setResult({ ...aiResult, reviewKey: aiResult.scanId || `scan_${Date.now()}` });
    } catch (err) {
      if (id !== runId.current) return;
      console.error('Analysis error:', err);
      if (isOfflineError(err)) setAnalysisOffline({ timedOut: !!err.timedOut });
      setAnalysisError(err.message || 'วิเคราะห์ภาพไม่สำเร็จ กรุณาลองใหม่หรือค้นหาอาหารด้วยตนเอง');
    } finally {
      if (id === runId.current) setAnalyzing(false);
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
          ? 'ต้องอนุญาตให้ใช้กล้องก่อนจึงจะถ่ายได้ หรือเลือกรูปจากคลังภาพแทน'
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
    setSaved({ name: items.map((item) => item.name).join(' + '), kcal: totals.kcal });
  };

  const reset = () => {
    runId.current += 1;
    setAnalyzing(false);
    setImageUri(null);
    setLastAsset(null);
    setResult(null);
    setSaved(null);
    setAnalysisError('');
    setAnalysisOffline(null);
    setNotice('');
    setStoreImageConsent(false);
  };

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Tabs', { screen: 'Home' }));
  const logManually = () => navigation.navigate('Tabs', { screen: 'Log', params: { meal, requestedAt: Date.now() } });
  const mealLabel = MEAL_LABEL[meal] || 'มื้ออาหาร';

  const photo = imageUri ? (
    <View style={styles.photoWrap}>
      <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="stretch" accessibilityLabel="รูปอาหารที่เลือก" />
      <FoodBoxOverlays items={result?.items} />
    </View>
  ) : null;

  /* ------------------------------- analyzing ------------------------------ */
  if (step === 'analyzing') {
    return (
      <Screen variant="flow">
        <ScreenHeader title="กำลังประเมินอาหาร" subtitle="ใช้เวลาประมาณ 5–15 วินาที" onBack={reset} backHint="ยกเลิกการประเมิน" />
        {photo}
        <Text style={styles.photoCaption}>รูปที่เลือก · {mealLabel}</Text>
        <Card style={styles.block}>
          <View style={styles.analyzingBox} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.analyzingTitle}>กำลังดูว่าในจานมีอะไรบ้าง</Text>
            <Text style={styles.analyzingText}>
              เมื่อได้ผลประเมินแล้ว{'\n'}คุณจะได้ตรวจชื่ออาหารและปริมาณ{'\n'}ก่อนเพิ่มลงในบันทึกเสมอ
            </Text>
          </View>
        </Card>
        <Banner
          tone="info"
          icon="information-circle-outline"
          message="ผลอาจคลาดเคลื่อนตามสูตร วัตถุดิบ และสิ่งที่มองไม่เห็นในภาพ"
          style={styles.block}
        />
        <PrimaryButton title="ยกเลิกและกลับไปเลือกรูป" variant="soft" onPress={reset} />
      </Screen>
    );
  }

  /* -------------------------------- recovery ------------------------------ */
  if (step === 'recovery') {
    const reason = analysisOffline
      ? analysisOffline.timedOut
        ? 'ส่งรูปไปประเมินไม่ทันเวลา การเชื่อมต่ออาจช้า'
        : 'ส่งรูปไปประเมินไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง'
      : analysisError;
    return (
      <Screen variant="flow">
        <ScreenHeader title="ลองอีกวิธีได้เลย" subtitle="สแกนอาหารด้วย AI" onBack={reset} backHint="กลับไปเลือกรูป" />
        <EmptyState
          size="lg"
          icon={analysisOffline ? 'cloud-offline-outline' : 'image-outline'}
          title={analysisOffline ? 'ยังเชื่อมต่อเพื่อประเมินไม่ได้' : 'ครั้งนี้ยังประเมิน\nอาหารจากภาพไม่ได้'}
          message={`${reason}\nไม่เป็นไรนะ เลือกวิธีที่สะดวกได้เลย ยังไม่มีรายการใดถูกบันทึก`}
        />
        <View style={styles.actions}>
          {lastAsset && (
            <PrimaryButton
              title="ลองประเมินภาพเดิมอีกครั้ง"
              icon="refresh"
              onPress={() => runAiAnalysis(lastAsset, false)}
            />
          )}
          <PrimaryButton title="เลือกรูปอื่น" icon="images-outline" variant="soft" onPress={() => pickFrom('library')} />
          <PrimaryButton title="ค้นหาและบันทึกอาหารเอง" icon="search" variant="outline" onPress={logManually} />
        </View>
        <Card style={styles.tipsCard}>
          <Text style={styles.cardTitle}>ถ้าจะลองถ่ายใหม่</Text>
          <Text style={styles.cardBody}>
            ขยับให้เห็นอาหารทั้งจาน ใช้แสงธรรมชาติ และลองถ่ายทีละจาน ภาพไม่จำเป็นต้องสวย แค่มองเห็นอาหารชัดก็พอ
          </Text>
        </Card>
      </Screen>
    );
  }

  /* --------------------------------- saved -------------------------------- */
  if (step === 'saved') {
    return (
      <Screen variant="flow">
        <ScreenHeader title="บันทึกแล้ว" subtitle="สแกนอาหารด้วย AI" onBack={goBack} />
        <EmptyState
          size="lg"
          icon="checkmark-circle-outline"
          title="บันทึกมื้อนี้แล้ว"
          message={`${saved.name} · ${Math.round(Number(saved.kcal) || 0).toLocaleString('th-TH')} kcal\n${mealLabel} · วันนี้ ดูรายการได้ที่หน้าหลัก`}
          actionTitle="ไปหน้าหลัก"
          actionIcon="home-outline"
          onAction={() => navigation.navigate('Tabs', { screen: 'Home' })}
          secondaryTitle="สแกนมื้อถัดไป"
          secondaryIcon="scan-outline"
          onSecondary={reset}
        />
      </Screen>
    );
  }

  /* --------------------------------- review ------------------------------- */
  if (step === 'review') {
    return (
      <Screen variant="flow">
        <ScreenHeader
          title="ตรวจทานผลประเมิน"
          subtitle="แก้ไขให้ใกล้เคียงกับที่คุณทานได้เลย"
          onBack={reset}
          backHint="ทิ้งผลนี้แล้วกลับไปเลือกรูป"
        />
        {photo}
        <Banner
          tone="warning"
          icon="information-circle-outline"
          message="ผลประเมินจากภาพ อาจไม่ตรงสูตรจริง ลองแก้ชื่อหรือปริมาณด้านล่างก่อนบันทึก ตัวเลขไม่ใช่คำแนะนำทางการแพทย์"
          style={styles.block}
        />
        <Text style={styles.fieldLabel}>มื้ออาหาร</Text>
        <View style={styles.block}>
          <SegmentedControl options={MEAL_OPTIONS} value={meal} onChange={setMeal} label="มื้ออาหาร" />
        </View>
        <FoodScanReview key={result.reviewKey} analysis={result} onConfirm={confirmAdd} onReset={reset} />
      </Screen>
    );
  }

  /* -------------------------------- capture ------------------------------- */
  return (
    <Screen variant="flow">
      <ScreenHeader title="สแกนอาหารด้วย AI" subtitle="เริ่มจากภาพอาหาร แล้วตรวจทานด้วยกัน" onBack={goBack} />

      <View style={styles.block}>
        <SegmentedControl options={MEAL_OPTIONS} value={meal} onChange={setMeal} label="มื้ออาหาร" />
      </View>

      {!!notice && <Banner tone="warning" message={notice} onDismiss={() => setNotice('')} style={styles.block} />}

      <Pressable
        onPress={() => pickFrom('camera')}
        accessibilityRole="button"
        accessibilityLabel="เปิดกล้องถ่ายอาหาร"
        accessibilityHint="วางอาหารให้อยู่ในกรอบ แล้วถ่ายภาพ"
        style={({ pressed }) => [styles.viewfinder, pressed && styles.pressed]}
      >
        <View style={styles.viewfinderFrame}>
          <View style={styles.viewfinderIcon}>
            <Ionicons name="camera-outline" size={34} color={colors.white} />
          </View>
          <Text style={styles.viewfinderTitle}>วางอาหารให้อยู่ในกรอบ</Text>
          <Text style={styles.viewfinderText}>แตะเพื่อเปิดกล้อง</Text>
        </View>
      </Pressable>

      <Card style={styles.block}>
        <Text style={styles.cardTitle}>ถ่ายแบบนี้ จะช่วยให้ตรวจทานง่ายขึ้น</Text>
        <View style={styles.tipRow}>
          <Ionicons name="sunny-outline" size={20} color={colors.primary} />
          <Text style={styles.tipText}>ใช้แสงสว่าง ถ่ายให้เห็นทั้งจาน{'\n'}ลองแยกจานที่มีอาหารหลายอย่าง</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="เปิดกล้องถ่ายอาหาร" icon="camera-outline" onPress={() => pickFrom('camera')} />
        <PrimaryButton title="เลือกรูปจากคลังภาพ" icon="images-outline" variant="soft" onPress={() => pickFrom('library')} />
      </View>

      <View style={styles.consentRow}>
        <Switch
          value={storeImageConsent}
          onValueChange={setStoreImageConsent}
          trackColor={{ true: colors.primary, false: colors.border }}
          accessibilityLabel="เก็บรูปนี้ไว้ทบทวนผลภายหลัง"
        />
        <Text style={styles.consentText}>เก็บรูปนี้ไว้ทบทวนผลภายหลัง (ไม่บังคับ)</Text>
      </View>

      <PrimaryButton title="ค้นหาและบันทึกอาหารเอง" icon="search" variant="ghost" onPress={logManually} compact />

      <Text style={styles.footnote}>
        AI ช่วยประเมินเบื้องต้น ไม่ทราบสูตรหรือปริมาณจริง{'\n'}คุณแก้ไขชื่ออาหารและปริมาณได้ก่อนบันทึก{'\n'}จะขอสิทธิ์กล้องหรือรูปภาพเมื่อเลือกใช้งาน
      </Text>
    </Screen>
  );
}
