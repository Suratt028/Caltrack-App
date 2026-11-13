import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import PrimaryButton from './PrimaryButton';
import { BMI_CATEGORIES } from '../utils/calculations';
import styles from '../style/components/BmiInfoSheetStyles';

const num = (v, digits = 1) => Number(v).toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/**
 * "เข้าใจ BMI ของคุณ" sheet (Figma "คำอธิบาย BMI · แผ่นด้านล่าง"): the formula
 * worked through with the user's own numbers, the Asian adult ranges with the
 * user's zone highlighted, and what BMI can't tell you.
 */
export default function BmiInfoSheet({ visible, onClose, bmi, heightCm, categoryKey, zoneStyles }) {
  const heightM = Number(heightCm) / 100;
  const hasNumbers = Number.isFinite(bmi) && heightM > 0;
  const weightKg = hasNumbers ? bmi * heightM * heightM : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="ปิด" accessibilityRole="button" />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.title} accessibilityRole="header">เข้าใจ BMI ของคุณ</Text>
            <Text style={styles.subtitle}>ค่าประกอบการดูแลตัวเอง ไม่ใช่คำตัดสินสุขภาพ</Text>

            <View style={styles.formula}>
              <Text style={styles.formulaMain}>BMI = น้ำหนัก (กก.) ÷ ส่วนสูง (ม.)²</Text>
              {hasNumbers && (
                <Text style={styles.formulaWorked}>
                  {`${num(weightKg)} ÷ (${num(heightM, 2)} × ${num(heightM, 2)}) ≈ ${num(bmi)}`}
                </Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>ช่วงอ้างอิงสำหรับผู้ใหญ่ตามเกณฑ์เอเชีย</Text>
            <View>
              {BMI_CATEGORIES.map((zone, index) => {
                const active = zone.key === categoryKey;
                const zs = zoneStyles?.[zone.key];
                return (
                  <View
                    key={zone.key}
                    style={[
                      styles.row,
                      index === BMI_CATEGORIES.length - 1 && styles.rowLast,
                      active && { backgroundColor: zs?.soft },
                    ]}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={[styles.dot, { backgroundColor: zs?.fill }]} />
                    <Text style={[styles.rowName, active && { color: zs?.ink, fontWeight: '700' }]}>
                      {zone.label}
                      {active ? '  · คุณ' : ''}
                    </Text>
                    <Text style={[styles.rowRange, active && { color: zs?.ink }]}>{zone.range}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.note}>
              BMI ไม่แยกไขมันกับกล้ามเนื้อ และไม่ใช้ประเมินเด็ก ผู้ตั้งครรภ์ หรือนักกีฬาเพียงอย่างเดียว
              หากมีข้อสงสัย ปรึกษาผู้เชี่ยวชาญด้านสุขภาพ
            </Text>

            <PrimaryButton title="เข้าใจแล้ว" onPress={onClose} style={styles.button} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
