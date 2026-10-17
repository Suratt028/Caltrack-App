import React, { useState } from 'react';
import { View, Text, TextInput, Switch, Pressable } from 'react-native';
import styles from '../../style/screens/AdminScreenStyles';
import { Title, Card } from './AdminCommon';

export default function Settings({ token }) {
  const [maxFreeScans, setMaxFreeScans] = useState('5');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <>
      <Title name="System Settings" detail="ตั้งค่าโควตา สิทธิ์การใช้งาน และการทำงานของระบบ" />

      <Card style={{ marginTop: 16, flexBasis: 'auto' }}>
        <Text style={styles.sectionTitle}>App Quota & Limits</Text>
        <View style={{ marginVertical: 10 }}>
          <Text style={styles.detail}>จำนวนสแกนฟรีต่อวัน / คน (Free Tier):</Text>
          <TextInput
            value={maxFreeScans}
            onChangeText={setMaxFreeScans}
            keyboardType="numeric"
            style={[styles.formInput, { width: 120, marginTop: 6 }]}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16, borderTopWidth: 1, borderColor: '#EEE', paddingTop: 16 }}>
          <View>
            <Text style={styles.sectionTitle}>Maintenance Mode</Text>
            <Text style={styles.detail}>ปิดระบบชั่วคราวเพื่อปรับปรุงระบบ</Text>
          </View>
          <Switch value={maintenanceMode} onValueChange={setMaintenanceMode} />
        </View>

        <Pressable style={[styles.primarySmall, { alignSelf: 'flex-start' }]}>
          <Text style={styles.primaryText}>Save Settings</Text>
        </Pressable>
      </Card>
    </>
  );
}