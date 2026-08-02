import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, radius } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';
import { getAllFoods } from '../services/foodService';
import styles from '../style/screens/ScanScreenStyles';

const MEALS = [
  { key: 'breakfast', label: 'มื้อเช้า' },
  { key: 'lunch', label: 'มื้อเที่ยง' },
  { key: 'dinner', label: 'มื้อเย็น' },
  { key: 'snack', label: 'ของว่าง' },
];

// ---------------------------------------------------------------------------
// MOCK AI RECOGNITION
// ---------------------------------------------------------------------------
// This is a placeholder that stands in for a real food-recognition model.
// Replace with a real vision API / ML model before production use.
// Pass foodData (loaded from MongoDB) so mockRecognize can pick from live data.
function mockRecognize(foodData) {
  const thaiFoods = (foodData || []).filter((f) => f.category === 'thai');
  if (thaiFoods.length === 0) return null;
  const pick = thaiFoods[Math.floor(Math.random() * thaiFoods.length)];
  return { ...pick, confidence: 0.7 + Math.random() * 0.25 };
}
// ---------------------------------------------------------------------------

export default function ScanScreen() {
  const { addFoodLog } = useApp();
  const [foodData, setFoodData] = useState([]);
  const [imageUri, setImageUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [meal, setMeal] = useState('lunch');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getAllFoods();
      setFoodData(data);
    })();
  }, []);

  const runMockAnalysis = () => {
    setAnalyzing(true);
    setResult(null);
    setSaved(false);
    setTimeout(() => {
      setResult(mockRecognize(foodData));
      setAnalyzing(false);
    }, 1400);
  };

  const pickFrom = async (source) => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const res = await picker({ quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
      runMockAnalysis();
    }
  };

  const updateResultField = (key, value) => setResult((r) => ({ ...r, [key]: value }));

  const confirmAdd = async () => {
    await addFoodLog({
      name: result.name,
      meal,
      kcal: Number(result.kcal) || 0,
      protein: Number(result.protein) || 0,
      carbs: Number(result.carbs) || 0,
      fat: Number(result.fat) || 0,
      servings: 1,
      source: 'ai_scan',
    });
    setSaved(true);
  };

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setSaved(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>สแกนอาหารด้วย AI</Text>
        <Text style={styles.subtitle}>ถ่ายรูปมื้ออาหาร แล้วให้ระบบช่วยประเมินแคลอรี่เบื้องต้น</Text>

        {!imageUri && (
          <View style={styles.actionsRow}>
            <PrimaryButton title="📷 ถ่ายรูป" onPress={() => pickFrom('camera')} style={{ flex: 1, marginRight: spacing.sm }} />
            <PrimaryButton title="🖼 เลือกรูป" variant="outline" onPress={() => pickFrom('library')} style={{ flex: 1 }} />
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
            <View style={styles.demoTag}>
              <Text style={styles.demoTagText}>ตัวอย่างผลลัพธ์จำลอง (Demo)</Text>
            </View>
            <Text style={styles.resultConfidence}>
              ความมั่นใจของโมเดล ~{Math.round(result.confidence * 100)}% — กรุณาตรวจสอบและแก้ไขก่อนบันทึก
            </Text>

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
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
