import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/colors';
import { searchFood } from '../services/foodService';
import { useApp } from '../context/AppContext';
import FoodItemRow from '../components/FoodItemRow';
import PrimaryButton from '../components/PrimaryButton';
import styles from '../style/screens/LogScreenStyles';


const MEALS = [
  { key: 'breakfast', label: 'มื้อเช้า' },
  { key: 'lunch', label: 'มื้อเที่ยง' },
  { key: 'dinner', label: 'มื้อเย็น' },
  { key: 'snack', label: 'ของว่าง' },
];

export default function LogScreen() {
  const { addFoodLog } = useApp();
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [servings, setServings] = useState('1');
  const [meal, setMeal] = useState('lunch');
  const [saved, setSaved] = useState(false);

  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await searchFood(query);
      if (!cancelled) setResults(data);
    })();
    return () => { cancelled = true; };
  }, [query]);

  const openFood = (food) => {
    setSelectedFood(food);
    setServings('1');
    setSaved(false);
  };

  const closeModal = () => setSelectedFood(null);

  const confirmAdd = async () => {
    const mult = Number(servings) || 1;
    await addFoodLog({
      name: selectedFood.name,
      meal,
      kcal: selectedFood.kcal * mult,
      protein: selectedFood.protein * mult,
      carbs: selectedFood.carbs * mult,
      fat: selectedFood.fat * mult,
      servings: mult,
    });
    setSaved(true);
    setTimeout(() => setSelectedFood(null), 500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>บันทึกอาหาร</Text>
        <TextInput
          style={styles.search}
          placeholder="ค้นหาเมนู เช่น กะเพรา, ไก่ย่าง, ข้าวกล้อง"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <FoodItemRow
            name={item.name}
            subtitle={`${item.nameEn} · ${item.serving}`}
            kcal={item.kcal}
            onPress={() => openFood(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>ไม่พบเมนูที่ค้นหา ลองคำอื่นดูนะ</Text>}
      />

      <Modal visible={!!selectedFood} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedFood && (
              <>
                <Text style={styles.modalTitle}>{selectedFood.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedFood.nameEn} · 1 หน่วย = {selectedFood.serving}</Text>

                <Text style={styles.fieldLabel}>จำนวนหน่วยบริโภค</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={servings}
                  onChangeText={setServings}
                />

                <Text style={styles.fieldLabel}>มื้ออาหาร</Text>
                <View style={styles.mealRow}>
                  {MEALS.map((m) => (
                    <Pressable
                      key={m.key}
                      onPress={() => setMeal(m.key)}
                      style={[styles.mealChip, meal === m.key && styles.mealChipActive]}
                    >
                      <Text style={[styles.mealChipText, meal === m.key && styles.mealChipTextActive]}>{m.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryKcal}>
                    {Math.round(selectedFood.kcal * (Number(servings) || 0))} kcal
                  </Text>
                  <Text style={styles.summaryMacro}>
                    P {Math.round(selectedFood.protein * (Number(servings) || 0))}g · C{' '}
                    {Math.round(selectedFood.carbs * (Number(servings) || 0))}g · F{' '}
                    {Math.round(selectedFood.fat * (Number(servings) || 0))}g
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <PrimaryButton title="ยกเลิก" variant="outline" onPress={closeModal} style={{ flex: 1, marginRight: spacing.sm }} />
                  <PrimaryButton title={saved ? 'บันทึกแล้ว ✓' : 'บันทึก'} onPress={confirmAdd} style={{ flex: 1 }} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


