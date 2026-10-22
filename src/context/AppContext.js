import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildProfileGoals, todayKey } from '../utils/calculations';
import {
  clearUserData,
  deleteLog,
  exchangeAppleOAuthTicket,
  fetchLogs,
  fetchProfile,
  fetchWeights,
  loginUser,
  loginWithOAuth,
  mapRemoteProfile,
  registerUser,
  saveLog,
  saveProfile,
  saveWeight,
  setAuthToken,
  setUnauthorizedHandler,
  updateLog,
} from '../services/atlasService';

const STORAGE_KEYS = {
  profile: '@caltrack/profile',
  logs: '@caltrack/logs', // { [dateKey]: FoodLogEntry[] }
  weights: '@caltrack/weights', // { [dateKey]: number }
  user: '@caltrack/user',
  adminToken: '@caltrack/admin-token',
};

const AppContext = createContext(null);

function groupLogsByDate(logs = []) {
  return logs.reduce((acc, log) => {
    const dateKey = log.dateKey || todayKey();
    const entries = acc[dateKey] || [];
    const entry = log.entry || {};
    const macros = entry.macros || {};
    const protein = Number(entry.protein ?? macros.protein) || 0;
    const carbs = Number(entry.carbs ?? entry.carb ?? macros.carbs ?? macros.carb) || 0;
    const fat = Number(entry.fat ?? macros.fat) || 0;
    return {
      ...acc,
      [dateKey]: [
        ...entries,
        {
          ...entry,
          id: String(log._id || entry.id || ''),
          date: entry.date || dateKey,
          meal: entry.meal || entry.mealType || 'snack',
          protein,
          carbs,
          fat,
          macros: { protein, carb: carbs, fat },
        },
      ],
    };
  }, {});
}

// Ids the server assigned (Mongo ObjectIds); local-only entries use "<timestamp>_<random>".
function isServerLogId(entryId) {
  return /^[a-f\d]{24}$/i.test(String(entryId));
}

function isRemoteUser(user) {
  return Boolean(user?.id && !String(user.id).startsWith('local_'));
}

function userDataStorageKeys(userId) {
  const prefix = `@caltrack/users/${userId}`;
  return {
    profile: `${prefix}/profile`,
    logs: `${prefix}/logs`,
    weights: `${prefix}/weights`,
  };
}

function groupWeightsByDate(weights = []) {
  return weights.reduce((acc, item) => {
    if (item?.dateKey && Number.isFinite(Number(item.weightKg))) {
      acc[item.dateKey] = Number(item.weightKg);
    }
    return acc;
  }, {});
}

function hasCompletedOnboarding(profile) {
  return Boolean(
    profile &&
      (profile.gender === 'male' || profile.gender === 'female') &&
      Number.isFinite(Number(profile.age)) &&
      Number(profile.age) >= 1 &&
      Number(profile.age) <= 120 &&
      Number.isFinite(Number(profile.heightCm)) &&
      Number(profile.heightCm) >= 50 &&
      Number(profile.heightCm) <= 250 &&
      Number.isFinite(Number(profile.weightKg)) &&
      Number(profile.weightKg) >= 20 &&
      Number(profile.weightKg) <= 400 &&
      typeof profile.activityLevel === 'string' &&
      profile.activityLevel.length > 0 &&
      typeof profile.goal === 'string' &&
      profile.goal.length > 0
  );
}

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null); // null until onboarding completes
  const [user, setUser] = useState(null);
  const [logsByDay, setLogsByDay] = useState({});
  // Latest logs, updated synchronously so overlapping add/remove/update calls
  // (e.g. two quick taps on "+") each build on the other's result.
  const logsRef = useRef({});
  const setLogs = useCallback((next) => {
    logsRef.current = next;
    setLogsByDay(next);
  }, []);
  const [weightsByDay, setWeightsByDay] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadRemoteData = useCallback(async (userId) => {
    if (!userId) return;

    const [serverProfile, serverLogs, serverWeights] = await Promise.all([
      fetchProfile(userId),
      fetchLogs(userId),
      fetchWeights(userId),
    ]);
    const keys = userDataStorageKeys(userId);
    const groupedLogs = groupLogsByDate(serverLogs);
    const groupedWeights = groupWeightsByDate(serverWeights);
    const completeProfile = hasCompletedOnboarding(serverProfile) ? serverProfile : null;
    setProfile(completeProfile);
    setLogs(groupedLogs);
    setWeightsByDay(groupedWeights);
    await Promise.all([
      completeProfile
        ? AsyncStorage.setItem(keys.profile, JSON.stringify(completeProfile))
        : AsyncStorage.removeItem(keys.profile),
      AsyncStorage.setItem(keys.logs, JSON.stringify(groupedLogs)),
      AsyncStorage.setItem(keys.weights, JSON.stringify(groupedWeights)),
    ]);
  }, [setLogs]);

  // Load persisted state once on app start.
  useEffect(() => {
    (async () => {
      try {
        const rawUser = await AsyncStorage.getItem(STORAGE_KEYS.user);
        const persistedUser = rawUser ? JSON.parse(rawUser) : null;
        const keys = persistedUser?.id ? userDataStorageKeys(persistedUser.id) : STORAGE_KEYS;
        let [rawProfile, rawLogs, rawWeights] = await Promise.all([
          AsyncStorage.getItem(keys.profile),
          AsyncStorage.getItem(keys.logs),
          AsyncStorage.getItem(keys.weights),
        ]);
        if (persistedUser?.id && !rawProfile && !rawLogs && !rawWeights) {
          [rawProfile, rawLogs, rawWeights] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.profile),
            AsyncStorage.getItem(STORAGE_KEYS.logs),
            AsyncStorage.getItem(STORAGE_KEYS.weights),
          ]);
          if (rawProfile || rawLogs || rawWeights) {
            await Promise.all([
              rawProfile ? AsyncStorage.setItem(keys.profile, rawProfile) : Promise.resolve(),
              rawLogs ? AsyncStorage.setItem(keys.logs, rawLogs) : Promise.resolve(),
              rawWeights ? AsyncStorage.setItem(keys.weights, rawWeights) : Promise.resolve(),
              AsyncStorage.multiRemove([
                STORAGE_KEYS.profile,
                STORAGE_KEYS.logs,
                STORAGE_KEYS.weights,
              ]),
            ]);
          }
        }
        if (rawProfile) {
          const cachedProfile = JSON.parse(rawProfile);
          setProfile(hasCompletedOnboarding(cachedProfile) ? cachedProfile : null);
        }
        if (rawLogs) setLogs(JSON.parse(rawLogs));
        if (rawWeights) setWeightsByDay(JSON.parse(rawWeights));
        // Sessions saved before the server issued tokens can't call the API: sign in again.
        if (persistedUser && isRemoteUser(persistedUser) && !persistedUser.token) {
          await AsyncStorage.removeItem(STORAGE_KEYS.user);
        } else if (persistedUser) {
          setAuthToken(persistedUser.token);
          setUser(persistedUser);
        }
      } catch (e) {
        console.warn('Failed to load persisted state', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [setLogs]);

  useEffect(() => {
    if (isRemoteUser(user)) {
      loadRemoteData(user.id).catch((error) => {
        console.warn('Failed to refresh shared account data', error);
      });
    }
  }, [user, loadRemoteData]);

  const persistProfile = useCallback(async (next) => {
    setProfile(next);
    const key = user?.id ? userDataStorageKeys(user.id).profile : STORAGE_KEYS.profile;
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }, [user?.id]);

  const persistUser = useCallback(async (next) => {
    setAuthToken(next?.token);
    if (next?.id !== user?.id) {
      setProfile(null);
      setLogs({});
      setWeightsByDay({});
    }
    setUser(next);
    if (next) {
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
      if (next.id !== user?.id) {
        const keys = userDataStorageKeys(next.id);
        const [rawProfile, rawLogs, rawWeights] = await Promise.all([
          AsyncStorage.getItem(keys.profile),
          AsyncStorage.getItem(keys.logs),
          AsyncStorage.getItem(keys.weights),
        ]);
        if (rawProfile) {
          const cachedProfile = mapRemoteProfile(JSON.parse(rawProfile));
          setProfile(hasCompletedOnboarding(cachedProfile) ? cachedProfile : null);
        }
        if (rawLogs) setLogs(JSON.parse(rawLogs));
        if (rawWeights) setWeightsByDay(JSON.parse(rawWeights));
      }
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.user);
    }
  }, [user?.id, setLogs]);

  // update: (currentLogsByDay) => nextLogsByDay, applied to the latest state.
  const persistLogs = useCallback(async (update) => {
    const next = update(logsRef.current);
    setLogs(next);
    const key = user?.id ? userDataStorageKeys(user.id).logs : STORAGE_KEYS.logs;
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }, [user?.id, setLogs]);

  const persistWeights = useCallback(async (next) => {
    setWeightsByDay(next);
    const key = user?.id ? userDataStorageKeys(user.id).weights : STORAGE_KEYS.weights;
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }, [user?.id]);

  const login = useCallback(async (email, password) => {
    if (!email?.trim() || !password) {
      throw new Error('กรุณากรอกอีเมลและรหัสผ่าน');
    }

    const existingUser = await loginUser(email, password);
    const nextUser = {
      id: existingUser.id,
      email: existingUser.email,
      displayName: existingUser.displayName || displayNameFromEmail(existingUser.email),
      role: existingUser.role || 'user',
      token: existingUser.token,
    };

    await persistUser(nextUser);
    if (existingUser.adminToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.adminToken, existingUser.adminToken);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.adminToken);
    }
    if (isRemoteUser(nextUser)) {
      await loadRemoteData(nextUser.id);
    }
    return nextUser;
  }, [persistUser, loadRemoteData]);

  const register = useCallback(async (email, password, displayName) => {
    if (!email?.trim() || !password) {
      throw new Error('กรุณากรอกอีเมลและรหัสผ่าน');
    }

    const created = await registerUser(email.trim().toLowerCase(), password, displayName?.trim() || displayNameFromEmail(email));
    await persistUser({
      id: created.id,
      email: created.email,
      displayName: created.displayName,
      token: created.token,
    });
    return created;
  }, [persistUser]);

  const finishOAuthLogin = useCallback(async (existingUser) => {
    const nextUser = {
      id: existingUser.id,
      email: existingUser.email,
      displayName: existingUser.displayName || displayNameFromEmail(existingUser.email),
      role: existingUser.role || 'user',
      token: existingUser.token,
    };

    if (nextUser.role === 'admin') {
      throw new Error('ใช้บัญชีผู้ดูแลระบบผ่าน Google หรือ Apple ไม่ได้');
    }

    await persistUser(nextUser);
    await AsyncStorage.removeItem(STORAGE_KEYS.adminToken);
    await AsyncStorage.removeItem('@caltrack/token');
    if (isRemoteUser(nextUser)) {
      await loadRemoteData(nextUser.id);
    }
    return nextUser;
  }, [persistUser, loadRemoteData]);

  const loginWithProvider = useCallback(async (provider, idToken) => {
    const existingUser = await loginWithOAuth(provider, idToken);
    return finishOAuthLogin(existingUser);
  }, [finishOAuthLogin]);

  const loginWithAppleTicket = useCallback(async (ticket) => {
    const existingUser = await exchangeAppleOAuthTicket(ticket);
    return finishOAuthLogin(existingUser);
  }, [finishOAuthLogin]);

  const clearSessionData = useCallback(async () => {
    setAuthToken(null);
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setProfile(null);
    setUser(null);
    setLogs({});
    setWeightsByDay({});
  }, [setLogs]);

  // The server rejected our token (expired after 30 days, or AUTH_SECRET changed).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSessionData().catch((error) => console.warn('Failed to clear expired session', error));
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSessionData]);

  const logout = useCallback(async () => {
    await clearSessionData();
  }, [clearSessionData]);

  const completeOnboarding = useCallback(
    async (rawProfile) => {
      const goals = buildProfileGoals(rawProfile);
      const merged = { ...rawProfile, ...goals };
      const shared = isRemoteUser(user) ? await saveProfile(user.id, merged) : merged;
      const next = mapRemoteProfile(shared) || merged;
      await persistProfile(next);
    },
    [persistProfile, user]
  );

  const updateProfile = useCallback(
    async (patch) => {
      const merged = { ...profile, ...patch };
      const hasBodyMetrics = ['age', 'heightCm', 'weightKg'].every(
        (field) => Number.isFinite(Number(merged[field])) && Number(merged[field]) > 0,
      );
      const nextProfile = hasBodyMetrics
        ? { ...merged, ...buildProfileGoals(merged) }
        : merged;
      const shared = isRemoteUser(user) ? await saveProfile(user.id, nextProfile) : nextProfile;
      await persistProfile(mapRemoteProfile(shared) || nextProfile);
    },
    [profile, persistProfile, user]
  );

  const addFoodLog = useCallback(
    async (entry, dateKey = todayKey()) => {
      const nextEntry = { ...entry, id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, time: new Date().toISOString() };
      let savedEntry = nextEntry;
      if (isRemoteUser(user)) {
        const log = await saveLog(user.id, { dateKey, entry: nextEntry });
        if (!log?._id) throw new Error('เซิร์ฟเวอร์ไม่ได้ยืนยันการบันทึกอาหาร กรุณาลองใหม่');
        savedEntry = { ...log.entry, id: String(log._id) };
      }
      await persistLogs((current) => ({
        ...current,
        [dateKey]: [...(current[dateKey] || []), savedEntry],
      }));
    },
    [persistLogs, user]
  );

  const removeFoodLog = useCallback(
    async (entryId, dateKey = todayKey()) => {
      if (isRemoteUser(user) && isServerLogId(entryId)) {
        await deleteLog(user.id, entryId);
      }
      await persistLogs((current) => ({
        ...current,
        [dateKey]: (current[dateKey] || []).filter((e) => e.id !== entryId),
      }));
    },
    [persistLogs, user]
  );

  // patch: any of name, meal, time, servings, unit, grams, kcal, protein, carbs, fat, fiber, sugar, sodium.
  const updateFoodLog = useCallback(
    async (entryId, dateKey = todayKey(), patch = {}) => {
      let serverEntry = null;
      if (isRemoteUser(user) && isServerLogId(entryId)) {
        const log = await updateLog(user.id, entryId, patch);
        if (!log?._id) throw new Error('เซิร์ฟเวอร์ไม่ได้ยืนยันการแก้ไขอาหาร กรุณาลองใหม่');
        serverEntry = { ...log.entry, id: String(log._id) };
      }
      await persistLogs((current) => ({
        ...current,
        [dateKey]: (current[dateKey] || []).map((e) => {
          if (e.id !== entryId) return e;
          if (serverEntry) return serverEntry;
          const merged = { ...e, ...patch };
          const protein = Number(merged.protein) || 0;
          const carbs = Number(merged.carbs) || 0;
          const fat = Number(merged.fat) || 0;
          return { ...merged, macros: { protein, carb: carbs, fat } };
        }),
      }));
    },
    [persistLogs, user]
  );

  // Today's weigh-in is also the profile's current weight, so goals stay in step.
  // ProfileScreen passes syncProfile: false because it saves the profile itself.
  const logWeight = useCallback(
    async (weightKg, dateKey = todayKey(), { syncProfile = true } = {}) => {
      if (isRemoteUser(user)) await saveWeight(user.id, dateKey, weightKg);
      const next = { ...weightsByDay, [dateKey]: weightKg };
      await persistWeights(next);
      if (syncProfile && profile && dateKey === todayKey() && Number(profile.weightKg) !== Number(weightKg)) {
        await updateProfile({ weightKg });
      }
    },
    [weightsByDay, persistWeights, user, profile, updateProfile]
  );

  const resetAllData = useCallback(async () => {
    if (isRemoteUser(user)) await clearUserData(user.id);
    const dataKeys = user?.id ? Object.values(userDataStorageKeys(user.id)) : [];
    setAuthToken(null);
    await AsyncStorage.multiRemove([...Object.values(STORAGE_KEYS), ...dataKeys]);
    setProfile(null);
    setUser(null);
    setLogs({});
    setWeightsByDay({});
  }, [user, setLogs]);

  const getDayTotals = useCallback(
    (dateKey = todayKey()) => {
      const entries = logsByDay[dateKey] || [];
      return entries.reduce(
        (acc, e) => ({
          kcal: acc.kcal + (Number(e.kcal) || 0),
          protein: acc.protein + (Number(e.protein) || 0),
          carbs: acc.carbs + (Number(e.carbs) || 0),
          fat: acc.fat + (Number(e.fat) || 0),
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      );
    },
    [logsByDay]
  );

  const value = useMemo(
    () => ({
      isLoading,
      profile,
      user,
      logsByDay,
      weightsByDay,
      login,
      loginWithProvider,
      loginWithAppleTicket,
      register,
      logout,
      completeOnboarding,
      updateProfile,
      addFoodLog,
      removeFoodLog,
      updateFoodLog,
      logWeight,
      resetAllData,
      getDayTotals,
    }),
    [isLoading, profile, user, logsByDay, weightsByDay, login, loginWithProvider, loginWithAppleTicket, register, logout, completeOnboarding, updateProfile, addFoodLog, removeFoodLog, updateFoodLog, logWeight, resetAllData, getDayTotals]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function displayNameFromEmail(email) {
  const localPart = email?.trim().split('@')[0] || 'ผู้ใช้';
  return localPart.replace(/[._-]+/g, ' ').trim() || 'ผู้ใช้';
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
