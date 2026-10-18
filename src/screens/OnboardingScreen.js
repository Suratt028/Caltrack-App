import React, { useState } from 'react';
import { View, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import { ACTIVITY_LEVELS, GOALS } from '../utils/calculations';
import { useApp } from '../context/AppContext';
import styles from '../style/screens/OnboardingScreenStyles';

const STEPS = [
  { key: 'gender', name: 'เพศ' },
  { key: 'body', name: 'ข้อมูลร่างกาย' },
  { key: 'activity', name: 'ระดับกิจกรรม' },
  { key: 'goal', name: 'เป้าหมาย' },
];

const LIMITS = {
  age: { min: 1, max: 120, label: 'อายุ' },
  heightCm: { min: 50, max: 250, label: 'ส่วนสูง' },
  weightKg: { min: 20, max: 400, label: 'น้ำหนัก' },
};

function numberError(rawValue, key) {
  if (String(rawValue).trim() === '') return '';
  const value = Number(rawValue);
  const { min, max, label } = LIMITS[key];
  if (!Number.isFinite(value)) return `${label}ต้องเป็นตัวเลข`;
  if (value < min || value > max) return `${label}ควรอยู่ระหว่าง ${min}–${max}`;
  return '';
}

function isValidNumber(rawValue, key) {
  const value = Number(rawValue);
  const { min, max } = LIMITS[key];
  return String(rawValue).trim() !== '' && Number.isFinite(value) && value >= min && value <= max;
}

function OptionRow({ label, sublabel, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={sublabel ? `${label} ${sublabel}` : label}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
        {!!sublabel && <Text style={styles.optionSub}>{sublabel}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <Ionicons name="checkmark" size={15} color={colors.white} />}
      </View>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState(null);
  const [goal, setGoal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const step = STEPS[stepIndex].key;

  const bodyValid =
    isValidNumber(age, 'age') && isValidNumber(heightCm, 'heightCm') && isValidNumber(weightKg, 'weightKg');

  const canProceed = () => {
    if (step === 'gender') return !!gender;
    if (step === 'body') return bodyValid;
    if (step === 'activity') return !!activityLevel;
    if (step === 'goal') return !!goal;
    return false;
  };

  const requirementText = () => {
    if (step === 'gender') return 'เลือกเพศเพื่อคำนวณอัตราการเผาผลาญพื้นฐาน';
    if (step === 'body') {
      return bodyValid
        ? 'ข้อมูลครบแล้ว กด “ถัดไป” เพื่อไปขั้นต่อไป'
        : 'กรอกอายุ ส่วนสูง และน้ำหนักให้ครบตามช่วงที่กำหนด';
    }
    if (step === 'activity') return 'เลือกระดับกิจกรรมที่ใกล้เคียงกับชีวิตประจำวันของคุณ';
    return 'เลือกเป้าหมายน้ำหนักที่ต้องการ เพื่อให้ระบบปรับแคลอรี่ให้เหมาะกับคุณ';
  };

  const next = async () => {
    if (!canProceed()) return;
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    setSubmitting(true);
    await completeOnboarding({
      gender,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel,
      goal,
      targetWeightKg: Number(weightKg),
    });
    setSubmitting(false);
  };

  const back = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            {STEPS.map((item, i) => (
              <View key={item.key} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
            ))}
          </View>
          <Text style={styles.progressLabel}>
            ขั้นที่ {stepIndex + 1} จาก {STEPS.length} · {STEPS[stepIndex].name}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 'gender' && (
            <>
              <Text style={styles.title}>เพศของคุณ</Text>
              <Text style={styles.subtitle}>ใช้คำนวณอัตราการเผาผลาญพื้นฐาน (BMR) ของร่างกายคุณ</Text>
              <OptionRow label="ชาย" selected={gender === 'male'} onPress={() => setGender('male')} />
              <OptionRow label="หญิง" selected={gender === 'female'} onPress={() => setGender('female')} />
            </>
          )}

          {step === 'body' && (
            <>
              <Text style={styles.title}>ข้อมูลร่างกาย</Text>
              <Text style={styles.subtitle}>กรอกตามความจริงเพื่อความแม่นยำของเป้าหมาย ไม่มีการแชร์ข้อมูลนี้</Text>

              <Text style={styles.fieldLabel}>อายุ (ปี)</Text>
              <View style={styles.fieldBlock}>
                <TextInput
                  style={[styles.input, touched.age && !!numberError(age, 'age') && styles.inputError]}
                  value={age}
                  onChangeText={setAge}
                  onBlur={() => setTouched((prev) => ({ ...prev, age: true }))}
                  keyboardType="number-pad"
                  placeholder="เช่น 25"
                  placeholderTextColor={colors.inkFaint}
                  accessibilityLabel="อายุ หน่วยปี"
                />
                {touched.age && !!numberError(age, 'age') && (
                  <Text style={styles.fieldError}>{numberError(age, 'age')}</Text>
                )}
              </View>

              <Text style={styles.fieldLabel}>ส่วนสูง (ซม.)</Text>
              <View style={styles.fieldBlock}>
                <TextInput
                  style={[styles.input, touched.heightCm && !!numberError(heightCm, 'heightCm') && styles.inputError]}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  onBlur={() => setTouched((prev) => ({ ...prev, heightCm: true }))}
                  keyboardType="decimal-pad"
                  placeholder="เช่น 170"
                  placeholderTextColor={colors.inkFaint}
                  accessibilityLabel="ส่วนสูง หน่วยเซนติเมตร"
                />
                {touched.heightCm && !!numberError(heightCm, 'heightCm') && (
                  <Text style={styles.fieldError}>{numberError(heightCm, 'heightCm')}</Text>
                )}
              </View>

              <Text style={styles.fieldLabel}>น้ำหนักปัจจุบัน (กก.)</Text>
              <View style={styles.fieldBlock}>
                <TextInput
                  style={[styles.input, touched.weightKg && !!numberError(weightKg, 'weightKg') && styles.inputError]}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  onBlur={() => setTouched((prev) => ({ ...prev, weightKg: true }))}
                  keyboardType="decimal-pad"
                  placeholder="เช่น 65"
                  placeholderTextColor={colors.inkFaint}
                  accessibilityLabel="น้ำหนักปัจจุบัน หน่วยกิโลกรัม"
                />
                {touched.weightKg && !!numberError(weightKg, 'weightKg') && (
                  <Text style={styles.fieldError}>{numberError(weightKg, 'weightKg')}</Text>
                )}
              </View>
            </>
          )}

          {step === 'activity' && (
            <>
              <Text style={styles.title}>ระดับกิจกรรมในแต่ละวัน</Text>
              <Text style={styles.subtitle}>ใช้คำนวณพลังงานที่ใช้ทั้งหมดต่อวัน (TDEE)</Text>
              {ACTIVITY_LEVELS.map((a) => (
                <OptionRow
                  key={a.key}
                  label={a.label}
                  sublabel={a.sublabel}
                  selected={activityLevel === a.key}
                  onPress={() => setActivityLevel(a.key)}
                />
              ))}
            </>
          )}

          {step === 'goal' && (
            <>
              <Text style={styles.title}>เป้าหมายของคุณ</Text>
              <Text style={styles.subtitle}>ปรับแคลอรี่เป้าหมายรายวันให้เหมาะกับสิ่งที่คุณต้องการ</Text>
              {GOALS.map((g) => (
                <OptionRow
                  key={g.key}
                  label={g.label}
                  sublabel={g.adjustment === 0
                    ? 'กินให้พอดีกับพลังงานที่ใช้ต่อวัน'
                    : `ปรับพลังงาน ${g.adjustment > 0 ? '+' : ''}${g.adjustment} kcal/วัน`}
                  selected={goal === g.key}
                  onPress={() => setGoal(g.key)}
                />
              ))}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.requirementHint}>{requirementText()}</Text>
          <View style={styles.footerRow}>
            {stepIndex > 0 && (
              <PrimaryButton title="ย้อนกลับ" variant="outline" onPress={back} style={{ flex: 1 }} />
            )}
            <PrimaryButton
              title={stepIndex === STEPS.length - 1 ? 'เริ่มใช้งาน' : 'ถัดไป'}
              onPress={next}
              disabled={!canProceed()}
              loading={submitting}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
