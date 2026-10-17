import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import styles from '../../style/screens/AdminScreenStyles';
import { Title, Stat, Card, Badge } from './AdminCommon';

export default function AiScan({ token }) {
  const [model, setModel] = useState('gemini-1.5-flash');
  const [prompt, setPrompt] = useState('Analyze food image and return JSON: { foodName, kcal, protein, carb, fat }');

  return (
    <>
      <Title name="AI Scan Monitoring" detail="มอนิเตอร์ประสิทธิภาพ Gemini API และการประมวลผลภาพ" />

      <View style={styles.grid}>
        <Stat icon="⚡" value="240 ms" label="Avg Latency" tone="green" />
        <Stat icon="🎯" value="94.2%" label="Accuracy Rate" tone="blue" />
        <Stat icon="📊" value="12,450" label="Tokens / Day" tone="tan" />
        <Stat icon="⚠️" value="3" label="Failed Scans" tone="coral" />
      </View>

      <Card style={{ marginTop: 16, flexBasis: 'auto' }}>
        <Text style={styles.sectionTitle}>Gemini Model Setup</Text>
        <Text style={styles.detail}>เลือกโมเดลหลักที่ใช้ในการประมวลผลรูปภาพอาหาร</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
          {['gemini-1.5-flash', 'gemini-1.5-pro'].map((m) => (
            <Pressable
              key={m}
              onPress={() => setModel(m)}
              style={[styles.primarySmall, { backgroundColor: model === m ? '#2F8F6B' : '#E0E0E0' }]}
            >
              <Text style={{ color: model === m ? '#FFF' : '#333', fontWeight: 'bold' }}>{m}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>System Prompt Config</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={3}
          style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
        />
        <Pressable style={[styles.primarySmall, { marginTop: 10, alignSelf: 'flex-start' }]}>
          <Text style={styles.primaryText}>Update Prompt</Text>
        </Pressable>
      </Card>

      <Card style={{ marginTop: 16, flexBasis: 'auto' }}>
        <Text style={styles.sectionTitle}>Recent Scan Audit Log</Text>
        <View style={styles.tableHead}>
          <Text style={styles.tableCell}>Image / Input</Text>
          <Text style={styles.tableCell}>AI Prediction</Text>
          <Text style={styles.tableCell}>Confidence</Text>
          <Text style={styles.tableCell}>Status</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>pad_thai.jpg</Text>
          <Text style={[styles.tableCell, styles.strong]}>ผัดไทยกุ้งสด</Text>
          <Text style={styles.tableCell}>96%</Text>
          <Text style={styles.tableCell}><Badge color="green">Success</Badge></Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>unknown_soup.png</Text>
          <Text style={[styles.tableCell, styles.strong]}>ต้มยำกุ้ง</Text>
          <Text style={styles.tableCell}>62%</Text>
          <Text style={styles.tableCell}><Badge color="blue">Low Conf</Badge></Text>
        </View>
      </Card>
    </>
  );
}