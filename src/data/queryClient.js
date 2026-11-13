// One QueryClient for the app, persisted to AsyncStorage so the last synced
// profile/logs/weights show instantly on launch and while offline.
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueryCache, QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { isOfflineError } from '../services/atlasService';

const MAX_RETRIES = 2;

// Retry only what a retry can fix: no network, timeouts, 5xx and 429.
// Any other 4xx (401 expired session, 403, 404, 400) fails straight away.
export function shouldRetry(failureCount, error) {
  if (failureCount >= MAX_RETRIES) return false;
  if (isOfflineError(error)) return true;
  const status = Number(error?.status);
  if (!status) return true;
  return status >= 500 || status === 429;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.warn(`Failed to load ${JSON.stringify(query.queryKey)}`, error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      // Keep user data in memory (and so in the persisted cache) until logout.
      gcTime: Infinity,
      retry: shouldRetry,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000) + Math.random() * 300,
    },
    mutations: {
      retry: false,
    },
  },
});

// Bump when the cached data shape changes, so old caches are thrown away.
export const CACHE_BUSTER = 'user-data-v1';

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@caltrack/query-cache',
  throttleTime: 1000,
});

export const persistOptions = {
  persister: queryPersister,
  buster: CACHE_BUSTER,
  // Offline users should still see their history after a long trip; the
  // cache is cleared on logout instead of aging out.
  maxAge: Infinity,
};

// Native has no window focus/online events: wire TanStack Query to AppState
// and NetInfo so data refetches when the app returns or the network comes back.
let nativeManagersWired = false;
export function wireNativeQueryManagers() {
  if (Platform.OS === 'web' || nativeManagersWired) return;
  nativeManagersWired = true;

  // isConnected only: the API is often on a LAN with no internet route, where
  // isInternetReachable reports false and would pause every request.
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    })
  );

  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (status) => {
      handleFocus(status === 'active');
    });
    return () => subscription.remove();
  });
}
