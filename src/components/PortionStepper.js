import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import { TextInput } from './AppTextInput';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/PortionStepperStyles';

/**
 * Portion amount stepper: −/+ adjust by `step`, the number can also be typed.
 * Matches the web PortionStepper (design §6.9).
 */
export default function PortionStepper({
  amount,
  onChange,
  step = 0.5,
  min = 0.5,
  max = 20,
  label = 'จำนวน',
  unit,
}) {
  const [draft, setDraft] = useState(String(amount));

  useEffect(() => {
    setDraft(String(amount));
  }, [amount]);

  const clamp = (value) => Math.min(max, Math.max(min, value));

  const commit = (raw) => {
    const parsed = Number(String(raw).replace(',', '.'));
    const next = Number.isFinite(parsed) ? clamp(parsed) : amount;
    onChange(next);
    setDraft(String(next));
  };

  const stepBy = (delta) => {
    // Avoid floating point dust like 1.2000000000000002
    onChange(clamp(Math.round((amount + delta) * 100) / 100));
  };

  return (
    <View>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View style={styles.stepper}>
        <Pressable
          onPress={() => stepBy(-step)}
          disabled={amount <= min}
          accessibilityRole="button"
          accessibilityLabel="ลดจำนวน"
          accessibilityState={{ disabled: amount <= min }}
          hitSlop={6}
          style={({ pressed }) => [styles.button, amount <= min && styles.buttonDisabled, pressed && styles.buttonPressed]}
        >
          <Ionicons name="remove" size={22} color={colors.primary} />
        </Pressable>

        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={() => commit(draft)}
          onSubmitEditing={() => commit(draft)}
          keyboardType="decimal-pad"
          returnKeyType="done"
          selectTextOnFocus
          accessibilityLabel="จำนวน"
          style={styles.input}
        />

        <Pressable
          onPress={() => stepBy(step)}
          disabled={amount >= max}
          accessibilityRole="button"
          accessibilityLabel="เพิ่มจำนวน"
          accessibilityState={{ disabled: amount >= max }}
          hitSlop={6}
          style={({ pressed }) => [styles.button, amount >= max && styles.buttonDisabled, pressed && styles.buttonPressed]}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </Pressable>

        {!!unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
}
