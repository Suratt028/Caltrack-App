import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../AppText';
import styles from '../../style/screens/AdminScreenStyles';
import { colors } from '../../theme/colors';
import { Title, Stat, Card } from './AdminCommon';

export default function Reports({ token }) {
  return (
    <>
      <Title name="Reports & Analytics" detail="รายงานวิเคราะห์พฤติกรรมผู้ใช้และการบริโภคอาหาร" />

      <View style={styles.grid}>
        <Stat icon="👥" value="1,280" label="DAU (Active)" tone="green" />
        <Stat icon="🔥" value="1,850 kcal" label="Avg Daily Intake" tone="tan" />
        <Stat icon="📈" value="+15.4%" label="Monthly Growth" tone="coral" />
      </View>

      <View style={[styles.columns, { marginTop: 16 }]}>
        <Card style={{ flexBasis: 'auto' }}>
          <Text style={styles.sectionTitle}>Top 5 Logged Foods</Text>
          {[
            { name: 'ข้าวมันไก่', count: '1,420 ครั้ง' },
            { name: 'กะเพราหมูสับไข่ดาว', count: '1,180 ครั้ง' },
            { name: 'อกไก่นุ่ม', count: '950 ครั้ง' },
            { name: 'กาแฟดำ (ไม่ใส่น้ำตาล)', count: '820 ครั้ง' },
            { name: 'ไข่ต้ม', count: '760 ครั้ง' },
          ].map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
              <Text style={styles.strong}>{index + 1}. {item.name}</Text>
              <Text style={styles.detail}>{item.count}</Text>
            </View>
          ))}
        </Card>

        <Card style={{ flexBasis: 'auto' }}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <Text style={styles.detail}>ดาวน์โหลดข้อมูลดิบสำหรับนำไปวิเคราะห์ต่อใน Excel / PowerBI</Text>
          <View style={{ gap: 10, marginTop: 16 }}>
            <Pressable style={styles.primarySmall}>
              <Text style={styles.primaryText}>Export User Logs (CSV)</Text>
            </Pressable>
            <Pressable style={styles.primarySmall}>
              <Text style={styles.primaryText}>Export Food Database (JSON)</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </>
  );
}