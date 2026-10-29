import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, Modal } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { colors, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import {
  ACTIVITY_LEVELS,
  GOALS,
  buildProfileGoals,
  calculateCalorieGoal,
  calculateMacroGoals,
} from '../utils/calculations';
import { confirmAction } from '../utils/confirm';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import Banner from '../components/Banner';
import ScreenHeader from '../components/ScreenHeader';
import GoalPresetButton from '../components/GoalPresetButton';
import styles from '../style/screens/ProfileScreenStyles';
import ReportScreen from './ReportScreen';

const formatSigned = (value) => `${value > 0 ? '+' : ''}${value}`;

export default function ProfileScreen() {
  const { profile, updateProfile, logWeight, resetAllData, logout, user } = useApp();
  const [displayName, setDisplayName] = useState(profile.displayName || user?.displayName || '');
  const [weightKg, setWeightKg] = useState(String(profile.weightKg));
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [selectedGoal, setSelectedGoal] = useState(profile.goal);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showReport, setShowReport] = useState(false);

  // Keep the form in sync if the profile changes elsewhere.
  useEffect(() => {
    setSelectedGoal(profile.goal);
  }, [profile.goal]);

  useEffect(() => {
    setDisplayName(profile.displayName || user?.displayName || '');
  }, [profile.displayName, user?.displayName]);

  const weightValue = Number(weightKg);
  const weightValid = Number.isFinite(weightValue) && weightValue >= 20 && weightValue <= 400;

  // Live preview computed with the same helpers the app uses when saving,
  // so people can see how their choices change the daily targets.
  const preview = useMemo(() => {
    try {
      return buildProfileGoals({
        ...profile,
        weightKg: weightValid ? weightValue : profile.weightKg,
        activityLevel,
        goal: selectedGoal || 'maintain',
      });
    } catch (error) {
      return null;
    }
  }, [profile, weightValue, weightValid, activityLevel, selectedGoal]);

  // One preset card per real GOALS option, each showing what that goal would
  // produce for the current body data + activity level.
  const presets = useMemo(() => {
    if (!preview) return [];
    return GOALS.map((item) => {
      const kcal = calculateCalorieGoal({ tdee: preview.tdee, goalKey: item.key });
      return { key: item.key, label: item.label, kcal, macroGoals: calculateMacroGoals(kcal) };
    });
  }, [preview]);

  const activeActivity = ACTIVITY_LEVELS.find((item) => item.key === activityLevel);
  const activeGoal = GOALS.find((item) => item.key === selectedGoal);
  const hasGoal = !!selectedGoal && !!preview;

  const clearSaved = () => {
    if (saved) setSaved(false);
  };

  const save = async () => {
    if (!weightValid || !selectedGoal || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const weightChanged = Number(profile.weightKg) !== weightValue;
      await updateProfile({
        displayName: displayName.trim() || profile.displayName || user?.displayName || 'ผู้ใช้ CalTrack',
        weightKg: weightValue,
        activityLevel,
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
    <Screen variant="flow">
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

        {/* Activity level */}
        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>ระดับกิจกรรมในแต่ละวัน</Text>
          <Text style={styles.sectionHint}>
            ยิ่งทำกิจกรรมมาก ร่างกายยิ่งใช้พลังงานมาก เป้าหมายแคลอรี่จะปรับตามระดับที่เลือก
          </Text>
          {ACTIVITY_LEVELS.map((activity, index) => {
            const active = activityLevel === activity.key;
            return (
              <Pressable
                key={activity.key}
                onPress={() => {
                  setActivityLevel(activity.key);
                  clearSaved();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${activity.label} ${activity.sublabel}`}
                style={[styles.optionRow, index === ACTIVITY_LEVELS.length - 1 && styles.optionRowLast]}
              >
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionText}>{activity.label}</Text>
                  <Text style={styles.optionSub}>{activity.sublabel}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Ionicons name="checkmark" size={15} color={colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </Card>

        {/* Weight-goal direction */}
        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>เป้าหมายน้ำหนัก</Text>
          <Text style={styles.sectionHint}>
            ระบบจะปรับแคลอรี่เป้าหมายให้เหมาะกับเป้าหมายที่เลือก โดยไม่ต่ำกว่า 1,200 kcal ต่อวัน
          </Text>
          {GOALS.map((item, index) => {
            const active = selectedGoal === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setSelectedGoal(item.key);
                  clearSaved();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                style={[styles.optionRow, index === GOALS.length - 1 && styles.optionRowLast]}
              >
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionText}>{item.label}</Text>
                  <Text style={styles.optionSub}>
                    {item.adjustment === 0
                      ? 'กินให้พอดีกับพลังงานที่ใช้ต่อวัน'
                      : `ปรับพลังงาน ${formatSigned(item.adjustment)} kcal/วัน`}
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
              <Text style={styles.goalSummaryTitle}>พลังงานต่อวัน</Text>
              <View style={styles.goalValueRow}>
                <Text style={styles.goalValue}>{preview.calorieGoal.toLocaleString('th-TH')}</Text>
                <Text style={styles.goalUnit}>kcal</Text>
              </View>
              <Text style={styles.goalMacroRow}>
                โปรตีน {preview.macroGoals.protein} / คาร์บ {preview.macroGoals.carbs} / ไขมัน {preview.macroGoals.fat} กรัม
              </Text>
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
              disabled={!weightValid || !selectedGoal}
              accessibilityHint="บันทึกชื่อ น้ำหนัก ระดับกิจกรรม และเป้าหมายที่เลือกไว้"
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
              ระดับกิจกรรมปัจจุบัน: {activeActivity.label}
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

      <Modal visible={showReport} animationType="slide" onRequestClose={() => setShowReport(false)}>
        <ReportScreen onClose={() => setShowReport(false)} />
      </Modal>
    </Screen>
  );
}
