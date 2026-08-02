import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import { ACTIVITY_LEVELS, GOALS } from '../utils/calculations';
import { useApp } from '../context/AppContext';
import styles from '../style/screens/OnboardingScreenStyles';


const STEPS = ['gender', 'body', 'activity', 'goal'];

function OptionRow({ label, sublabel, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
        {!!sublabel && <Text style={styles.optionSub}>{sublabel}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]} />
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

  const step = STEPS[stepIndex];

  const canProceed = () => {
    if (step === 'gender') return !!gender;
    if (step === 'body') return age && heightCm && weightKg;
    if (step === 'activity') return !!activityLevel;
    if (step === 'goal') return !!goal;
    return false;
  };

  const next = async () => {
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
        <View style={styles.progressTrack}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>เริ่มต้นใช้งาน · {stepIndex + 1}/{STEPS.length}</Text>

          {step === 'gender' && (
            <>
              <Text style={styles.title}>เพศของคุณ</Text>
              <Text style={styles.subtitle}>ใช้คำนวณอัตราการเผาผลาญพื้นฐาน (BMR)</Text>
              <OptionRow label="ชาย" selected={gender === 'male'} onPress={() => setGender('male')} />
              <OptionRow label="หญิง" selected={gender === 'female'} onPress={() => setGender('female')} />
            </>
          )}

          {step === 'body' && (
            <>
              <Text style={styles.title}>ข้อมูลร่างกาย</Text>
              <Text style={styles.subtitle}>กรอกตามความจริงเพื่อความแม่นยำของเป้าหมาย</Text>
              <Text style={styles.fieldLabel}>อายุ (ปี)</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="เช่น 25" />
              <Text style={styles.fieldLabel}>ส่วนสูง (ซม.)</Text>
              <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" placeholder="เช่น 170" />
              <Text style={styles.fieldLabel}>น้ำหนักปัจจุบัน (กก.)</Text>
              <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="เช่น 65" />
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
              <Text style={styles.subtitle}>ปรับแคลอรี่เป้าหมายรายวันให้เหมาะสม</Text>
              {GOALS.map((g) => (
                <OptionRow key={g.key} label={g.label} selected={goal === g.key} onPress={() => setGoal(g.key)} />
              ))}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {stepIndex > 0 && <PrimaryButton title="ย้อนกลับ" variant="outline" onPress={back} style={{ flex: 1, marginRight: spacing.sm }} />}
          <PrimaryButton
            title={stepIndex === STEPS.length - 1 ? 'เริ่มใช้งาน' : 'ถัดไป'}
            onPress={next}
            disabled={!canProceed()}
            loading={submitting}
            style={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


