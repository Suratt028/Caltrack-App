import React, { useState } from 'react';
import { View, Image, ScrollView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '../components/AppText';
import PrimaryButton from '../components/PrimaryButton';
import Banner from '../components/Banner';
import { analyzeFoodImageTrial, prepareScanImage } from '../services/aiVisionService';
import { summarizeScanItems } from '../utils/trialScan';
import { colors } from '../theme/colors';
import styles from '../style/screens/TrialScanScreenStyles';

function trialErrorMessage(error) {
  if (error?.code === 'RATE_LIMITED') {
    return 'วันนี้ทดลองสแกนครบแล้ว สมัครสมาชิกฟรีเพื่อสแกนและบันทึกต่อได้เลย';
  }
  if (error?.code === 'TRIAL_DISABLED') return error.message;
  return error?.message || 'วิเคราะห์ภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

/**
 * Lets a guest try the AI scan once before signing up (design blueprint:
 * "value before commitment"). Nothing is saved; the result is a preview with
 * a sign-up call to action.
 */
export default function TrialScanScreen({ onClose, onSignup }) {
  const [imageUri, setImageUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  const pick = async (source) => {
    setError('');
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(source === 'camera'
        ? 'ต้องอนุญาตให้ใช้กล้องก่อน หรือเลือกรูปจากคลังภาพแทน'
        : 'ต้องอนุญาตให้เข้าถึงคลังภาพก่อนจึงจะเลือกรูปได้');
      return;
    }
    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const res = await picker({ quality: 0.7, base64: true, allowsEditing: true, aspect: [1, 1] });
    const asset = res.canceled ? null : res.assets?.[0];
    if (!asset?.uri) return;

    setImageUri(asset.uri);
    setSummary(null);
    setAnalyzing(true);
    try {
      const upload = await prepareScanImage(asset);
      const result = await analyzeFoodImageTrial(upload.base64, upload.mimeType);
      setSummary(summarizeScanItems(result.items));
    } catch (scanError) {
      if (scanError?.code === 'RATE_LIMITED' || scanError?.code === 'TRIAL_DISABLED') setLimitReached(true);
      setError(trialErrorMessage(scanError));
    } finally {
      setAnalyzing(false);
    }
  };

  const canPick = !analyzing && !limitReached;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="กลับไปหน้าเข้าสู่ระบบ"
          hitSlop={8}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>ทดลองสแกนอาหาร</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!imageUri ? (
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons name="camera-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.introTitle}>ถ่ายรูปอาหาร 1 จาน แล้วดูแคลอรี่ทันที</Text>
            <Text style={styles.introText}>
              ไม่ต้องสมัครสมาชิก รูปจะไม่ถูกเก็บไว้ ถ่ายจากด้านบนให้เห็นทั้งจานจะได้ผลแม่นขึ้น
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={styles.photo}
            accessibilityLabel="รูปอาหารที่เลือก"
          />
        )}

        {analyzing && (
          <View style={styles.analyzing} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.analyzingText}>กำลังวิเคราะห์… ใช้เวลาประมาณ 5–15 วินาที</Text>
          </View>
        )}

        {!!error && (
          <View style={styles.block}>
            <Banner tone={limitReached ? 'info' : 'error'} message={error} />
          </View>
        )}

        {summary && (
          <View style={styles.resultCard} accessibilityLiveRegion="polite">
            <Text style={styles.resultLabel}>พลังงานโดยประมาณ</Text>
            <Text style={styles.resultKcal}>≈ {summary.total.kcal.toLocaleString()} kcal</Text>
            <View style={styles.macroRow}>
              <MacroPill color={colors.protein} label="โปรตีน" grams={summary.total.protein} />
              <MacroPill color={colors.carbs} label="คาร์บ" grams={summary.total.carbs} />
              <MacroPill color={colors.fat} label="ไขมัน" grams={summary.total.fat} />
            </View>
            {summary.rows.map((row, index) => (
              <View key={`${row.name}-${index}`} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={2}>{row.name}</Text>
                <Text style={styles.itemMeta}>≈ {row.grams} ก. · {row.kcal} kcal</Text>
              </View>
            ))}
            <Text style={styles.disclaimer}>
              ค่าประมาณจาก AI และฐานข้อมูลอาหารไทย หลังสมัครแล้วปรับเมนูและปริมาณได้ก่อนบันทึก
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {summary || limitReached ? (
          <>
            <PrimaryButton title="สมัครฟรีเพื่อบันทึกมื้อนี้" icon="person-add-outline" onPress={onSignup} />
            {!limitReached && (
              <PrimaryButton
                title="ลองรูปอื่น"
                variant="outline"
                onPress={() => pick('library')}
                disabled={!canPick}
                style={styles.secondaryBtn}
              />
            )}
          </>
        ) : (
          <>
            {Platform.OS !== 'web' && (
              <PrimaryButton title="ถ่ายรูป" icon="camera" onPress={() => pick('camera')} disabled={!canPick} loading={analyzing} />
            )}
            <PrimaryButton
              title="เลือกจากคลังภาพ"
              icon="images-outline"
              variant={Platform.OS === 'web' ? 'solid' : 'outline'}
              onPress={() => pick('library')}
              disabled={!canPick}
              loading={Platform.OS === 'web' && analyzing}
              style={Platform.OS === 'web' ? undefined : styles.secondaryBtn}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function MacroPill({ color, label, grams }) {
  return (
    <View style={styles.macroPill}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroText}>{label} {grams} ก.</Text>
    </View>
  );
}
