// Server state for the signed-in user: profile, food logs and weigh-ins.
// Query definitions plus the write operations, as plain functions so both the
// React hooks (useUserData.js) and AppContext (login/bootstrap) can use them.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryOptions } from '@tanstack/react-query';
import { buildProfileGoals, todayKey } from '../utils/calculations';
import {
  deleteLog,
  fetchLogs,
  fetchProfile,
  fetchWeights,
  mapRemoteProfile,
  saveLog,
  saveProfile,
  saveWeight,
  updateLog,
} from '../services/atlasService';
import {
  applyLogPatch,
  groupLogsByDate,
  groupWeightsByDate,
  isRemoteUser,
  isServerLogId,
  toCompleteProfile,
} from './userDataTransforms';

export const userDataKeys = {
  all: (userId) => ['user', userId ?? null],
  profile: (userId) => ['user', userId ?? null, 'profile'],
  logs: (userId) => ['user', userId ?? null, 'logs'],
  weights: (userId) => ['user', userId ?? null, 'weights'],
};

// Local-only accounts (id "local_…") never fetch: their data lives only in the cache.
export const profileQuery = (user) =>
  queryOptions({
    queryKey: userDataKeys.profile(user?.id),
    queryFn: async () => toCompleteProfile(await fetchProfile(user.id)),
    enabled: isRemoteUser(user),
  });

export const logsQuery = (user) =>
  queryOptions({
    queryKey: userDataKeys.logs(user?.id),
    queryFn: async () => groupLogsByDate(await fetchLogs(user.id)),
    enabled: isRemoteUser(user),
  });

export const weightsQuery = (user) =>
  queryOptions({
    queryKey: userDataKeys.weights(user?.id),
    queryFn: async () => groupWeightsByDate(await fetchWeights(user.id)),
    enabled: isRemoteUser(user),
  });

// Loads everything after sign-in. Never throws: screens show cached/empty data
// and the queries retry on their own.
export function prefetchUserData(queryClient, user) {
  if (!isRemoteUser(user)) return Promise.resolve();
  return Promise.all([
    queryClient.prefetchQuery(profileQuery(user)),
    queryClient.prefetchQuery(logsQuery(user)),
    queryClient.prefetchQuery(weightsQuery(user)),
  ]);
}

// ---- Writes ---------------------------------------------------------------
// Server first, then the cache, so the UI only shows what the server accepted
// (optimistic updates and an offline queue come with the next phase).

export async function completeOnboarding(queryClient, user, rawProfile) {
  const merged = { ...rawProfile, ...buildProfileGoals(rawProfile) };
  const shared = isRemoteUser(user) ? await saveProfile(user.id, merged) : merged;
  const next = mapRemoteProfile(shared) || merged;
  queryClient.setQueryData(userDataKeys.profile(user?.id), next);
}

export async function updateProfile(queryClient, user, patch) {
  const current = queryClient.getQueryData(userDataKeys.profile(user?.id));
  const merged = { ...current, ...patch };
  const hasBodyMetrics = ['age', 'heightCm', 'weightKg'].every(
    (field) => Number.isFinite(Number(merged[field])) && Number(merged[field]) > 0,
  );
  const nextProfile = hasBodyMetrics ? { ...merged, ...buildProfileGoals(merged) } : merged;
  const shared = isRemoteUser(user) ? await saveProfile(user.id, nextProfile) : nextProfile;
  queryClient.setQueryData(userDataKeys.profile(user?.id), mapRemoteProfile(shared) || nextProfile);
}

// Functional update on the latest cached logs, so two quick taps on "+" each
// build on the other's result.
function updateLogsCache(queryClient, user, update) {
  queryClient.setQueryData(userDataKeys.logs(user?.id), (current) => update(current || {}));
}

export async function addFoodLog(queryClient, user, entry, dateKey = todayKey()) {
  const nextEntry = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    time: new Date().toISOString(),
  };
  let savedEntry = nextEntry;
  if (isRemoteUser(user)) {
    const log = await saveLog(user.id, { dateKey, entry: nextEntry, clientId: nextEntry.id });
    if (!log?._id) throw new Error('เซิร์ฟเวอร์ไม่ได้ยืนยันการบันทึกอาหาร กรุณาลองใหม่');
    savedEntry = { ...log.entry, id: String(log._id) };
  }
  updateLogsCache(queryClient, user, (current) => ({
    ...current,
    [dateKey]: [...(current[dateKey] || []), savedEntry],
  }));
}

export async function removeFoodLog(queryClient, user, entryId, dateKey = todayKey()) {
  if (isRemoteUser(user) && isServerLogId(entryId)) {
    await deleteLog(user.id, entryId);
  }
  updateLogsCache(queryClient, user, (current) => ({
    ...current,
    [dateKey]: (current[dateKey] || []).filter((e) => e.id !== entryId),
  }));
}

// patch: any of name, meal, time, servings, unit, grams, kcal, protein, carbs, fat, fiber, sugar, sodium.
export async function updateFoodLog(queryClient, user, entryId, dateKey = todayKey(), patch = {}) {
  let serverEntry = null;
  if (isRemoteUser(user) && isServerLogId(entryId)) {
    const log = await updateLog(user.id, entryId, patch);
    if (!log?._id) throw new Error('เซิร์ฟเวอร์ไม่ได้ยืนยันการแก้ไขอาหาร กรุณาลองใหม่');
    serverEntry = { ...log.entry, id: String(log._id) };
  }
  updateLogsCache(queryClient, user, (current) => ({
    ...current,
    [dateKey]: (current[dateKey] || []).map((e) => {
      if (e.id !== entryId) return e;
      return serverEntry || applyLogPatch(e, patch);
    }),
  }));
}

// Today's weigh-in is also the profile's current weight, so goals stay in step.
// ProfileScreen passes syncProfile: false because it saves the profile itself.
export async function logWeight(queryClient, user, weightKg, dateKey = todayKey(), { syncProfile = true } = {}) {
  if (isRemoteUser(user)) await saveWeight(user.id, dateKey, weightKg);
  queryClient.setQueryData(userDataKeys.weights(user?.id), (current) => ({
    ...(current || {}),
    [dateKey]: weightKg,
  }));
  const profile = queryClient.getQueryData(userDataKeys.profile(user?.id));
  if (syncProfile && profile && dateKey === todayKey() && Number(profile.weightKg) !== Number(weightKg)) {
    await updateProfile(queryClient, user, { weightKg });
  }
}

// ---- One-time move from the pre-TanStack AsyncStorage cache ---------------

const LEGACY_GLOBAL_KEYS = {
  profile: '@caltrack/profile',
  logs: '@caltrack/logs',
  weights: '@caltrack/weights',
};

export function legacyUserDataKeys(userId) {
  const prefix = `@caltrack/users/${userId}`;
  return { profile: `${prefix}/profile`, logs: `${prefix}/logs`, weights: `${prefix}/weights` };
}

export const LEGACY_GLOBAL_DATA_KEYS = Object.values(LEGACY_GLOBAL_KEYS);

function parseJson(raw) {
  try {
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

// Seeds the query cache from the old per-user keys (or the even older global
// ones) when the persisted query cache has nothing yet, then deletes them.
// Seeded data is marked stale so the server copy replaces it right away.
export async function migrateLegacyUserCache(queryClient, user) {
  if (!user?.id) return;
  const perUser = legacyUserDataKeys(user.id);
  const keys = [...Object.values(perUser), ...LEGACY_GLOBAL_DATA_KEYS];
  const pairs = await AsyncStorage.multiGet(keys);
  const raw = Object.fromEntries(pairs);
  const pick = (field) => parseJson(raw[perUser[field]]) ?? parseJson(raw[LEGACY_GLOBAL_KEYS[field]]);

  const seed = (queryKey, value) => {
    if (value === undefined || queryClient.getQueryData(queryKey) !== undefined) return;
    queryClient.setQueryData(queryKey, value, { updatedAt: 0 });
  };
  const legacyProfile = pick('profile');
  seed(userDataKeys.profile(user.id), legacyProfile ? toCompleteProfile(mapRemoteProfile(legacyProfile)) : undefined);
  seed(userDataKeys.logs(user.id), pick('logs'));
  seed(userDataKeys.weights(user.id), pick('weights'));

  if (pairs.some(([, value]) => value != null)) await AsyncStorage.multiRemove(keys);
}
