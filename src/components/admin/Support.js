import React, { useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '../AppText';
import styles from '../../style/screens/AdminScreenStyles';
import { colors } from '../../theme/colors';
import { Title, Card, Badge, formatDate, confirmAction, notify } from './AdminCommon';
import { fetchAllTickets, updateTicketStatus, deleteTicket } from '../../services/atlasService';

export default function Support({ token }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchAllTickets(token);
      setTickets(list);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError(err.message || 'ไม่สามารถโหลดรายการตั๋วได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadTickets();
  }, [token]);

  const handleCycleStatus = async (ticket) => {
    const statusCycle = { Open: 'In Progress', 'In Progress': 'Resolved', Resolved: 'Open' };
    const nextStatus = statusCycle[ticket.status] || 'Open';
    try {
      await updateTicketStatus(ticket.ticketId || ticket._id, nextStatus, token);
      await loadTickets();
    } catch (err) {
      notify('เปลี่ยนสถานะไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!(await confirmAction('คุณต้องการลบตั๋วรายงานนี้ใช่หรือไม่?'))) return;
    try {
      await deleteTicket(ticketId, token);
      await loadTickets();
    } catch (err) {
      notify('ลบตั๋วไม่สำเร็จ: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Open') return 'coral';
    if (status === 'In Progress') return 'blue';
    if (status === 'Resolved') return 'green';
    return 'tan';
  };

  return (
    <>
      <Title name="Support & Feedback" detail="จัดการตั๋วแจ้งปัญหาและข้อเสนอแนะจากผู้ใช้" />

      <Card style={{ marginTop: 16, flexBasis: 'auto' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>User Support Tickets ({tickets.length})</Text>
          <Pressable onPress={loadTickets} style={{ padding: 4 }}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>↻ โหลดใหม่</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : tickets.length === 0 ? (
          <Text style={{ color: colors.inkMuted, fontStyle: 'italic', paddingVertical: 12 }}>ยังไม่มีรายงานปัญหาจากผู้ใช้</Text>
        ) : (
          <>
            <View style={styles.tableHead}>
              <Text style={styles.tableCell}>Ticket ID</Text>
              <Text style={styles.tableCell}>User</Text>
              <Text style={styles.tableCell}>Topic & Detail</Text>
              <Text style={styles.tableCell}>Status (Click to change)</Text>
              <Text style={styles.tableCell}>Action</Text>
            </View>

            {tickets.map((t) => (
              <View style={styles.tableRow} key={t._id || t.ticketId}>
                <Text style={styles.tableCell}>{t.ticketId || t._id?.slice(-6)}</Text>
                <Text style={styles.tableCell}>{t.userEmail}</Text>
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.strong}>{t.topic}</Text>
                  {t.detail ? <Text style={{ fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>{t.detail}</Text> : null}
                  <Text style={{ fontSize: 10, color: colors.inkFaint, marginTop: 2 }}>{formatDate(t.createdAt)}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Pressable onPress={() => handleCycleStatus(t)}>
                    <Badge color={getStatusColor(t.status)}>{t.status}</Badge>
                  </Pressable>
                </View>
                <View style={styles.tableCell}>
                  <Pressable onPress={() => handleDelete(t.ticketId || t._id)}>
                    <Text style={styles.delete}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
      </Card>
    </>
  );
}