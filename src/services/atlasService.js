import { API_BASE_URL } from '../config';

// The signed-in user's token, set by AppContext. Sent on every request that
// doesn't bring its own Authorization header (admin calls do).
let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function getAuthToken() {
  return authToken;
}

// Called when the server rejects the user's token (expired or invalid).
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function authHeaders(extra = {}) {
  return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : extra;
}

async function requestJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const usesUserToken = !options.headers?.Authorization && Boolean(authToken);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: options.headers || authHeaders({ 'Content-Type': 'application/json' }),
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
    if (response.status === 401 && usesUserToken && onUnauthorized) onUnauthorized();
    const error = new Error(
      response.status === 401 ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' : payload.error || 'Request failed'
    );
    error.status = response.status;
    throw error;
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

export async function loginWithOAuth(provider, idToken) {
  const payload = await requestJson(`/auth/oauth/${provider}`, {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  return payload.user;
}

export async function startAppleOAuth(returnUri) {
  return requestJson(`/auth/apple/start?returnUri=${encodeURIComponent(returnUri)}`);
}

export async function exchangeAppleOAuthTicket(ticket) {
  const payload = await requestJson('/auth/apple/exchange', {
    method: 'POST',
    body: JSON.stringify({ ticket }),
  });
  return payload.user;
}

export async function saveProfile(userId, profile) {
  const payload = await requestJson(`/profiles/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...profile,
      name: profile.name || profile.displayName,
      kcalGoal: profile.kcalGoal ?? profile.calorieGoal,
      proteinGoal: profile.proteinGoal ?? profile.macroGoals?.protein,
      carbsGoal: profile.carbsGoal ?? profile.macroGoals?.carbs,
      fatGoal: profile.fatGoal ?? profile.macroGoals?.fat,
    }),
  });
  return mapRemoteProfile(payload.profile);
}

export async function fetchProfile(userId) {
  const payload = await requestJson(`/profiles/${userId}`);
  return mapRemoteProfile(payload.profile);
}

export function mapRemoteProfile(profile) {
  if (!profile) return null;
  const calorieGoal = Number(profile.kcalGoal ?? profile.calorieGoal);
  const protein = Number(profile.proteinGoal ?? profile.macroGoals?.protein);
  const carbs = Number(profile.carbsGoal ?? profile.macroGoals?.carbs);
  const fat = Number(profile.fatGoal ?? profile.macroGoals?.fat);
  return {
    ...profile,
    displayName: profile.displayName || profile.name || '',
    ...(Number.isFinite(calorieGoal) && calorieGoal > 0
      ? {
          calorieGoal,
          macroGoals: {
            protein: Number.isFinite(protein) ? protein : 0,
            carbs: Number.isFinite(carbs) ? carbs : 0,
            fat: Number.isFinite(fat) ? fat : 0,
          },
        }
      : {}),
  };
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

export async function fetchWeights(userId) {
  const payload = await requestJson(`/weights/${userId}`);
  return payload.weights || [];
}

export async function saveWeight(userId, dateKey, weightKg) {
  const payload = await requestJson(`/weights/${userId}/${dateKey}`, {
    method: 'PUT',
    body: JSON.stringify({ weightKg }),
  });
  return payload.weight;
}

export async function clearUserData(userId) {
  return requestJson(`/users/${userId}/data`, { method: 'DELETE' });
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

const adminHeaders = (adminToken) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${adminToken}`,
});

// The server returns the signed-in user's own tickets.
export async function fetchTickets() {
  const payload = await requestJson('/tickets');
  return payload.tickets || [];
}

// Admin-only: every ticket from every user.
export async function fetchAllTickets(adminToken) {
  const payload = await requestJson('/tickets', { headers: adminHeaders(adminToken) });
  return payload.tickets || [];
}

export async function updateTicketStatus(ticketId, status, adminToken) {
  const payload = await requestJson(`/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'PATCH',
    headers: adminHeaders(adminToken),
    body: JSON.stringify({ status }),
  });
  return payload.ticket;
}

export async function deleteTicket(ticketId, adminToken) {
  const payload = await requestJson(`/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'DELETE',
    headers: adminHeaders(adminToken),
  });
  return payload;
}
