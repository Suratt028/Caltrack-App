import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { Text } from '../components/AppText';
import { TextInput } from '../components/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { submitTicket, fetchTickets } from '../services/atlasService';
import styles from '../style/screens/ReportScreenStyle';

export default function ReportScreen({ onClose }) {
  const { user } = useApp();
  const [topic, setTopic] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadUserTickets = async () => {
    if (!user?.email) {
      setLoadingTickets(false);
      return;
    }
    setLoadingTickets(true);
    try {
      const userTickets = await fetchTickets();
      setTickets(userTickets);
    } catch (err) {
      console.warn('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadUserTickets();
  }, [user]);

  const handleSubmit = async () => {
    if (!topic.trim()) {
      const msg = 'กรุณาระบุหัวข้อปัญหาที่ต้องการแจ้ง';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('ข้อผิดพลาด', msg);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await submitTicket({
        userId: user?.id || '',
        userEmail: user?.email || 'guest@caltrack.app',
        topic: topic.trim(),
        detail: detail.trim(),
      });

      const successMsg = 'ส่งรายงานปัญหาเรียบร้อยแล้ว ทีมงานจะดำเนินการตรวจสอบให้โดยเร็วที่สุด';
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert('สำเร็จ', successMsg);

      setTopic('');
      setDetail('');
      await loadUserTickets();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    let bgColor = colors.warnBg;
    let textColor = colors.carbStrong;
    let label = 'รอการตรวจสอบ';

    if (status === 'In Progress') {
      bgColor = colors.skySoft;
      textColor = colors.skyDark;
      label = 'กำลังดำเนินการ';
    } else if (status === 'Resolved') {
      bgColor = colors.mint;
      textColor = colors.primaryDark;
      label = 'แก้ไขเรียบร้อยแล้ว';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {onClose ? (
          <Pressable
            onPress={onClose}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับไปหน้าโปรไฟล์"
          >
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
        ) : null}
        <Text style={styles.title}>รายงานปัญหา / แจ้งข้อเสนอแนะ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.sectionTitle}>ส่งรายงานปัญหาใหม่</Text>
          
          <Text style={styles.label}>หัวข้อเรื่อง *</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น สแกนอาหารแล้วแคลอรีไม่ตรง, ระบบมีปัญหา"
            value={topic}
            onChangeText={setTopic}
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>รายละเอียดเพิ่มเติม</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="อธิบายรายละเอียดหรือขั้นตอนการเกิดปัญหาเพิ่มเติม..."
            value={detail}
            onChangeText={setDetail}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <PrimaryButton
            title={submitting ? 'กำลังส่ง...' : 'ส่งรายงานปัญหา'}
            onPress={handleSubmit}
            disabled={submitting}
            style={{ marginTop: spacing.lg }}
          />
        </Card>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>ประวัติการแจ้งปัญหาของคุณ</Text>

          {loadingTickets ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : tickets.length === 0 ? (
            <Text style={styles.emptyText}>คุณยังไม่มีประวัติการแจ้งปัญหา</Text>
          ) : (
            tickets.map((t) => (
              <View key={t._id || t.ticketId} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketId}>{t.ticketId || 'TK-REPORT'}</Text>
                  {getStatusBadge(t.status)}
                </View>
                <Text style={styles.ticketTopic}>{t.topic}</Text>
                {t.detail ? <Text style={styles.ticketDetail}>{t.detail}</Text> : null}
                <Text style={styles.ticketDate}>
                  {new Date(t.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
