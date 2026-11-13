import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import Card from './Card';
import { colors } from '../theme/colors';
import { weightOutlook, WINDOW_DAYS } from '../utils/weightOutlook';
import styles from '../style/components/WeightOutlookCardStyles';

const kg = (v) => Math.abs(v).toLocaleString('th-TH', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signed = (v) => (Math.abs(v) < 0.05 ? '±0.0' : `${v > 0 ? '+' : '−'}${kg(v)}`);
const fmtKcal = (v) => Math.round(v).toLocaleString('th-TH');

function Scenario({ tone, icon, title, caption, result, startWeight }) {
  // Weight gain is shown in neutral gold, never red: this is information, not a verdict.
  const losing = result.change < -0.05;
  const gaining = result.change > 0.05;
  const chip = losing
    ? { bg: tone === 'primary' ? colors.surface : colors.mint, fg: colors.primary }
    : gaining
      ? { bg: colors.turmericSoft, fg: colors.turmericDark }
      : { bg: colors.surfaceMuted, fg: colors.inkMuted };
  return (
    <View style={[styles.scenario, tone === 'primary' && styles.scenarioPrimary]}>
      <View style={styles.scenarioHead}>
        <Ionicons name={icon} size={18} color={tone === 'primary' ? colors.primary : colors.inkMuted} />
        <Text style={styles.scenarioTitle} numberOfLines={2}>{title}</Text>
      </View>
      <Text style={styles.scenarioWeight}>
        {`≈ ${kg(result.weight)}`}
        <Text style={styles.scenarioUnit}> กก.</Text>
      </Text>
      <View style={[styles.chip, { backgroundColor: chip.bg }]}>
        <Text style={[styles.chipText, { color: chip.fg }]}>{`${signed(result.change)} กก. ใน 4 สัปดาห์`}</Text>
      </View>
      <Text style={styles.scenarioRange}>
        {`ช่วงที่เป็นไปได้ ${kg(startWeight + result.low)}–${kg(startWeight + result.high)} กก.`}
      </Text>
      {!!caption && <Text style={styles.scenarioCaption}>{caption}</Text>}
    </View>
  );
}

/**
 * Trends card: "if you log every day" vs "if things stay like the last 14 days",
 * plus a 14-day strip that shows which days had no log.
 */
export default function WeightOutlookCard({ logsByDay, tdee, goalKcal, weightKg, stacked = true, style }) {
  const out = weightOutlook({ logsByDay, tdee, goalKcal, weightKg });
  if (!out) return null;
  const missed = WINDOW_DAYS - out.loggedDays;

  return (
    <Card style={style}>
      <Text style={styles.title}>แนวโน้มน้ำหนัก 4 สัปดาห์</Text>
      <Text style={styles.subtitle}>เทียบระหว่างบันทึกทุกวัน กับแบบที่ผ่านมา · ค่าประมาณจากข้อมูลของคุณ</Text>

      {/* Which of the last 14 days had a log */}
      <View style={styles.stripHead}>
        <Text style={styles.stripLabel}>{`บันทึก ${out.loggedDays} จาก ${WINDOW_DAYS} วันล่าสุด`}</Text>
        {missed > 0 && <Text style={styles.stripMissed}>{`ไม่ได้บันทึก ${missed} วัน`}</Text>}
      </View>
      <View
        style={styles.strip}
        accessible
        accessibilityLabel={`บันทึก ${out.loggedDays} จาก ${WINDOW_DAYS} วันล่าสุด`}
      >
        {out.days.map((day) => (
          <View key={day.dateKey} style={[styles.dot, day.logged ? styles.dotOn : styles.dotOff]} />
        ))}
      </View>

      <View style={[styles.scenarios, !stacked && styles.scenariosRow]}>
        <Scenario
          tone="primary"
          icon="checkmark-circle-outline"
          title="ถ้าบันทึกทุกวัน และทานตามเป้า"
          caption={`เป้า ${fmtKcal(goalKcal)} kcal/วัน`}
          result={out.everyDay}
          startWeight={weightKg}
        />
        {out.asBefore ? (
          <Scenario
            tone="muted"
            icon="time-outline"
            title="ถ้าเป็นแบบ 14 วันที่ผ่านมา"
            caption={`วันที่บันทึกเฉลี่ย ${fmtKcal(out.avgLoggedKcal)} kcal`}
            result={out.asBefore}
            startWeight={weightKg}
          />
        ) : (
          <View style={[styles.scenario, styles.scenarioEmpty]}>
            <Ionicons name="time-outline" size={18} color={colors.inkMuted} />
            <Text style={styles.scenarioCaption}>บันทึกอย่างน้อย 3 วันเพื่อเทียบกับแบบที่ผ่านมา</Text>
          </View>
        )}
      </View>

      <Text style={styles.note}>
        {`คำนวณจากพลังงานที่ใช้ต่อวันประมาณ ${fmtKcal(tdee)} kcal · วันที่ไม่ได้บันทึกนับเท่าพลังงานที่ใช้ เพราะไม่รู้ว่าทานไปเท่าไร · ค่าประมาณ ไม่ใช่คำแนะนำทางการแพทย์`}
      </Text>
    </Card>
  );
}
