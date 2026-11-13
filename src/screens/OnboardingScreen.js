import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import {
  BMI_CATEGORIES,
  EXERCISE_INTENSITIES,
  GOALS,
  WORK_ACTIVITY_LEVELS,
  calculateBMI,
  getBMIRecommendedGoal,
  getBMICategory,
} from '../utils/calculations';
import { useProfile } from '../data/useUserData';
import styles from '../style/screens/OnboardingScreenStyles';

const STEPS = [
  { key: 'gender', name: 'เพศ' },
  { key: 'body', name: 'ข้อมูลร่างกาย' },
  { key: 'goal', name: 'เป้าหมาย' },
  { key: 'activity', name: 'ระดับกิจกรรม' },
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
  const { completeOnboarding } = useProfile();
  const [stepIndex, setStepIndex] = useState(0);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState(null);
  const [exerciseDaysPerWeek, setExerciseDaysPerWeek] = useState('0');
  const [exerciseMinutes, setExerciseMinutes] = useState('30');
  const [exerciseIntensity, setExerciseIntensity] = useState('moderate');
  const [goal, setGoal] = useState(null);
  const [goalManuallySelected, setGoalManuallySelected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [touched, setTouched] = useState({});

  const step = STEPS[stepIndex].key;

  const bodyValid =
    isValidNumber(age, 'age') && isValidNumber(heightCm, 'heightCm') && isValidNumber(weightKg, 'weightKg');
  const exerciseDays = Number(exerciseDaysPerWeek);
  const exerciseDuration = Number(exerciseMinutes);
  const exerciseValid =
    String(exerciseDaysPerWeek).trim() !== '' &&
    String(exerciseMinutes).trim() !== '' &&
    Number.isInteger(exerciseDays) &&
    exerciseDays >= 0 &&
    exerciseDays <= 7 &&
    Number.isFinite(exerciseDuration) &&
    exerciseDuration >= 0 &&
    exerciseDuration <= 300 &&
    (exerciseDays === 0 || exerciseDuration > 0);
  const bmi = bodyValid ? calculateBMI(Number(weightKg), Number(heightCm)) : null;
  const isAdult = Number(age) >= 18;
  const bmiCategory = isAdult ? getBMICategory(bmi) : null;
  const recommendedGoal = getBMIRecommendedGoal(age, bmi);
  const lossGoalAvailable = isAdult && bmi >= 18.5;
  const goalOptions = lossGoalAvailable ? GOALS : GOALS.filter((item) => item.key !== 'lose');

  useEffect(() => {
    if (bodyValid && !goalManuallySelected) setGoal(recommendedGoal);
  }, [bodyValid, goalManuallySelected, recommendedGoal]);

  const canProceed = () => {
    if (step === 'gender') return !!gender;
    if (step === 'body') return bodyValid;
    if (step === 'activity') return !!activityLevel && exerciseValid;
    if (step === 'goal') return !!goal && goalOptions.some((item) => item.key === goal);
    return false;
  };

  const requirementText = () => {
    if (step === 'gender') return 'เลือกเพศเพื่อคำนวณอัตราการเผาผลาญพื้นฐาน';
    if (step === 'body') {
      return bodyValid
        ? 'ข้อมูลครบแล้ว กด “ถัดไป” เพื่อไปขั้นต่อไป'
        : 'กรอกอายุ ส่วนสูง และน้ำหนักให้ครบตามช่วงที่กำหนด';
    }
    if (step === 'activity') return 'แยกกิจกรรมจากงานออกจากวันและเวลาที่ออกกำลังกาย';
    if (step === 'goal') return 'พิจารณาคำแนะนำจาก BMI แล้วเลือกเป้าหมายที่ต้องการ';
    return 'แยกกิจกรรมจากงานออกจากวันและเวลาที่ออกกำลังกาย';
  };

  const next = async () => {
    if (!canProceed()) return;
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await completeOnboarding({
        gender,
        age: Number(age),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel,
        workActivityLevel: activityLevel,
        exerciseDaysPerWeek: exerciseDays,
        exerciseMinutes: exerciseDuration,
        exerciseIntensity,
        goal,
        targetWeightKg: Number(weightKg),
      });
    } catch (error) {
      setSubmitError(error?.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
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
              <Text style={styles.title}>กิจกรรมประจำวัน</Text>
              <Text style={styles.subtitle}>แยกประเภทงานออกจากการออกกำลังกาย เพื่อประเมินพลังงานที่ใช้ต่อวัน (TDEE)</Text>
              <Text style={styles.fieldLabel}>งาน/กิจกรรมทั่วไป</Text>
              {WORK_ACTIVITY_LEVELS.map((a) => (
                <OptionRow
                  key={a.key}
                  label={a.sublabel.replace(/^เช่น\s*/, '')}
                  sublabel={a.label}
                  selected={activityLevel === a.key}
                  onPress={() => setActivityLevel(a.key)}
                />
              ))}
              <Text style={styles.fieldLabel}>อยากออกกำลังกายกี่วันต่อสัปดาห์? (0–7)</Text>
              <TextInput
                style={styles.input}
                value={exerciseDaysPerWeek}
                onChangeText={setExerciseDaysPerWeek}
                keyboardType="number-pad"
                accessibilityLabel="จำนวนวันที่ออกกำลังกายต่อสัปดาห์"
              />
              <Text style={styles.fieldLabel}>ต่อนาที</Text>
              <TextInput
                style={styles.input}
                value={exerciseMinutes}
                onChangeText={setExerciseMinutes}
                keyboardType="number-pad"
                accessibilityLabel="ระยะเวลาออกกำลังกายต่อนาทีต่อครั้ง"
              />
              {!exerciseValid && <Text style={styles.fieldError}>กรอกวันเป็นจำนวนเต็ม 0–7 และเวลา 0–60 นาที</Text>}
              <Text style={styles.fieldLabel}>ความชอบในการออกกำลังกาย</Text>
              {EXERCISE_INTENSITIES.map((intensity) => (
                <OptionRow
                  key={intensity.key}
                  label={intensity.label}
                  sublabel={intensity.sublabel}
                  selected={exerciseIntensity === intensity.key}
                  onPress={() => setExerciseIntensity(intensity.key)}
                />
              ))}
            </>
          )}

          {step === 'goal' && (
            <>
              <Text style={styles.title}>เป้าหมายของคุณ</Text>
              <Text style={styles.subtitle}>ดู BMI และคำแนะนำประกอบการเลือกเป้าหมายของคุณ</Text>
              <View style={styles.bmiGuidance}>
                <Text style={styles.bmiGuidanceTitle}>
                  BMI {bmi?.toFixed(1)} · {isAdult ? bmiCategory?.label || 'ยังประเมินไม่ได้' : 'ต้องใช้เกณฑ์เฉพาะอายุ'}
                </Text>
                <Text style={styles.bmiGuidanceText}>
                  {!isAdult
                    ? 'อายุต่ำกว่า 18 ปีต้องแปลผล BMI ตามอายุและเพศ ไม่ใช้เกณฑ์ผู้ใหญ่ และไม่แนะนำให้ตั้งเป้าลดน้ำหนักเอง ควรปรึกษาบุคลากรสุขภาพ'
                    : bmiCategory?.key === 'low'
                      ? 'BMI ต่ำกว่าช่วงอ้างอิง ไม่แนะนำให้ตั้งเป้าลดน้ำหนัก พิจารณารักษาหรือเพิ่มน้ำหนักอย่างเหมาะสม และปรึกษาบุคลากรสุขภาพหากกังวล'
                      : bmiCategory?.key === 'normal'
                        ? 'BMI อยู่ในช่วงอ้างอิง ไม่จำเป็นต้องลดน้ำหนักจากตัวเลขนี้เพียงอย่างเดียว คุณอาจเลือกรักษาน้ำหนักหรือเพิ่มมวลกล้ามเนื้อตามความต้องการ'
                        : `BMI สูงกว่าช่วงอ้างอิง อาจพิจารณาลดน้ำหนักอย่างค่อยเป็นค่อยไป หรือเลือกเป้าหมายอื่นตามความต้องการ ทั้งนี้ BMI เป็นเพียงเกณฑ์คัดกรอง`}
                </Text>
                {isAdult && (
                  <Text style={styles.bmiGuidanceNote}>
                    {BMI_CATEGORIES.map((category) => `${category.label} ${category.range}`).join(' · ')}
                  </Text>
                )}
              </View>
              <Text style={styles.goalPrompt}>เลือกเป้าหมายน้ำหนัก</Text>
              {goalOptions.map((g) => (
                <OptionRow
                  key={g.key}
                  label={g.label}
                  sublabel={g.adjustment === 0
                    ? `กินให้พอดีกับพลังงานที่ใช้ต่อวัน${g.key === recommendedGoal ? ' · แนะนำตาม BMI' : ''}`
                    : `ปรับพลังงาน ${g.adjustment > 0 ? '+' : ''}${g.adjustment} kcal/วัน${g.key === recommendedGoal ? ' · แนะนำตาม BMI' : ''}`}
                  selected={goal === g.key}
                  onPress={() => {
                    setGoal(g.key);
                    setGoalManuallySelected(true);
                  }}
                />
              ))}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {submitError ? (
            <Text style={styles.fieldError}>{submitError}</Text>
          ) : (
            <Text style={styles.requirementHint}>{requirementText()}</Text>
          )}
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
