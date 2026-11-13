// Pure helpers that turn API payloads into the shapes the screens use.
import { buildProfileGoals, todayKey } from '../utils/calculations';

// API logs [{ _id, dateKey, entry }] -> { [dateKey]: FoodLogEntry[] }
export function groupLogsByDate(logs = []) {
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

// API weights [{ dateKey, weightKg }] -> { [dateKey]: number }
export function groupWeightsByDate(weights = []) {
  return weights.reduce((acc, item) => {
    if (item?.dateKey && Number.isFinite(Number(item.weightKg))) {
      acc[item.dateKey] = Number(item.weightKg);
    }
    return acc;
  }, {});
}

// Ids the server assigned (Mongo ObjectIds); local-only entries use "<timestamp>_<random>".
export function isServerLogId(entryId) {
  return /^[a-f\d]{24}$/i.test(String(entryId));
}

export function isRemoteUser(user) {
  return Boolean(user?.id && !String(user.id).startsWith('local_'));
}

export function hasCompletedOnboarding(profile) {
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

// The profile the app works with: goals filled in, or null until onboarding is done.
export function toCompleteProfile(profile) {
  return hasCompletedOnboarding(profile) ? { ...profile, ...buildProfileGoals(profile) } : null;
}

export function sumDayTotals(entries = []) {
  return entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + (Number(e.kcal) || 0),
      protein: acc.protein + (Number(e.protein) || 0),
      carbs: acc.carbs + (Number(e.carbs) || 0),
      fat: acc.fat + (Number(e.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Local edit of a log entry (no server copy): merge the patch and keep macros in step.
export function applyLogPatch(entry, patch = {}) {
  const merged = { ...entry, ...patch };
  const protein = Number(merged.protein) || 0;
  const carbs = Number(merged.carbs) || 0;
  const fat = Number(merged.fat) || 0;
  return { ...merged, macros: { protein, carb: carbs, fat } };
}
