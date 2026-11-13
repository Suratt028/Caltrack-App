import React, { useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '../AppText';
import { TextInput } from '../AppTextInput';
import styles from '../../style/screens/AdminScreenStyles';
import { colors } from '../../theme/colors';
import { Title, Card, Badge, adminRequest } from './AdminCommon';
import { confirmAsync } from '../../utils/confirm';
import NoticeCard from '../NoticeCard';

// Admin → Announcements: schedule a notice (planned maintenance, app update,
// news) for a date and time; users see it from "แจ้งล่วงหน้า" until it ends.

const KINDS = [
  { key: 'maintenance', label: 'ปิดปรับปรุง' },
  { key: 'update', label: 'อัปเดตแอป' },
  { key: 'info', label: 'ข่าวสาร' },
];
const LEADS = [
  { hours: 1, label: '1 ชั่วโมง' },
  { hours: 24, label: '1 วัน' },
  { hours: 72, label: '3 วัน' },
  { hours: 168, label: '1 สัปดาห์' },
];
const STATUS = {
  scheduled: { label: 'รอแจ้ง', color: 'tan' },
  upcoming: { label: 'กำลังแจ้งล่วงหน้า', color: 'blue' },
  live: { label: 'กำลังดำเนินการ', color: 'coral' },
  ended: { label: 'จบแล้ว', color: 'tan' },
  hidden: { label: 'ซ่อนอยู่', color: 'red' },
};

const pad = (n) => String(n).padStart(2, '0');
// Local "YYYY-MM-DD HH:mm" ⇄ Date (admins type Thai local time).
const toInput = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromInput = (text) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})$/.exec(String(text).trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmt = (date) => new Date(date).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function emptyForm() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(22, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { id: null, kind: 'maintenance', title: '', message: '', start: toInput(start), end: toInput(end), leadHours: 24, active: true };
}

function Chips({ options, value, onChange, getKey, getLabel }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
      {options.map((option) => {
        const key = getKey(option);
        const active = key === value;
        return (
          <Pressable
            key={String(key)}
            onPress={() => onChange(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.mint : colors.surface,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: active ? '700' : '400', color: active ? colors.primaryDark : colors.ink }}>
              {getLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Announcements({ token }) {
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = () =>
    adminRequest('/admin/announcements', token)
      .then((data) => setItems(data.announcements || []))
      .catch((err) => setLoadError(err.message || 'โหลดประกาศไม่สำเร็จ'));

  useEffect(() => {
    if (token) load();
  }, [token]);

  const start = fromInput(form.start);
  const end = fromInput(form.end);
  const notifyFrom = start ? new Date(start.getTime() - form.leadHours * 60 * 60 * 1000) : null;
  const formError = !form.title.trim()
    ? 'กรุณาใส่หัวข้อ'
    : !start || !end
      ? 'รูปแบบวันเวลาคือ 2026-11-20 22:00'
      : end <= start
        ? 'เวลาสิ้นสุดต้องหลังเวลาเริ่ม'
        : '';
  const set = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setMessage('');
  };

  const save = async () => {
    if (formError) return;
    setSaving(true);
    setMessage('');
    try {
      const body = JSON.stringify({
        kind: form.kind,
        title: form.title,
        message: form.message,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        notifyFrom: notifyFrom.toISOString(),
        active: form.active,
      });
      await adminRequest(form.id ? `/admin/announcements/${form.id}` : '/admin/announcements', token, {
        method: form.id ? 'PUT' : 'POST',
        body,
      });
      setMessage(form.id ? 'บันทึกการแก้ไขแล้ว' : 'ตั้งประกาศแล้ว ผู้ใช้จะเห็นตามเวลาที่กำหนด');
      setForm(emptyForm());
      await load();
    } catch (err) {
      setMessage(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    const lead = Math.round((new Date(item.startsAt) - new Date(item.notifyFrom)) / (60 * 60 * 1000));
    setForm({
      id: item.id,
      kind: item.kind,
      title: item.title,
      message: item.message || '',
      start: toInput(item.startsAt),
      end: toInput(item.endsAt),
      leadHours: LEADS.some((l) => l.hours === lead) ? lead : 24,
      active: item.active !== false,
    });
    setMessage('');
  };

  const remove = async (item) => {
    if (!(await confirmAsync({ title: `ลบประกาศ "${item.title}" ใช่หรือไม่?`, confirmLabel: 'ลบ' }))) return;
    try {
      await adminRequest(`/admin/announcements/${item.id}`, token, { method: 'DELETE' });
      if (form.id === item.id) setForm(emptyForm());
      await load();
    } catch (err) {
      setMessage(err.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <>
      <Title name="Announcements" detail="แจ้งผู้ใช้ล่วงหน้า เช่น ปิดปรับปรุงระบบหรืออัปเดตแอป ตามวันเวลาที่กำหนด" />

      <Card style={{ marginTop: 16, flexBasis: 'auto' }}>
        <Text style={styles.sectionTitle}>{form.id ? 'แก้ไขประกาศ' : 'ตั้งประกาศใหม่'}</Text>

        <Text style={[styles.detail, { marginTop: 12 }]}>ประเภท</Text>
        <Chips options={KINDS} value={form.kind} onChange={(kind) => set({ kind })} getKey={(k) => k.key} getLabel={(k) => k.label} />

        <Text style={[styles.detail, { marginTop: 12 }]}>หัวข้อ</Text>
        <TextInput
          value={form.title}
          onChangeText={(title) => set({ title })}
          placeholder="เช่น ปิดปรับปรุงระบบชั่วคราว"
          maxLength={80}
          style={[styles.formInput, styles.formInputStacked, { marginTop: 6 }]}
        />

        <Text style={[styles.detail, { marginTop: 12 }]}>รายละเอียด</Text>
        <TextInput
          value={form.message}
          onChangeText={(text) => set({ message: text })}
          placeholder="เช่น ระหว่างนี้จะบันทึกอาหารไม่ได้ ข้อมูลเดิมยังอยู่ครบ"
          maxLength={500}
          multiline
          style={[styles.formInput, styles.formInputStacked, { marginTop: 6, minHeight: 72, textAlignVertical: 'top' }]}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
          <View style={{ minWidth: 220, flex: 1 }}>
            <Text style={styles.detail}>เริ่ม (เวลาไทย)</Text>
            <TextInput
              value={form.start}
              onChangeText={(text) => set({ start: text })}
              placeholder="2026-11-20 22:00"
              style={[styles.formInput, styles.formInputStacked, { marginTop: 6 }]}
            />
          </View>
          <View style={{ minWidth: 220, flex: 1 }}>
            <Text style={styles.detail}>สิ้นสุด (เวลาไทย)</Text>
            <TextInput
              value={form.end}
              onChangeText={(text) => set({ end: text })}
              placeholder="2026-11-20 23:00"
              style={[styles.formInput, styles.formInputStacked, { marginTop: 6 }]}
            />
          </View>
        </View>

        <Text style={[styles.detail, { marginTop: 12 }]}>แจ้งผู้ใช้ล่วงหน้า</Text>
        <Chips options={LEADS} value={form.leadHours} onChange={(leadHours) => set({ leadHours })} getKey={(l) => l.hours} getLabel={(l) => l.label} />
        {notifyFrom ? (
          <Text style={styles.footnote}>{`ผู้ใช้จะเริ่มเห็นประกาศตั้งแต่ ${fmt(notifyFrom)} จนถึง ${end ? fmt(end) : '—'}`}</Text>
        ) : null}

        <Pressable
          onPress={() => set({ active: !form.active })}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.active }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: colors.primary, backgroundColor: form.active ? colors.primary : 'transparent' }} />
          <Text style={styles.detail}>แสดงให้ผู้ใช้เห็น (ยกเลิกเพื่อซ่อนชั่วคราว)</Text>
        </Pressable>

        {/* Preview exactly as users will see it */}
        {form.title.trim() && start && end ? (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.detail, { marginBottom: 6 }]}>ตัวอย่างที่ผู้ใช้จะเห็น</Text>
            <NoticeCard notice={{ kind: form.kind, title: form.title.trim(), message: form.message.trim(), startsAt: start, endsAt: end, status: 'upcoming' }} />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <Pressable
            style={[styles.primarySmall, { paddingVertical: 10, opacity: formError || saving ? 0.5 : 1 }]}
            onPress={save}
            disabled={!!formError || saving}
          >
            <Text style={styles.primaryText}>{saving ? 'กำลังบันทึก…' : form.id ? 'บันทึกการแก้ไข' : 'ตั้งประกาศ'}</Text>
          </Pressable>
          {form.id ? (
            <Pressable onPress={() => setForm(emptyForm())}>
              <Text style={styles.link}>ยกเลิกการแก้ไข</Text>
            </Pressable>
          ) : null}
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          {message ? <Text style={styles.detail}>{message}</Text> : null}
        </View>
      </Card>

      <Card style={{ marginTop: 16, flexBasis: 'auto' }}>
        <Text style={styles.sectionTitle}>ประกาศทั้งหมด</Text>
        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
        {!items && !loadError ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 18 }} /> : null}
        {items && items.length === 0 ? <Text style={styles.emptyText}>ยังไม่มีประกาศ</Text> : null}
        {(items || []).map((item) => {
          const status = STATUS[item.status] || STATUS.scheduled;
          return (
            <View key={item.id} style={styles.tableRow}>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={styles.strong}>{item.title}</Text>
                  <Badge color={status.color}>{status.label}</Badge>
                  <Text style={styles.detail}>{KINDS.find((k) => k.key === item.kind)?.label}</Text>
                </View>
                <Text style={styles.detail}>{`${fmt(item.startsAt)} – ${fmt(item.endsAt)} · แจ้งตั้งแต่ ${fmt(item.notifyFrom)}`}</Text>
              </View>
              <Pressable onPress={() => edit(item)} style={{ paddingHorizontal: 8 }}>
                <Text style={styles.link}>แก้ไข</Text>
              </Pressable>
              <Pressable onPress={() => remove(item)} style={{ paddingHorizontal: 8 }}>
                <Text style={styles.delete}>ลบ</Text>
              </Pressable>
            </View>
          );
        })}
      </Card>
    </>
  );
}
