import { API_BASE_URL } from '../config';

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export async function registerUser(email, password, displayName) {
  const payload = await requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  return payload.user;
}

export async function loginUser(email, password) {
  const payload = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return payload.user;
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
