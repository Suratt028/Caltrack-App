import React, { useEffect, useState } from 'react';
import { View, Switch, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '../AppText';
import { TextInput } from '../AppTextInput';
import styles from '../../style/screens/AdminScreenStyles';
import { colors } from '../../theme/colors';
import { Title, Card, adminRequest } from './AdminCommon';

export default function Settings({ token }) {
  const [saved, setSaved] = useState(null);
  const [maxFreeScans, setMaxFreeScans] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const apply = (data) => {
    setSaved(data);
    setMaxFreeScans(String(data.maxFreeScansPerDay));
    setMaintenanceMode(data.maintenanceMode);
  };

  useEffect(() => {
    if (!token) return;
    adminRequest('/admin/system-settings', token)
      .then(apply)
      .catch((err) => setLoadError(err.message || 'โหลดการตั้งค่าไม่สำเร็จ'));
  }, [token]);

  const quota = Number(maxFreeScans);
  const quotaValid = /^\d+$/.test(maxFreeScans.trim()) && quota <= 1000;
  const isDirty = !!saved && (quota !== saved.maxFreeScansPerDay || maintenanceMode !== saved.maintenanceMode);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      apply(await adminRequest('/admin/system-settings', token, {
        method: 'PUT',
        body: JSON.stringify({ maxFreeScansPerDay: quota, maintenanceMode }),
      }));
      setMessage('บันทึกแล้ว มีผลภายในประมาณ 15 วินาที');
    } catch (err) {
      setMessage(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Title name="System Settings" detail="ตั้งค่าโควตา สิทธิ์การใช้งาน และการทำงานของระบบ" />

      <Card style={{ marginTop: 16, flexBasis: 'auto' }}>
        {!saved && !loadError && <ActivityIndicator color={colors.primary} style={{ paddingVertical: 18 }} />}
        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

        {saved && (
          <>
            <Text style={styles.sectionTitle}>App Quota & Limits</Text>
            <View style={{ marginVertical: 10 }}>
              <Text style={styles.detail}>จำนวนสแกน AI ต่อวัน / คน (0 = ไม่จำกัด):</Text>
              <TextInput
                value={maxFreeScans}
                onChangeText={(text) => { setMaxFreeScans(text); setMessage(''); }}
                keyboardType="numeric"
                style={[styles.formInput, styles.formInputStacked, { width: 120, marginTop: 6 }]}
              />
              {!quotaValid ? <Text style={[styles.error, { marginTop: 6 }]}>กรอกจำนวนเต็ม 0–1000</Text> : null}
              <Text style={styles.footnote}>
                นับเฉพาะสแกนที่สำเร็จของผู้ใช้ที่ล็อกอิน รีเซ็ตตอนเที่ยงคืนตามเวลาไทย
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16, borderTopWidth: 1, borderColor: colors.border, paddingTop: 16 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.sectionTitle}>Maintenance Mode</Text>
                <Text style={styles.detail}>
                  ปิดแอปชั่วคราว ผู้ใช้จะเห็นข้อความ “ระบบปิดปรับปรุงชั่วคราว” ส่วนหน้าแอดมินยังใช้งานได้
                </Text>
              </View>
              <Switch
                value={maintenanceMode}
                onValueChange={(value) => { setMaintenanceMode(value); setMessage(''); }}
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                style={[styles.primarySmall, { paddingVertical: 10, opacity: !isDirty || !quotaValid || saving ? 0.5 : 1 }]}
                onPress={save}
                disabled={!isDirty || !quotaValid || saving}
              >
                <Text style={styles.primaryText}>{saving ? 'กำลังบันทึก…' : 'Save Settings'}</Text>
              </Pressable>
              {message ? <Text style={styles.detail}>{message}</Text> : null}
            </View>
          </>
        )}
      </Card>
    </>
  );
}
