import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Modal } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useProfile, useWeights } from '../data/useUserData';
import {
  EXERCISE_INTENSITIES,
  GOALS,
  WORK_ACTIVITY_LEVELS,
  buildProfileGoals,
  calculateAgeBasedMacroGoals,
  calculateBMI,
  calculateCalorieGoal,
  getBMIRecommendedGoal,
  getBMICategory,
} from '../utils/calculations';
import { confirmAction } from '../utils/confirm';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import Banner from '../components/Banner';
import ScreenHeader from '../components/ScreenHeader';
import GoalPresetButton from '../components/GoalPresetButton';
import BmiReferenceCard from '../components/BmiReferenceCard';
import styles from '../style/screens/ProfileScreenStyles';
import ReportScreen from './ReportScreen';

const formatSigned = (value) => `${value > 0 ? '+' : ''}${value}`;
// "เช่น งานออฟฟิศ/ขับรถ" -> "งานออฟฟิศ/ขับรถ"
const activityExample = (sublabel) => String(sublabel || '').replace(/^เช่น\s*/, '');

export default function ProfileScreen() {
  const { resetAllData, logout, user } = useApp();
  const { profile, updateProfile } = useProfile();
  const { logWeight } = useWeights();
  const [displayName, setDisplayName] = useState(profile.displayName || user?.displayName || '');
  const [weightKg, setWeightKg] = useState(String(profile.weightKg));
  const [workActivityLevel, setWorkActivityLevel] = useState(profile.workActivityLevel || '');
  const [exerciseDaysPerWeek, setExerciseDaysPerWeek] = useState(String(profile.exerciseDaysPerWeek ?? 0));
  const [exerciseMinutes, setExerciseMinutes] = useState(String(profile.exerciseMinutes ?? 30));
  const [exerciseIntensity, setExerciseIntensity] = useState(profile.exerciseIntensity || 'moderate');
  const [selectedGoal, setSelectedGoal] = useState(
    getBMIRecommendedGoal(profile.age, calculateBMI(profile.weightKg, profile.heightCm))
  );
  const [goalManuallySelected, setGoalManuallySelected] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    setDisplayName(profile.displayName || user?.displayName || '');
  }, [profile.displayName, user?.displayName]);

  const weightValue = Number(weightKg);
  const weightValid = Number.isFinite(weightValue) && weightValue >= 20 && weightValue <= 400;
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
  const bmi = calculateBMI(weightValid ? weightValue : profile.weightKg, profile.heightCm);
  const bmiCategory = Number(profile.age) >= 18 ? getBMICategory(bmi) : null;
  const recommendedGoal = getBMIRecommendedGoal(profile.age, bmi);

  useEffect(() => {
    if (!goalManuallySelected) setSelectedGoal(recommendedGoal);
  }, [profile.goal, goalManuallySelected, recommendedGoal]);

  // Live preview computed with the same helpers the app uses when saving,
  // so people can see how their choices change the daily targets.
  const preview = useMemo(() => {
    try {
      return buildProfileGoals({
        ...profile,
        weightKg: weightValid ? weightValue : profile.weightKg,
        activityLevel: workActivityLevel,
        workActivityLevel,
        exerciseDaysPerWeek: exerciseValid ? exerciseDays : 0,
        exerciseMinutes: exerciseValid ? exerciseDuration : 0,
        exerciseIntensity,
        goal: selectedGoal || 'maintain',
      });
    } catch (error) {
      return null;
    }
  }, [profile, weightValue, weightValid, workActivityLevel, exerciseDays, exerciseDuration, exerciseValid, exerciseIntensity, selectedGoal]);

  const restrictLossGoal = bmiCategory?.key === 'low' || Number(profile.age) < 18;
  const availableGoals = restrictLossGoal
    ? GOALS.filter((item) => item.key !== 'lose')
    : GOALS;

  // One preset card per real GOALS option, each showing what that goal would
  // produce for the current body data + activity level.
  const presets = useMemo(() => {
    if (!preview) return [];
    return availableGoals.map((item) => {
      const kcal = calculateCalorieGoal({ tdee: preview.tdee, goalKey: item.key });
      return {
        key: item.key,
        label: item.label,
        kcal,
        macroGoals: calculateAgeBasedMacroGoals(kcal, {
          age: profile.age,
          weightKg: weightValid ? weightValue : profile.weightKg,
        }),
      };
    });
  }, [preview, profile.age, profile.weightKg, weightValid, weightValue, availableGoals]);

  const activeActivity = WORK_ACTIVITY_LEVELS.find((item) => item.key === workActivityLevel);
  const activeGoal = GOALS.find((item) => item.key === selectedGoal);
  const hasGoal = !!selectedGoal && !!preview;
  useEffect(() => {
    if (restrictLossGoal && selectedGoal === 'lose') {
      setSelectedGoal(recommendedGoal);
      setGoalManuallySelected(false);
    }
  }, [restrictLossGoal, recommendedGoal, selectedGoal]);

  const clearSaved = () => {
    if (saved) setSaved(false);
  };

  const save = async () => {
    if (!weightValid || !exerciseValid || !workActivityLevel || !selectedGoal || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const weightChanged = Number(profile.weightKg) !== weightValue;
      await updateProfile({
        displayName: displayName.trim() || profile.displayName || user?.displayName || 'ผู้ใช้ CalTrack',
        weightKg: weightValue,
        activityLevel: workActivityLevel,
        workActivityLevel,
        exerciseDaysPerWeek: exerciseDays,
        exerciseMinutes: exerciseDuration,
        exerciseIntensity,
        goal: selectedGoal,
      });
      // Record the new weight as today's weigh-in so the weight trend matches.
      if (weightChanged) await logWeight(weightValue, undefined, { syncProfile: false });
      setSaved(true);
    } catch (error) {
      setSaveError(error?.message || 'บันทึกเป้าหมายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const confirmReset = () => {
    confirmAction({
      title: 'ล้างข้อมูลทั้งหมด?',
      message: 'ข้อมูลโปรไฟล์ บันทึกอาหาร และน้ำหนักทั้งหมดจะถูกลบ ไม่สามารถกู้คืนได้',
      confirmLabel: 'ล้างข้อมูล',
      onConfirm: resetAllData,
    });
  };

  const confirmLogout = () => {
    confirmAction({
      title: 'ออกจากระบบ?',
      message: 'คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อดูข้อมูลของคุณ',
      confirmLabel: 'ออกจากระบบ',
      destructive: false,
      onConfirm: logout,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="โปรไฟล์และเป้าหมาย"
          subtitle="ตั้งเป้าให้เหมาะกับคุณ ไม่มีค่าที่ถูกต้องเพียงค่าเดียว"
        />

        {/* Name */}
        <Card>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.displayName || 'ผ').slice(0, 1)}</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.identityName} numberOfLines={1}>{user?.displayName || 'ผู้ใช้ CalTrack'}</Text>
              <Text style={styles.identityMeta} numberOfLines={1}>{user?.email || 'ยังไม่ได้เข้าสู่ระบบ'}</Text>
            </View>
          </View>
          <Text style={styles.fieldLabel}>ชื่อที่แสดง</Text>
          <TextInput
            style={styles.nameInput}
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              clearSaved();
            }}
            placeholder="ชื่อที่แสดง"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="ชื่อที่แสดง"
            maxLength={40}
          />
        </Card>

        {/* Body metrics */}
        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>ข้อมูลพื้นฐาน</Text>
          <Text style={styles.sectionHint}>
            ใช้คำนวณอัตราการเผาผลาญพื้นฐาน (BMR) ยิ่งตรงกับความจริง เป้าหมายยิ่งแม่นยำ
          </Text>
          <View style={styles.row}><Text style={styles.label}>เพศ</Text><Text style={styles.value}>{profile.gender === 'male' ? 'ชาย' : 'หญิง'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>อายุ</Text><Text style={styles.value}>{profile.age} ปี</Text></View>
          <View style={styles.row}><Text style={styles.label}>ส่วนสูง</Text><Text style={styles.value}>{profile.heightCm} ซม.</Text></View>
          <View style={[styles.row, styles.rowLast, { flexDirection: 'column', alignItems: 'stretch' }]}>
            <Text style={styles.label}>น้ำหนักปัจจุบัน (กก.)</Text>
            <TextInput
              style={[styles.input, !weightValid && styles.inputError]}
              keyboardType="decimal-pad"
              value={weightKg}
              onChangeText={(text) => {
                setWeightKg(text);
                clearSaved();
              }}
              accessibilityLabel="น้ำหนักปัจจุบัน หน่วยกิโลกรัม"
            />
            <Text style={[styles.inputHint, !weightValid && styles.inputHintError]}>
              {weightValid ? 'กรอกเป็นตัวเลข เช่น 62.5' : 'กรอกน้ำหนักระหว่าง 20–400 กก.'}
            </Text>
          </View>
        </Card>

        {/* BMI screening */}
        <BmiReferenceCard
          bmi={bmi}
          category={bmiCategory}
          age={profile.age}
          heightCm={profile.heightCm}
          style={styles.cardSpacing}
        />

        {/* Work and daily activity */}
        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>กิจกรรมจากงาน/ชีวิตประจำวัน</Text>
          <Text style={styles.sectionHint}>
            เลือกงานที่ใกล้เคียงกับกิจวัตรส่วนใหญ่ โดยไม่นับช่วงออกกำลังกาย
          </Text>
          {!profile.workActivityLevel ? (
            <Text style={styles.activityHint}>
              โปรไฟล์เดิมยังไม่ได้แยกกิจกรรมจากงานกับการออกกำลังกาย เลือกประเภทงานของคุณเพื่อคำนวณเป้าหมายใหม่
            </Text>
          ) : null}
          {WORK_ACTIVITY_LEVELS.map((activity, index) => {
            const active = workActivityLevel === activity.key;
            return (
              <Pressable
                key={activity.key}
                onPress={() => {
                  setWorkActivityLevel(activity.key);
                  clearSaved();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${activity.label} ${activity.sublabel}`}
                style={[styles.optionRow, index === WORK_ACTIVITY_LEVELS.length - 1 && styles.optionRowLast]}
              >
                {/* The concrete example ("งานออฟฟิศ/ขับรถ") is easier to recognise
                    than the abstract level, so it leads; the level becomes the subtitle. */}
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionText}>{activityExample(activity.sublabel)}</Text>
                  <Text style={styles.optionSub}>{activity.label}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Ionicons name="checkmark" size={15} color={colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </Card>

        {/* Exercise activity */}
        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>การออกกำลังกาย</Text>
          <Text style={styles.sectionHint}>
            ใส่จำนวนวันที่ออกกำลังต่อสัปดาห์และเวลาโดยประมาณต่อครั้ง เพื่อนำไปประเมิน TDEE ร่วมกับกิจกรรมจากงาน
          </Text>
          <View style={styles.activityInputs}>
            <View style={styles.activityInputWrap}>
              <Text style={styles.fieldLabel}>วันต่อสัปดาห์ (0–7)</Text>
              <TextInput
                style={[styles.input, !exerciseValid && styles.inputError]}
                value={exerciseDaysPerWeek}
                onChangeText={(text) => {
                  setExerciseDaysPerWeek(text);
                  clearSaved();
                }}
                keyboardType="number-pad"
                accessibilityLabel="จำนวนวันที่ออกกำลังกายต่อสัปดาห์"
              />
            </View>
            <View style={styles.activityInputWrap}>
              <Text style={styles.fieldLabel}>นาที</Text>
              <TextInput
                style={[styles.input, !exerciseValid && styles.inputError]}
                value={exerciseMinutes}
                onChangeText={(text) => {
                  setExerciseMinutes(text);
                  clearSaved();
                }}
                keyboardType="number-pad"
                accessibilityLabel="ระยะเวลาออกกำลังกายต่อนาทีต่อครั้ง"
              />
            </View>
          </View>
          {!exerciseValid && (
            <Text style={styles.inputHintError}>กรอกวันเป็นจำนวนเต็ม 0–7 และเวลา 0–60 นาที (ถ้าออกกำลัง ต้องมากกว่า 0 นาที)</Text>
          )}
          <Text style={styles.fieldLabel}>ความชอบในการออกกำลังกาย</Text>
          {EXERCISE_INTENSITIES.map((intensity, index) => {
            const active = exerciseIntensity === intensity.key;
            return (
              <Pressable
                key={intensity.key}
                onPress={() => {
                  setExerciseIntensity(intensity.key);
                  clearSaved();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${intensity.label} ${intensity.sublabel}`}
                style={[styles.optionRow, index === EXERCISE_INTENSITIES.length - 1 && styles.optionRowLast]}
              >
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionText}>{intensity.label}</Text>
                  <Text style={styles.optionSub}>{intensity.sublabel}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Ionicons name="checkmark" size={15} color={colors.white} />}
                </View>
              </Pressable>
            );
          })}
          <Text style={styles.activityHint}>การใช้พลังงานเป็นค่าประมาณจากน้ำหนัก ความหนัก(ความชอบในการออกกำลังกาย) และเวลาที่กรอก</Text>
        </Card>

        {/* Weight-goal direction */}
        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>เป้าหมายน้ำหนัก</Text>
          <Text style={styles.sectionHint}>
            ระบบเลือกเป้าหมายเริ่มต้นตาม BMI และคุณเปลี่ยนได้ตามความต้องการ · BMI เป็นเพียงเกณฑ์คัดกรอง
          </Text>
          {availableGoals.map((item, index) => {
            const active = selectedGoal === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setSelectedGoal(item.key);
                  setGoalManuallySelected(true);
                  clearSaved();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                style={[styles.optionRow, index === availableGoals.length - 1 && styles.optionRowLast]}
              >
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionText}>{item.label}</Text>
                  <Text style={styles.optionSub}>
                    {item.adjustment === 0
                      ? `กินให้พอดีกับพลังงานที่ใช้ต่อวัน${item.key === recommendedGoal ? ' · แนะนำตาม BMI' : ''}`
                      : `ปรับพลังงาน ${formatSigned(item.adjustment)} kcal/วัน${item.key === recommendedGoal ? ' · แนะนำตาม BMI' : ''}`}
                  </Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Ionicons name="checkmark" size={15} color={colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </Card>

        {/* Nutrition goal */}
        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>เป้าหมายโภชนาการ</Text>

          {hasGoal ? (
            <View style={styles.goalSummary}>
              <Text style={styles.goalMacroRow}>
                โปรตีน {preview.macroGoals.protein} / คาร์บ {preview.macroGoals.carbs} / ไขมัน {preview.macroGoals.fat} กรัม
              </Text>
              <Text style={styles.goalNote}>
                โปรตีนคำนวณจากน้ำหนัก × ค่าอ้างอิงตามวัย (ผู้ใหญ่ 19 ปีขึ้นไปใช้ 0.8 กรัม/กก./วัน) แล้วแบ่งพลังงานที่เหลือเป็นคาร์บ 60% และไขมัน 40% เป็นค่าอ้างอิงทั่วไป ไม่ใช่เป้าหมายเฉพาะสำหรับเพิ่มกล้ามเนื้อหรือรักษาโรค
              </Text>
              {Number(profile.age) < 18 ? (
                <Text style={styles.goalNote}>อายุต่ำกว่า 18 ปี สูตรพลังงานในแอปเป็นเพียงค่าประมาณ ควรปรึกษาแพทย์หรือนักกำหนดอาหารก่อนใช้เป้าหมาย</Text>
              ) : null}
              <Text style={styles.goalNote}>
                BMR ประมาณ {preview.bmr.toLocaleString('th-TH')} kcal · พลังงานที่ใช้ต่อวัน (TDEE) ประมาณ {preview.tdee.toLocaleString('th-TH')} kcal
                {activeGoal?.adjustment
                  ? ` · เป้าหมาย "${activeGoal.label}" ปรับพลังงาน ${formatSigned(activeGoal.adjustment)} kcal`
                  : ' · เป้าหมาย "รักษาน้ำหนัก" ไม่ปรับพลังงานเพิ่ม'}
              </Text>
            </View>
          ) : (
            <View style={styles.placeholderCard}>
              <Ionicons name="leaf-outline" size={24} color={colors.primary} style={styles.placeholderIcon} />
              <View style={styles.placeholderTextWrap}>
                <Text style={styles.placeholderTitle}>ยังไม่ได้ตั้งเป้าหมาย</Text>
                <Text style={styles.placeholderBody}>
                  เลือกเป้าหมายด้านล่างเพื่อดูว่าหน้าต่าง ๆ จะแสดงผลอย่างไร
                </Text>
              </View>
            </View>
          )}

          {!saved && hasGoal && (
            <Text style={styles.previewHint}>
              * ตัวเลขด้านบนเป็นการพรีวิว กด “บันทึกเป้าหมาย” เพื่อใช้ค่านี้จริง
            </Text>
          )}

          <Text style={styles.legend}>เลือกเป้าหมายตัวอย่าง</Text>
          <View style={styles.presetGrid} accessibilityRole="radiogroup" accessibilityLabel="เลือกเป้าหมายตัวอย่าง">
            {presets.map((item) => {
              const active = selectedGoal === item.key;
              return (
                <GoalPresetButton
                  key={item.key}
                  style={styles.presetItem}
                  kcal={item.kcal}
                  protein={item.macroGoals.protein}
                  carbs={item.macroGoals.carbs}
                  fat={item.macroGoals.fat}
                  active={active}
                  onPress={() => {
                    setSelectedGoal(item.key);
                    clearSaved();
                  }}
                  accessibilityLabel={`${item.label} ${item.kcal} kcal ต่อวัน`}
                  accessibilityHint="แตะเพื่อเลือกเป้าหมายนี้"
                />
              );
            })}
          </View>

          <View style={styles.actionRow}>
            <PrimaryButton
              title="บันทึกเป้าหมาย"
              onPress={save}
              loading={saving}
              disabled={!weightValid || !exerciseValid || !workActivityLevel || !selectedGoal}
              accessibilityHint="บันทึกชื่อ น้ำหนัก กิจกรรมจากงาน การออกกำลังกาย และเป้าหมายที่เลือกไว้"
              style={styles.actionBtn}
            />
          </View>

          {!!saveError && (
            <View style={styles.savedWrap}>
              <Banner tone="error" message={saveError} onDismiss={() => setSaveError('')} />
            </View>
          )}

          {saved && (
            <View style={styles.savedWrap}>
              <Banner
                tone="success"
                message="บันทึกเป้าหมายแล้ว"
                onDismiss={() => setSaved(false)}
              />
            </View>
          )}

          {!!activeActivity && (
            <Text style={styles.activityHint}>
              กิจกรรมจากงาน: {activeActivity.label}
            </Text>
          )}
        </Card>

        {/* Support */}
        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>ช่วยเหลือและสนับสนุน</Text>
          <Pressable
            onPress={() => setShowReport(true)}
            accessibilityRole="button"
            accessibilityLabel="รายงานปัญหา หรือแจ้งข้อเสนอแนะ"
            style={styles.supportRow}
          >
            <View style={styles.supportLeft}>
              <Ionicons name="help-buoy-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
              <Text style={styles.supportText}>รายงานปัญหา / แจ้งข้อเสนอแนะ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </Pressable>
        </Card>

        {/* Footer actions */}
        <View style={styles.footerActions}>
          <PrimaryButton
            title="ออกจากระบบ"
            variant="outline"
            icon="log-out-outline"
            onPress={confirmLogout}
            accessibilityHint="ออกจากระบบและลบข้อมูลที่เก็บไว้บนอุปกรณ์นี้"
            style={styles.footerBtn}
          />
          <Pressable
            onPress={confirmReset}
            accessibilityRole="button"
            accessibilityLabel="ล้างข้อมูลทั้งหมด"
            accessibilityHint="ล้างโปรไฟล์ บันทึกอาหาร และน้ำหนักทั้งหมดอย่างถาวร"
            style={({ pressed }) => [styles.resetBtn, pressed && styles.resetBtnPressed]}
          >
            <Text style={styles.resetText}>ล้างข้อมูลทั้งหมด</Text>
          </Pressable>
          <Text style={styles.footerHint}>
            การล้างข้อมูลจะลบโปรไฟล์ บันทึกอาหาร และน้ำหนักทั้งหมดอย่างถาวร
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showReport} animationType="slide" onRequestClose={() => setShowReport(false)}>
        <ReportScreen onClose={() => setShowReport(false)} />
      </Modal>
    </SafeAreaView>
  );
}
