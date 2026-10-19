import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '../AppText';
import { TextInput } from '../AppTextInput';
import styles from '../../style/screens/AdminScreenStyles';
import { colors } from '../../theme/colors';
import { Title, Stat, Card, Badge, formatDate, adminRequest } from './AdminCommon';

const SCAN_STATUS = {
  success: { label: 'Success', color: 'green' },
  low_conf: { label: 'Low Conf', color: 'blue' },
  no_food: { label: 'No Food', color: 'blue' },
  failed: { label: 'Failed', color: 'red' },
};

function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${formatDate(d)} ${time}`;
}

export default function AiScan({ token }) {
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState('');
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminRequest('/admin/scan-logs?limit=20', token);
      setLogs(data.logs || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err.message || 'โหลดประวัติการสแกนไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const applyConfig = (data) => {
    setConfig((prev) => ({ ...prev, ...data }));
    setModel(data.model);
    setPrompt(data.prompt);
  };

  const loadConfig = useCallback(async () => {
    setConfigError('');
    try {
      applyConfig(await adminRequest('/admin/ai-scan-config', token));
    } catch (err) {
      setConfigError(err.message || 'โหลดการตั้งค่าไม่สำเร็จ');
    }
  }, [token]);

  const saveConfig = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      applyConfig(await adminRequest('/admin/ai-scan-config', token, {
        method: 'PUT',
        body: JSON.stringify({ model, prompt }),
      }));
      setSaveMessage('บันทึกแล้ว ใช้กับการสแกนครั้งถัดไป');
    } catch (err) {
      setSaveMessage(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = !!config && (model !== config.model || prompt.trim() !== config.prompt.trim());

  useEffect(() => {
    if (token) {
      loadLogs();
      loadConfig();
    }
  }, [token, loadLogs, loadConfig]);

  return (
    <>
      <Title name="AI Scan Monitoring" detail="มอนิเตอร์ประสิทธิภาพ Gemini API และการประมวลผลภาพ" />

      <View style={styles.grid}>
        <Stat icon="⚡" value={stats?.avgLatencyMs == null ? null : `${stats.avgLatencyMs.toLocaleString()} ms`} label="Avg Latency (24h)" tone="green" />
        <Stat icon="🎯" value={stats?.successRate == null ? null : `${(stats.successRate * 100).toFixed(1)}%`} label="Success Rate (24h)" tone="blue" />
        <Stat icon="📊" value={stats ? stats.tokens.toLocaleString() : null} label="Tokens (24h)" tone="tan" />
        <Stat icon="⚠️" value={stats ? stats.failed.toLocaleString() : null} label="Failed Scans (24h)" tone="coral" />
      </View>

      <Card style={{ marginTop: 16, flexBasis: 'auto' }}>
        <Text style={styles.sectionTitle}>Gemini Model Setup</Text>
        <Text style={styles.detail}>เลือกโมเดลหลักที่ใช้ในการประมวลผลรูปภาพอาหาร</Text>
        {!config && !configError && <ActivityIndicator color={colors.primary} style={{ paddingVertical: 18 }} />}
        {configError ? <Text style={styles.error}>{configError}</Text> : null}

        {config && (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 12 }}>
              {config.models.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { setModel(m); setSaveMessage(''); }}
                  style={[styles.primarySmall, { paddingVertical: 10, backgroundColor: model === m ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: model === m ? colors.white : colors.ink, fontWeight: 'bold' }}>{m}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.footnote}>โมเดลอื่นในรายการจะถูกใช้เป็นตัวสำรองอัตโนมัติเมื่อโมเดลหลักใช้งานไม่ได้</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <Text style={styles.sectionTitle}>System Prompt Config</Text>
              <Pressable onPress={() => { setPrompt(config.defaultPrompt); setSaveMessage(''); }}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>ใช้ค่าเริ่มต้น</Text>
              </Pressable>
            </View>
            <Text style={styles.detail}>คำสั่งที่ส่งให้ Gemini พร้อมรูป รูปแบบ JSON ของผลลัพธ์ถูกกำหนดไว้ในเซิร์ฟเวอร์และแก้ที่นี่ไม่ได้</Text>
            <TextInput
              value={prompt}
              onChangeText={(text) => { setPrompt(text); setSaveMessage(''); }}
              multiline
              numberOfLines={6}
              maxLength={4000}
              style={[styles.formInput, styles.formInputStacked, { height: 140, marginTop: 8, textAlignVertical: 'top' }]}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <Pressable
                onPress={saveConfig}
                disabled={!isDirty || saving}
                style={[styles.primarySmall, { paddingVertical: 10, opacity: !isDirty || saving ? 0.5 : 1 }]}
              >
                <Text style={styles.primaryText}>{saving ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่า'}</Text>
              </Pressable>
              {saveMessage ? <Text style={styles.detail}>{saveMessage}</Text> : null}
            </View>
          </>
        )}
      </Card>

      <Card style={{ marginTop: 16, flexBasis: 'auto' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>Recent Scan Audit Log</Text>
          <Pressable onPress={loadLogs} disabled={loading}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>รีเฟรช</Text>
          </Pressable>
        </View>
        <View style={styles.tableHead}>
          <Text style={styles.tableCell}>Time / Input</Text>
          <Text style={styles.tableCell}>AI Prediction</Text>
          <Text style={styles.tableCell}>Confidence</Text>
          <Text style={styles.tableCell}>Status</Text>
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ paddingVertical: 18 }} />}
        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && logs.length === 0 && (
          <Text style={styles.emptyText}>ยังไม่มีประวัติการสแกน</Text>
        )}

        {!loading && logs.map((log) => {
          const badge = SCAN_STATUS[log.status] || SCAN_STATUS.failed;
          const prediction = log.items?.length
            ? log.items.map((item) => item.name_th).join(', ')
            : log.error || '-';
          return (
            <View key={log._id} style={styles.tableRow}>
              <Text style={styles.tableCell}>
                {formatDateTime(log.createdAt)}
                {'\n'}
                {log.mimeType || '-'}{log.model ? ` · ${log.model}` : ''}
              </Text>
              <Text style={[styles.tableCell, styles.strong]} numberOfLines={2}>{prediction}</Text>
              <Text style={styles.tableCell}>
                {log.topConfidence == null ? '-' : `${Math.round(log.topConfidence * 100)}%`}
              </Text>
              <Text style={styles.tableCell}><Badge color={badge.color}>{badge.label}</Badge></Text>
            </View>
          );
        })}
      </Card>
    </>
  );
}