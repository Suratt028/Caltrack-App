import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Text } from '../AppText';
import styles from '../../style/screens/AdminScreenStyles';
import { colors } from '../../theme/colors';
import { API_BASE_URL } from '../../config';
import { Title, Stat, Card, adminRequest, notify } from './AdminCommon';

const EXPORTS = [
  { key: 'logs', label: 'Export User Logs (CSV)', path: '/admin/export/user-foods.csv', filename: 'caltrack-user-logs.csv' },
  { key: 'foods', label: 'Export Food Database (JSON)', path: '/admin/export/foods.json', filename: 'caltrack-foods.json' },
];

function formatGrowth(pct) {
  if (pct == null) return null;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export default function Reports({ token }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(token));
  const [exporting, setExporting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await adminRequest('/admin/reports', token));
    } catch (err) {
      setError(err.message || 'โหลดรายงานไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  // The export needs the admin token header, so fetch it and save the blob
  // instead of opening the URL directly.
  const runExport = async ({ key, path, filename }) => {
    if (Platform.OS !== 'web') {
      notify('การ Export ใช้ได้บนหน้าเว็บแอดมินเท่านั้น');
      return;
    }
    setExporting(key);
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Export failed (${response.status})`);
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      notify(err.message || 'Export ไม่สำเร็จ');
    } finally {
      setExporting('');
    }
  };

  const growthHint = report
    ? `ผู้ใช้ใหม่ 30 วัน: ${report.newUsers30d} (ก่อนหน้า ${report.newUsersPrev30d})`
    : '';

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Title name="Reports & Analytics" detail="รายงานวิเคราะห์พฤติกรรมผู้ใช้และการบริโภคอาหาร" />
        </View>
        <Pressable onPress={load} disabled={loading} style={{ padding: 4 }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>รีเฟรช</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !report ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} /> : null}

      <View style={styles.grid}>
        <Stat icon="👥" value={report?.activeUsers24h} label="Active users (24h)" tone="green" />
        <Stat
          icon="🔥"
          value={report?.avgDailyIntakeKcal == null ? null : `${report.avgDailyIntakeKcal.toLocaleString()} kcal`}
          label="Avg daily intake (30 days)"
          tone="tan"
        />
        <Stat icon="📈" value={formatGrowth(report?.userGrowthPct)} label="New-user growth (30 vs prev 30 days)" tone="coral" />
      </View>
      {report ? (
        <Text style={[styles.footnote, { marginTop: 0, marginBottom: 12 }]}>
          {growthHint} · ค่าเฉลี่ยพลังงานคิดจาก {report.userDays30d} วัน-ผู้ใช้ที่มีการบันทึก
        </Text>
      ) : null}

      <View style={[styles.columns, { marginTop: 4 }]}>
        <Card style={{ flexBasis: 'auto' }}>
          <Text style={styles.sectionTitle}>Top 5 Logged Foods (30 days)</Text>
          {report && report.topFoods.length === 0 ? (
            <Text style={styles.emptyText}>ยังไม่มีการบันทึกอาหารใน 30 วันที่ผ่านมา</Text>
          ) : null}
          {(report?.topFoods || []).map((item, index) => (
            <View key={item.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
              <Text style={styles.strong}>{index + 1}. {item.name}</Text>
              <Text style={styles.detail}>{item.count.toLocaleString()} ครั้ง</Text>
            </View>
          ))}
        </Card>

        <Card style={{ flexBasis: 'auto' }}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <Text style={styles.detail}>ดาวน์โหลดข้อมูลดิบสำหรับนำไปวิเคราะห์ต่อใน Excel / PowerBI</Text>
          <View style={{ gap: 10, marginTop: 16 }}>
            {EXPORTS.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.primarySmall, { paddingVertical: 10, opacity: exporting ? 0.6 : 1 }]}
                onPress={() => runExport(item)}
                disabled={!!exporting}
              >
                <Text style={styles.primaryText}>{exporting === item.key ? 'กำลังเตรียมไฟล์…' : item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </View>
    </>
  );
}
