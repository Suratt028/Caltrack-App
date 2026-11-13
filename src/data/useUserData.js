// Hooks screens use for the signed-in user's data. Each hook subscribes only to
// its own query, so adding a food log no longer re-renders the profile screens.
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../context/AppContext';
import { todayKey } from '../utils/calculations';
import * as ops from './userDataQueries';
import { sumDayTotals } from './userDataTransforms';

const EMPTY = Object.freeze({});

export function useProfile() {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const query = useQuery(ops.profileQuery(user));

  const completeOnboarding = useCallback(
    (rawProfile) => ops.completeOnboarding(queryClient, user, rawProfile),
    [queryClient, user]
  );
  const updateProfile = useCallback(
    (patch) => ops.updateProfile(queryClient, user, patch),
    [queryClient, user]
  );

  return {
    profile: query.data ?? null,
    // First load with nothing cached yet (paused-offline counts as done).
    isProfileLoading: query.isPending && query.fetchStatus === 'fetching',
    completeOnboarding,
    updateProfile,
  };
}

export function useFoodLogs() {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const { data } = useQuery(ops.logsQuery(user));
  const logsByDay = data ?? EMPTY;

  const getDayTotals = useCallback(
    (dateKey = todayKey()) => sumDayTotals(logsByDay[dateKey]),
    [logsByDay]
  );
  const addFoodLog = useCallback(
    (entry, dateKey) => ops.addFoodLog(queryClient, user, entry, dateKey),
    [queryClient, user]
  );
  const removeFoodLog = useCallback(
    (entryId, dateKey) => ops.removeFoodLog(queryClient, user, entryId, dateKey),
    [queryClient, user]
  );
  const updateFoodLog = useCallback(
    (entryId, dateKey, patch) => ops.updateFoodLog(queryClient, user, entryId, dateKey, patch),
    [queryClient, user]
  );

  return { logsByDay, getDayTotals, addFoodLog, removeFoodLog, updateFoodLog };
}

// Write-only: for screens that add logs but never show them (no subscription).
export function useFoodLogActions() {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const addFoodLog = useCallback(
    (entry, dateKey) => ops.addFoodLog(queryClient, user, entry, dateKey),
    [queryClient, user]
  );
  return { addFoodLog };
}

export function useWeights() {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const { data } = useQuery(ops.weightsQuery(user));

  const logWeight = useCallback(
    (weightKg, dateKey, options) => ops.logWeight(queryClient, user, weightKg, dateKey, options),
    [queryClient, user]
  );

  return { weightsByDay: data ?? EMPTY, logWeight };
}
