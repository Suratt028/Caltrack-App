import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildProfileGoals, todayKey } from '../utils/calculations';
import { fetchLogs, fetchProfile, loginUser, registerUser, saveLog, saveProfile } from '../services/atlasService';

const STORAGE_KEYS = {
  profile: '@caltrack/profile',
  logs: '@caltrack/logs', // { [dateKey]: FoodLogEntry[] }
  weights: '@caltrack/weights', // { [dateKey]: number }
  user: '@caltrack/user',
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null); // null until onboarding completes
  const [user, setUser] = useState(null);
  const [logsByDay, setLogsByDay] = useState({});
  const [weightsByDay, setWeightsByDay] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted state once on app start.
  useEffect(() => {
    (async () => {
      try {
        const [rawProfile, rawLogs, rawWeights, rawUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.profile),
          AsyncStorage.getItem(STORAGE_KEYS.logs),
          AsyncStorage.getItem(STORAGE_KEYS.weights),
          AsyncStorage.getItem(STORAGE_KEYS.user),
        ]);
        if (rawProfile) setProfile(JSON.parse(rawProfile));
        if (rawLogs) setLogsByDay(JSON.parse(rawLogs));
        if (rawWeights) setWeightsByDay(JSON.parse(rawWeights));
        if (rawUser) setUser(JSON.parse(rawUser));
      } catch (e) {
        console.warn('Failed to load persisted state', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistProfile = useCallback(async (next) => {
    setProfile(next);
    await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(next));
  }, []);

  const persistUser = useCallback(async (next) => {
    setUser(next);
    if (next) {
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.user);
    }
  }, []);

  const persistLogs = useCallback(async (next) => {
    setLogsByDay(next);
    await AsyncStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(next));
  }, []);

  const persistWeights = useCallback(async (next) => {
    setWeightsByDay(next);
    await AsyncStorage.setItem(STORAGE_KEYS.weights, JSON.stringify(next));
  }, []);

  const login = useCallback(async (email, password) => {
    if (!email?.trim() || !password) {
      throw new Error('กรุณากรอกอีเมลและรหัสผ่าน');
    }

    const existingUser = await loginUser(email, password);
    const nextUser = {
      id: existingUser.id,
      email: existingUser.email,
      displayName: existingUser.displayName || displayNameFromEmail(existingUser.email),
    };

    await persistUser(nextUser);
    return nextUser;
  }, [persistUser]);

  const register = useCallback(async (email, password, displayName) => {
    if (!email?.trim() || !password) {
      throw new Error('กรุณากรอกอีเมลและรหัสผ่าน');
    }

    const created = await registerUser(email.trim().toLowerCase(), password, displayName?.trim() || displayNameFromEmail(email));
    await persistUser({
      id: created.id,
      email: created.email,
      displayName: created.displayName,
    });
    return created;
  }, [persistUser]);

  const clearSessionData = useCallback(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setProfile(null);
    setUser(null);
    setLogsByDay({});
    setWeightsByDay({});
  }, []);

  const logout = useCallback(async () => {
    await clearSessionData();
  }, [clearSessionData]);

  const completeOnboarding = useCallback(
    async (rawProfile) => {
      const goals = buildProfileGoals(rawProfile);
      const merged = { ...rawProfile, ...goals };
      await persistProfile(merged);

      if (user?.id) {
        try {
          await saveProfile(user.id, merged);
        } catch (error) {
          console.warn('Failed to sync profile to Atlas', error);
        }
      }
    },
    [persistProfile, user]
  );

  const updateProfile = useCallback(
    async (patch) => {
      const merged = { ...profile, ...patch };
      const goals = buildProfileGoals(merged);
      const nextProfile = { ...merged, ...goals };
      await persistProfile(nextProfile);

      if (user?.id) {
        try {
          await saveProfile(user.id, nextProfile);
        } catch (error) {
          console.warn('Failed to sync updated profile to Atlas', error);
        }
      }
    },
    [profile, persistProfile, user]
  );

  const addFoodLog = useCallback(
    async (entry, dateKey = todayKey()) => {
      const day = logsByDay[dateKey] || [];
      const nextEntry = { ...entry, id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, time: new Date().toISOString() };
      const next = {
        ...logsByDay,
        [dateKey]: [...day, nextEntry],
      };
      await persistLogs(next);

      if (user?.id) {
        try {
          await saveLog(user.id, { dateKey, entry: nextEntry });
        } catch (error) {
          console.warn('Failed to sync log to Atlas', error);
        }
      }
    },
    [logsByDay, persistLogs, user]
  );

  const removeFoodLog = useCallback(
    async (entryId, dateKey = todayKey()) => {
      const day = logsByDay[dateKey] || [];
      const next = { ...logsByDay, [dateKey]: day.filter((e) => e.id !== entryId) };
      await persistLogs(next);
    },
    [logsByDay, persistLogs]
  );

  const logWeight = useCallback(
    async (weightKg, dateKey = todayKey()) => {
      const next = { ...weightsByDay, [dateKey]: weightKg };
      await persistWeights(next);
    },
    [weightsByDay, persistWeights]
  );

  const resetAllData = useCallback(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setProfile(null);
    setUser(null);
    setLogsByDay({});
    setWeightsByDay({});
  }, []);

  const getDayTotals = useCallback(
    (dateKey = todayKey()) => {
      const entries = logsByDay[dateKey] || [];
      return entries.reduce(
        (acc, e) => ({
          kcal: acc.kcal + (e.kcal || 0),
          protein: acc.protein + (e.protein || 0),
          carbs: acc.carbs + (e.carbs || 0),
          fat: acc.fat + (e.fat || 0),
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
      register,
      logout,
      completeOnboarding,
      updateProfile,
      addFoodLog,
      removeFoodLog,
      logWeight,
      resetAllData,
      getDayTotals,
    }),
    [isLoading, profile, user, logsByDay, weightsByDay, login, register, logout, completeOnboarding, updateProfile, addFoodLog, removeFoodLog, logWeight, resetAllData, getDayTotals]
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
