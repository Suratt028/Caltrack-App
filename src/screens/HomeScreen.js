import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import Card from '../components/Card';
import FoodItemRow from '../components/FoodItemRow';
import PrimaryButton from '../components/PrimaryButton';
import { todayKey } from '../utils/calculations';
import styles from '../style/screens/HomeScreenStyles';


const MEAL_LABEL = { breakfast: 'มื้อเช้า', lunch: 'มื้อเที่ยง', dinner: 'มื้อเย็น', snack: 'ของว่าง' };

export default function HomeScreen({ navigation }) {
  const { profile, getDayTotals, logsByDay, removeFoodLog } = useApp();
  const totals = getDayTotals();
  const todayEntries = logsByDay[todayKey()] || [];

  const dateLabel = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>วันนี้</Text>
        <Text style={styles.dateTitle}>{dateLabel}</Text>

        <Card style={styles.ringCard}>
          <CalorieRing consumed={totals.kcal} goal={profile.calorieGoal} />
          <View style={styles.ringFooter}>
            <View style={styles.ringStat}>
              <Text style={styles.ringStatValue}>{Math.round(totals.kcal)}</Text>
              <Text style={styles.ringStatLabel}>บริโภคแล้ว</Text>
            </View>
            <View style={styles.ringStatDivider} />
            <View style={styles.ringStat}>
              <Text style={styles.ringStatValue}>{profile.calorieGoal}</Text>
              <Text style={styles.ringStatLabel}>เป้าหมาย (kcal)</Text>
            </View>
          </View>
        </Card>

        <View style={styles.actionsRow}>
          <PrimaryButton title="+ บันทึกอาหาร" onPress={() => navigation.navigate('Log')} style={{ flex: 1, marginRight: spacing.sm }} />
          <PrimaryButton title="📷 สแกนด้วย AI" variant="outline" onPress={() => navigation.navigate('Scan')} style={{ flex: 1 }} />
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>สารอาหารวันนี้</Text>
          <MacroBar label="โปรตีน" consumed={totals.protein} goal={profile.macroGoals.protein} color={colors.protein} />
          <MacroBar label="คาร์โบไฮเดรต" consumed={totals.carbs} goal={profile.macroGoals.carbs} color={colors.carbs} />
          <MacroBar label="ไขมัน" consumed={totals.fat} goal={profile.macroGoals.fat} color={colors.fat} />
        </Card>

        <View style={styles.mealsHeader}>
          <Text style={styles.sectionTitle}>มื้ออาหารวันนี้ ({todayEntries.length})</Text>
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


