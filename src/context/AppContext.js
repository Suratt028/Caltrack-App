import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsRestoring, useQueryClient } from '@tanstack/react-query';
import {
  clearUserData,
  exchangeAppleOAuthTicket,
  loginUser,
  loginWithOAuth,
  registerUser,
  setAuthToken,
  setUnauthorizedHandler,
} from '../services/atlasService';
import { clearAuthTokens, loadUserToken, saveAdminToken, saveUserToken } from '../services/authStorage';
import { queryPersister } from '../data/queryClient';
import {
  LEGACY_GLOBAL_DATA_KEYS,
  legacyUserDataKeys,
  migrateLegacyUserCache,
  prefetchUserData,
} from '../data/userDataQueries';
import { isRemoteUser } from '../data/userDataTransforms';

// Session only: who is signed in. The user's profile, logs and weights are
// server state in TanStack Query — see src/data/useUserData.js.
// The token itself lives in SecureStore (src/services/authStorage.js), never
// in this AsyncStorage record.
const USER_KEY = '@caltrack/user';

const AppContext = createContext(null);

function toSessionUser(remoteUser) {
  return {
    id: remoteUser.id,
    email: remoteUser.email,
    displayName: remoteUser.displayName || displayNameFromEmail(remoteUser.email),
    role: remoteUser.role || 'user',
    token: remoteUser.token,
  };
}

export function AppProvider({ children }) {
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const userRef = useRef(null);
  userRef.current = user;
  const bootstrapStarted = useRef(false);

  // Restore the session once the persisted query cache is back in memory.
  useEffect(() => {
    if (isRestoring || bootstrapStarted.current) return;
    bootstrapStarted.current = true;
    (async () => {
      try {
        const rawUser = await AsyncStorage.getItem(USER_KEY);
        const persisted = rawUser ? JSON.parse(rawUser) : null;
        if (!persisted) return;

        // Older builds stored the token inside this record: move it to SecureStore.
        const { token: legacyToken, ...storedUser } = persisted;
        const token = await loadUserToken(legacyToken);
        if (legacyToken) await AsyncStorage.setItem(USER_KEY, JSON.stringify(storedUser));

        // Sessions saved before the server issued tokens can't call the API: sign in again.
        if (isRemoteUser(storedUser) && !token) {
          await AsyncStorage.removeItem(USER_KEY);
          return;
        }
        await migrateLegacyUserCache(queryClient, storedUser);
        setAuthToken(token);
        setUser(storedUser);
      } catch (e) {
        console.warn('Failed to load persisted session', e);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [isRestoring, queryClient]);

  // next: user fields plus `token`; the token goes to SecureStore, the rest to AsyncStorage.
  const persistUser = useCallback(async (next) => {
    const { token, ...sessionUser } = next;
    setAuthToken(token);
    await saveUserToken(token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
    await migrateLegacyUserCache(queryClient, sessionUser);
    setUser(sessionUser);
    return sessionUser;
  }, [queryClient]);

  // Forget the session and every cached byte of the user's data on this device.
  const clearSessionData = useCallback(async () => {
    const previousUserId = userRef.current?.id;
    setAuthToken(null);
    setUser(null);
    queryClient.cancelQueries();
    queryClient.clear();
    await Promise.all([
      clearAuthTokens(),
      queryPersister.removeClient(),
      AsyncStorage.multiRemove([
        USER_KEY,
        ...LEGACY_GLOBAL_DATA_KEYS,
        ...(previousUserId ? Object.values(legacyUserDataKeys(previousUserId)) : []),
      ]),
    ]);
  }, [queryClient]);

  const login = useCallback(async (email, password) => {
    if (!email?.trim() || !password) {
      throw new Error('กรุณากรอกอีเมลและรหัสผ่าน');
    }

    const existingUser = await loginUser(email, password);
    const sessionUser = await persistUser(toSessionUser(existingUser));
    await saveAdminToken(existingUser.adminToken || null);
    await prefetchUserData(queryClient, sessionUser);
    return sessionUser;
  }, [persistUser, queryClient]);

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
    const nextUser = toSessionUser(existingUser);
    if (nextUser.role === 'admin') {
      throw new Error('ใช้บัญชีผู้ดูแลระบบผ่าน Google หรือ Apple ไม่ได้');
    }

    const sessionUser = await persistUser(nextUser);
    await saveAdminToken(null);
    await prefetchUserData(queryClient, sessionUser);
    return sessionUser;
  }, [persistUser, queryClient]);

  const loginWithProvider = useCallback(async (provider, idToken) => {
    const existingUser = await loginWithOAuth(provider, idToken);
    return finishOAuthLogin(existingUser);
  }, [finishOAuthLogin]);

  const loginWithAppleTicket = useCallback(async (ticket) => {
    const existingUser = await exchangeAppleOAuthTicket(ticket);
    return finishOAuthLogin(existingUser);
  }, [finishOAuthLogin]);

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

  const resetAllData = useCallback(async () => {
    if (isRemoteUser(userRef.current)) await clearUserData(userRef.current.id);
    await clearSessionData();
  }, [clearSessionData]);

  const value = useMemo(
    () => ({
      isLoading: isRestoring || isBootstrapping,
      user,
      login,
      loginWithProvider,
      loginWithAppleTicket,
      register,
      logout,
      resetAllData,
    }),
    [isRestoring, isBootstrapping, user, login, loginWithProvider, loginWithAppleTicket, register, logout, resetAllData]
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
