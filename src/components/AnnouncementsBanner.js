import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { fetchWithTimeout } from '../services/atlasService';
import NoticeCard from './NoticeCard';

// Admin notices that should be visible now (planned maintenance, app updates…).
// Refreshed every 5 minutes; a closed notice stays closed until the admin edits it.
const DISMISSED_KEY = 'caltrack-dismissed-notices';
const REFRESH_MS = 5 * 60 * 1000;
const dismissKey = (notice) => `${notice.id}:${notice.updatedAt || ''}`;

export async function fetchActiveAnnouncements() {
  const response = await fetchWithTimeout(`${API_BASE_URL}/announcements`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'โหลดประกาศไม่สำเร็จ');
  return Array.isArray(payload.announcements) ? payload.announcements : [];
}

export default function AnnouncementsBanner({ style }) {
  const [notices, setNotices] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  const load = useCallback(() => {
    fetchActiveAnnouncements()
      .then(setNotices)
      .catch(() => {}); // Notices are optional; never block Home on them.
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((raw) => setDismissed(raw ? JSON.parse(raw) : []))
      .catch(() => {});
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const dismiss = (notice) => {
    const next = [...dismissed.filter((key) => !key.startsWith(`${notice.id}:`)), dismissKey(notice)].slice(-50);
    setDismissed(next);
    AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
  };

  const visible = notices.filter((notice) => !dismissed.includes(dismissKey(notice)));
  if (visible.length === 0) return null;
  return (
    <View style={[{ gap: 8, marginBottom: 16 }, style]}>
      {visible.map((notice) => (
        <NoticeCard key={notice.id} notice={notice} onDismiss={() => dismiss(notice)} />
      ))}
    </View>
  );
}
