// Where auth tokens live on the device.
//
// iOS/Android: expo-secure-store (Keychain / Android Keystore), so tokens are
// encrypted at rest and not readable from a plain AsyncStorage dump.
// Web: SecureStore has no web implementation, so tokens fall back to
// AsyncStorage (localStorage). Moving web to an httpOnly refresh cookie is
// planned with the refresh-token work.
//
// Older builds kept tokens in AsyncStorage; the load functions move them over
// once and delete the plaintext copy.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// SecureStore keys may only contain letters, digits, ".", "-" and "_".
const SECURE_KEYS = {
  userToken: 'caltrack.userToken',
  adminToken: 'caltrack.adminToken',
};

export const LEGACY_ADMIN_TOKEN_KEY = '@caltrack/admin-token';
const LEGACY_TOKEN_KEY = '@caltrack/token';

const useSecureStore = Platform.OS !== 'web';

async function getItem(key) {
  return useSecureStore ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key);
}

async function setItem(key, value) {
  return useSecureStore ? SecureStore.setItemAsync(key, value) : AsyncStorage.setItem(key, value);
}

async function deleteItem(key) {
  return useSecureStore ? SecureStore.deleteItemAsync(key) : AsyncStorage.removeItem(key);
}

async function setOrDelete(key, value) {
  return value ? setItem(key, value) : deleteItem(key);
}

// legacyToken: the token found inside an old persisted user object, if any.
export async function loadUserToken(legacyToken) {
  const stored = await getItem(SECURE_KEYS.userToken);
  if (stored) return stored;
  if (!legacyToken) return null;
  await setItem(SECURE_KEYS.userToken, legacyToken);
  return legacyToken;
}

export function saveUserToken(token) {
  return setOrDelete(SECURE_KEYS.userToken, token);
}

export async function loadAdminToken() {
  const stored = await getItem(SECURE_KEYS.adminToken);
  if (stored) return stored;
  const legacy = await AsyncStorage.getItem(LEGACY_ADMIN_TOKEN_KEY);
  if (!legacy) return null;
  await setItem(SECURE_KEYS.adminToken, legacy);
  await AsyncStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
  return legacy;
}

export function saveAdminToken(token) {
  return setOrDelete(SECURE_KEYS.adminToken, token);
}

export async function clearAuthTokens() {
  await Promise.all([
    deleteItem(SECURE_KEYS.userToken),
    deleteItem(SECURE_KEYS.adminToken),
    AsyncStorage.multiRemove([LEGACY_ADMIN_TOKEN_KEY, LEGACY_TOKEN_KEY]),
  ]);
}
