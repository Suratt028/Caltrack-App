import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ACTIVITY_LEVELS, GOALS } from '../utils/calculations';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import styles from '../style/screens/ProfileScreenStyles';

export default function ProfileScreen() {
  const { profile, updateProfile, resetAllData, logout, user } = useApp();
  const [weightKg, setWeightKg] = useState(String(profile.weightKg));
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [goal, setGoal] = useState(profile.goal);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await updateProfile({ weightKg: Number(weightKg) || profile.weightKg, activityLevel, goal });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('ล้างข้อมูลทั้งหมดใช่หรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้')) resetAllData();
      return;
    }
    Alert.alert('ล้างข้อมูลทั้งหมด', 'ข้อมูลโปรไฟล์ บันทึกอาหาร และน้ำหนักทั้งหมดจะถูกลบ ไม่สามารถกู้คืนได้', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ล้างข้อมูล', style: 'destructive', onPress: resetAllData },
    ]);
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('ต้องการออกจากระบบใช่หรือไม่?')) logout();
      return;
    }
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>โปรไฟล์</Text>
        <Card>
          <Text style={styles.sectionTitle}>บัญชี</Text>
          <View style={styles.row}>
            <Text style={styles.label}>อีเมล</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
        </Card>
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>ข้อมูลพื้นฐาน</Text>
          <View style={styles.row}><Text style={styles.label}>เพศ</Text><Text style={styles.value}>{profile.gender === 'male' ? 'ชาย' : 'หญิง'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>อายุ</Text><Text style={styles.value}>{profile.age} ปี</Text></View>
          <View style={styles.row}><Text style={styles.label}>ส่วนสูง</Text><Text style={styles.value}>{profile.heightCm} ซม.</Text></View>
          <Text style={[styles.label, { marginTop: spacing.md }]}>น้ำหนักปัจจุบัน (กก.)</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
        </Card>
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>ระดับกิจกรรม</Text>
          {ACTIVITY_LEVELS.map((activity) => (
            <Pressable key={activity.key} onPress={() => setActivityLevel(activity.key)} style={styles.optionRow}>
              <View style={[styles.radio, activityLevel === activity.key && styles.radioActive]} />
              <Text style={styles.optionText}>{activity.label}</Text>
            </Pressable>
          ))}
        </Card>
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>เป้าหมาย</Text>
          {GOALS.map((item) => (
            <Pressable key={item.key} onPress={() => setGoal(item.key)} style={styles.optionRow}>
              <View style={[styles.radio, goal === item.key && styles.radioActive]} />
              <Text style={styles.optionText}>{item.label}</Text>
            </Pressable>
          ))}
        </Card>
        <PrimaryButton title={saved ? 'บันทึกแล้ว ✓' : 'บันทึกการเปลี่ยนแปลง'} onPress={save} style={{ marginTop: spacing.lg }} />
        <Pressable onPress={confirmLogout} style={styles.resetBtn}><Text style={styles.logoutText}>ออกจากระบบ</Text></Pressable>
        <Pressable onPress={confirmReset} style={styles.resetBtn}><Text style={styles.resetText}>ล้างข้อมูลทั้งหมด</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}


