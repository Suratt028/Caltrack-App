import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ACTIVITY_LEVELS, GOALS, buildProfileGoals } from '../utils/calculations';
import { confirmAction } from '../utils/confirm';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import Banner from '../components/Banner';
import styles from '../style/screens/ProfileScreenStyles';
import ReportScreen from './ReportScreen';

const formatSigned = (value) => `${value > 0 ? '+' : ''}${value}`;

export default function ProfileScreen() {
  const { profile, updateProfile, resetAllData, logout, user } = useApp();
  const [weightKg, setWeightKg] = useState(String(profile.weightKg));
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [goal, setGoal] = useState(profile.goal);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const weightValue = Number(weightKg);
  const weightValid = Number.isFinite(weightValue) && weightValue >= 20 && weightValue <= 400;

  // Live preview computed with the same helper the app uses when saving,
  // so people can see how their choices change the daily targets.
  const preview = useMemo(() => {
    try {
      return buildProfileGoals({
        ...profile,
        weightKg: weightValid ? weightValue : profile.weightKg,
        activityLevel,
        goal,
      });
    } catch (error) {
      return null;
    }
  }, [profile, weightValue, weightValid, activityLevel, goal]);

  const activeActivity = ACTIVITY_LEVELS.find((item) => item.key === activityLevel);
  const activeGoal = GOALS.find((item) => item.key === goal);

  const save = async () => {
    if (!weightValid || saving) return;
    setSaving(true);
    try {
      await updateProfile({ weightKg: weightValue, activityLevel, goal });
      setSaved(true);
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
        <Text style={styles.title}>โปรไฟล์และเป้าหมาย</Text>
        <Text style={styles.subtitle}>ปรับข้อมูลให้ตรงกับตัวคุณ เพื่อให้เป้าหมายแคลอรี่แม่นยำขึ้น</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.displayName || 'ผ').slice(0, 1)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.displayName || 'ผู้ใช้ CalTrack'}</Text>
            <Text style={styles.profileMeta} numberOfLines={1}>{user?.email || 'ยังไม่ได้เข้าสู่ระบบ'}</Text>
          </View>
        </View>

        {!!saved && (
          <Banner
            tone="success"
            message="บันทึกการเปลี่ยนแปลงแล้ว เป้าหมายของคุณอัปเดตเรียบร้อย"
            onDismiss={() => setSaved(false)}
            style={{ marginBottom: spacing.md }}
          />
        )}

        <Card>
          <Text style={styles.sectionTitle}>เป้าหมายของคุณตอนนี้</Text>
          <Text style={styles.sectionHint}>
            คำนวณจากข้อมูลร่างกาย ระดับกิจกรรม และเป้าหมายที่เลือกไว้
          </Text>
          <View style={styles.goalSummary}>
            <Text style={styles.goalSummaryTitle}>เป้าหมายแคลอรี่ต่อวัน</Text>
            <View style={styles.goalValueRow}>
              <Text style={styles.goalValue}>
                {preview ? preview.calorieGoal.toLocaleString('th-TH') : (profile.calorieGoal || 0).toLocaleString('th-TH')}
              </Text>
              <Text style={styles.goalUnit}>kcal/วัน</Text>
            </View>
            <View style={styles.macroPreviewRow}>
              <View style={styles.macroPreviewItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.protein }]} />
                <Text style={styles.macroPreviewText}>
                  โปรตีน {(preview?.macroGoals?.protein ?? profile.macroGoals?.protein ?? 0)} g
                </Text>
              </View>
              <View style={styles.macroPreviewItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.carbs }]} />
                <Text style={styles.macroPreviewText}>
                  คาร์บ {(preview?.macroGoals?.carbs ?? profile.macroGoals?.carbs ?? 0)} g
                </Text>
              </View>
              <View style={styles.macroPreviewItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.fat }]} />
                <Text style={styles.macroPreviewText}>
                  ไขมัน {(preview?.macroGoals?.fat ?? profile.macroGoals?.fat ?? 0)} g
                </Text>
              </View>
            </View>
            {!!preview && (
              <Text style={styles.goalNote}>
                พลังงานที่ใช้ต่อวัน (TDEE) ประมาณ {preview.tdee.toLocaleString('th-TH')} kcal
                {activeGoal?.adjustment
                  ? ` · เป้าหมาย "${activeGoal.label}" ปรับพลังงาน ${formatSigned(activeGoal.adjustment)} kcal`
                  : ' · เป้าหมาย "รักษาน้ำหนัก" ไม่ปรับพลังงานเพิ่ม'}
              </Text>
            )}
          </View>
          {!saved && (
            <Text style={styles.goalNote}>
              * ตัวเลขด้านบนเป็นการพรีวิว กด “บันทึกการเปลี่ยนแปลง” เพื่อใช้ค่านี้จริง
            </Text>
          )}
        </Card>

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
                if (saved) setSaved(false);
              }}
              accessibilityLabel="น้ำหนักปัจจุบัน หน่วยกิโลกรัม"
            />
            <Text style={[styles.inputHint, !weightValid && styles.inputHintError]}>
              {weightValid ? 'กรอกเป็นตัวเลข เช่น 62.5' : 'กรอกน้ำหนักระหว่าง 20–400 กก.'}
            </Text>
          </View>
        </Card>

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
                  if (saved) setSaved(false);
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

        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>เป้าหมายน้ำหนัก</Text>
          <Text style={styles.sectionHint}>
            ระบบจะปรับแคลอรี่เป้าหมายให้เหมาะกับเป้าหมายที่เลือก โดยไม่ต่ำกว่า 1,200 kcal ต่อวัน
          </Text>
          {GOALS.map((item, index) => {
            const active = goal === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setGoal(item.key);
                  if (saved) setSaved(false);
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

        <PrimaryButton
          title={saved ? 'บันทึกแล้ว' : 'บันทึกการเปลี่ยนแปลง'}
          icon={saved ? 'checkmark' : undefined}
          onPress={save}
          loading={saving}
          disabled={!weightValid}
          style={{ marginTop: spacing.lg }}
        />
        {!!activeActivity && (
          <Text style={[styles.dangerHint, { marginTop: spacing.sm }]}>
            ระดับกิจกรรมปัจจุบัน: {activeActivity.label}
          </Text>
        )}

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

        <View style={styles.dangerZone}>
          <Pressable
            onPress={confirmLogout}
            accessibilityRole="button"
            accessibilityLabel="ออกจากระบบ"
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.secondaryBtnText}>ออกจากระบบ</Text>
          </Pressable>
          <Pressable
            onPress={confirmReset}
            accessibilityRole="button"
            accessibilityLabel="ล้างข้อมูลทั้งหมด"
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md }}
          >
            <Text style={styles.resetText}>ล้างข้อมูลทั้งหมด</Text>
          </Pressable>
          <Text style={styles.dangerHint}>
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
