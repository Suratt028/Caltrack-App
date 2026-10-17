import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { registerLocalUser, loginLocalUser } from './localAuth';

function shouldUseLocalAuth() {
  const mode = typeof process !== 'undefined' && process.env ? (process.env.EXPO_PUBLIC_AUTH_MODE || process.env.AUTH_MODE || '').toLowerCase() : '';
  return mode === 'local' || mode === 'mock' || mode === 'offline';
}

function isAtlasUnavailableError(error) {
  const message = String(error?.message || error || '');
  return (
    message.includes('fetch failed') ||
    message.includes('timed out') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('Failed to connect') ||
    message.includes('Network request failed') ||
    message.includes('Request failed')
  );
}

async function requestJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('เชื่อมต่อเซิร์ฟเวอร์นานเกินไป กรุณาตรวจสอบว่าเปิด Backend และอยู่เครือข่ายเดียวกัน');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export async function registerUser(email, password, displayName) {
  try {
    const payload = await requestJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    return payload.user;
  } catch (error) {
    if (!shouldUseLocalAuth() && !isAtlasUnavailableError(error)) {
      throw error;
    }

    return registerLocalUser({ email, password, displayName, storage: AsyncStorage });
  }
}

export async function loginUser(email, password) {
  try {
    const payload = await requestJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return payload.user;
  } catch (error) {
    if (!shouldUseLocalAuth() && !isAtlasUnavailableError(error)) {
      throw error;
    }

    return loginLocalUser({ email, password, storage: AsyncStorage });
  }
}

export async function saveProfile(userId, profile) {
  const payload = await requestJson(`/profiles/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
  return payload.profile;
}

export async function fetchProfile(userId) {
  const payload = await requestJson(`/profiles/${userId}`);
  return payload.profile;
}

export async function deleteProfile(userId) {
  const payload = await requestJson(`/profiles/${userId}`, { method: 'DELETE' });
  return payload.profile;
}

export async function fetchLogs(userId) {
  const payload = await requestJson(`/logs/${userId}`);
  return payload.logs || [];
}

export async function saveLog(userId, log) {
  const payload = await requestJson(`/logs/${userId}`, {
    method: 'POST',
    body: JSON.stringify(log),
  });
  return payload.log;
}

export async function updateLog(userId, logId, updates) {
  const payload = await requestJson(`/logs/${userId}/${logId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return payload.log;
}

export async function deleteLog(userId, logId) {
  const payload = await requestJson(`/logs/${userId}/${logId}`, { method: 'DELETE' });
  return payload.log;
}

export async function submitTicket({ userId, userEmail, topic, detail }) {
  const payload = await requestJson('/tickets', {
    method: 'POST',
    body: JSON.stringify({ userId, userEmail, topic, detail }),
  });
  return payload.ticket;
}

export async function fetchTickets(userEmail) {
  const path = userEmail ? `/tickets?email=${encodeURIComponent(userEmail)}` : '/tickets';
  const payload = await requestJson(path);
  return payload.tickets || [];
}

export async function updateTicketStatus(ticketId, status) {
  const payload = await requestJson(`/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return payload.ticket;
}

export async function deleteTicket(ticketId) {
  const payload = await requestJson(`/tickets/${ticketId}`, { method: 'DELETE' });
  return payload;
}

