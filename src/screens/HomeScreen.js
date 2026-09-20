import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import Card from '../components/Card';
import FoodItemRow from '../components/FoodItemRow';
import { calculateMacroGoals, todayKey } from '../utils/calculations';
import styles from '../style/screens/HomeScreenStyles';


const MEAL_LABEL = { breakfast: 'มื้อเช้า', lunch: 'มื้อเที่ยง', dinner: 'มื้อเย็น', snack: 'ของว่าง' };

export default function HomeScreen({ navigation }) {
  const { profile, user, getDayTotals, logsByDay, removeFoodLog } = useApp();
  const rawTotals = getDayTotals() || {};
  const totals = {
    kcal: Number(rawTotals.kcal) || 0,
    protein: Number(rawTotals.protein) || 0,
    carbs: Number(rawTotals.carbs) || 0,
    fat: Number(rawTotals.fat) || 0,
  };
  const calorieGoal = Number(profile?.calorieGoal) || 2000;
  const macroGoals = profile?.macroGoals || calculateMacroGoals(calorieGoal);
  const todayEntries = logsByDay[todayKey()] || [];
  const remaining = Math.max(calorieGoal - totals.kcal, 0);
  const greetingName = user?.displayName || 'คุณ';

  const dateLabel = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>สวัสดีครับ</Text>
            <Text style={styles.greeting}>{greetingName} 👋</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>{greetingName.slice(0, 1)}</Text></View>
        </View>

        <View style={styles.coachCard}>
          <View style={styles.coachMascot}><Text style={styles.coachEmoji}>😊</Text></View>
          <Text style={styles.coachText}>ทำได้ดีมาก! คุณเหลือแคลอรี่อีก {remaining} kcal วันนี้</Text>
        </View>

        <Card style={styles.ringCard}>
          <CalorieRing consumed={totals.kcal} goal={calorieGoal} />
          <Text style={styles.remainingCaption}>{remaining > 0 ? 'จากเป้าหมาย 1,600 kcal' : 'วันนี้เกินเป้าหมายแล้ว'}</Text>
          <View style={styles.macroRow}>
            <View style={[styles.macroChip, styles.primaryChip]}>
              <Text style={styles.macroEmoji}>🥩</Text>
              <Text style={[styles.macroValue, styles.primaryText]}>{Math.round(totals.protein || 0)}g</Text>
              <Text style={styles.macroLabel}>โปรตีน</Text>
            </View>
            <View style={[styles.macroChip, styles.turmericChip]}>
              <Text style={styles.macroEmoji}>🌾</Text>
              <Text style={[styles.macroValue, styles.turmericText]}>{Math.round(totals.carbs || 0)}g</Text>
              <Text style={styles.macroLabel}>คาร์บ</Text>
            </View>
            <View style={[styles.macroChip, styles.skyChip]}>
              <Text style={styles.macroEmoji}>💧</Text>
              <Text style={[styles.macroValue, styles.skyText]}>{Math.round(totals.fat || 0)}g</Text>
              <Text style={styles.macroLabel}>ไขมัน</Text>
            </View>
          </View>
        </Card>

        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] }]}
            onPress={() => navigation.navigate('Log')}
          >
            <Text style={styles.quickIcon}>＋</Text>
            <Text style={styles.quickLabel}>บันทึกอาหาร</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickAction, styles.quickActionAccent, pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] }]}
            onPress={() => navigation.navigate('Scan')}
          >
            <Text style={[styles.quickIcon, styles.quickIconAccent]}>⌾</Text>
            <Text style={[styles.quickLabel, styles.quickLabelAccent]}>สแกนด้วย AI</Text>
          </Pressable>
        </View>

        <Card style={styles.macroCard}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>สารอาหารวันนี้</Text><Text style={styles.sectionHint}>เป้าหมายรายวัน</Text></View>
          <MacroBar label="โปรตีน" consumed={totals.protein} goal={macroGoals.protein} color={colors.protein} />
          <MacroBar label="คาร์โบไฮเดรต" consumed={totals.carbs} goal={macroGoals.carbs} color={colors.carbs} />
          <MacroBar label="ไขมัน" consumed={totals.fat} goal={macroGoals.fat} color={colors.fat} />
        </Card>

        <View style={styles.mealsHeader}>
          <Text style={styles.sectionTitle}>มื้ออาหารวันนี้</Text>
          <Text style={styles.mealCount}>{todayEntries.length} รายการ</Text>
        </View>

        {todayEntries.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>ยังไม่มีรายการอาหารวันนี้ — แตะ "บันทึกอาหาร" เพื่อเริ่มต้น</Text>
          </Card>
        ) : (
          todayEntries
            .slice()
            .reverse()
            .map((e) => (
              <FoodItemRow
                key={e.id}
                name={e.name}
                subtitle={MEAL_LABEL[e.meal] || e.meal}
                kcal={e.kcal}
                onRemove={() => removeFoodLog(e.id)}
              />
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


