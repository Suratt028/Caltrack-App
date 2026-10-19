/**
 * Pure nutrition math for CalTrack.
 *
 * These functions encode the business rules in spec §7 and are covered by
 * `src/lib/nutrition.test.ts`. They must never divide by zero, never return
 * negative "remaining" values, and never invent a goal.
 */
import type { DayNutrition, FoodLogEntry, Macros, NutritionGoal } from '../types'

export interface NutritionTotals {
  kcal: number
  macros: Macros
}

const emptyMacros = (): Macros => ({ protein: 0, carb: 0, fat: 0 })

/** True when a goal is present and usable (positive, finite kcal). */
export function hasUsableGoal(
  goal: NutritionGoal | null | undefined,
): goal is NutritionGoal {
  return (
    !!goal &&
    Number.isFinite(goal.kcal) &&
    goal.kcal > 0 &&
    Number.isFinite(goal.macros.protein) &&
    Number.isFinite(goal.macros.carb) &&
    Number.isFinite(goal.macros.fat)
  )
}

/** Sum the calories and macros of a set of log entries. */
export function sumNutrition(entries: FoodLogEntry[]): NutritionTotals {
  return entries.reduce<NutritionTotals>(
    (acc, entry) => ({
      kcal: acc.kcal + (Number.isFinite(entry.kcal) ? entry.kcal : 0),
      macros: {
        protein: acc.macros.protein + entry.macros.protein,
        carb: acc.macros.carb + entry.macros.carb,
        fat: acc.macros.fat + entry.macros.fat,
      },
    }),
    { kcal: 0, macros: emptyMacros() },
  )
}

/** Group a day's entries by meal, preserving the canonical meal order. */
export const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export function groupByMeal(
  entries: FoodLogEntry[],
): Record<string, FoodLogEntry[]> {
  const grouped: Record<string, FoodLogEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  }
  for (const entry of entries) {
    ;(grouped[entry.meal] ??= []).push(entry)
  }
  return grouped
}

/**
 * Remaining calories for the day.
 * Returns `null` when there is no usable goal (so the UI shows a CTA instead
 * of "0" or a divide-by-zero percentage). Never negative — see `overGoalBy`.
 */
export function remainingKcal(
  goal: NutritionGoal | null | undefined,
  consumedKcal: number,
): number | null {
  if (!hasUsableGoal(goal)) return null
  return Math.max(0, goal.kcal - (Number.isFinite(consumedKcal) ? consumedKcal : 0))
}

/** Percentage of the goal consumed, clamped to 0–100 for the ring. `null` without a goal. */
export function percentConsumed(
  goal: NutritionGoal | null | undefined,
  consumedKcal: number,
): number | null {
  if (!hasUsableGoal(goal)) return null
  const raw = (consumedKcal / goal.kcal) * 100
  return Math.min(100, Math.max(0, raw))
}

/** True when the user has eaten more than their goal. */
export function isOverGoal(
  goal: NutritionGoal | null | undefined,
  consumedKcal: number,
): boolean {
  if (!hasUsableGoal(goal)) return false
  return consumedKcal > goal.kcal
}

/**
 * How many kcal over the goal the user is. Returns a positive number (0 when
 * not over, or when there is no goal). Used to phrase "มากกว่าเป้าหมายที่ตั้งไว้ X kcal"
 * instead of showing a negative remaining value.
 */
export function overGoalBy(
  goal: NutritionGoal | null | undefined,
  consumedKcal: number,
): number {
  if (!hasUsableGoal(goal)) return 0
  return Math.max(0, consumedKcal - goal.kcal)
}

export interface ScaledNutrition {
  kcal: number
  macros: Macros
  /** Total grams for the scaled portion. */
  grams: number
}

/**
 * Scale a base serving by a portion multiplier (e.g. 1 → 1.5 จาน).
 * Rounds calories and grams to whole numbers and macros to whole grams.
 */
export function scalePortion(
  base: { kcal: number; macros: Macros; grams: number },
  multiplier: number,
): ScaledNutrition {
  const factor = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 0
  return {
    kcal: Math.round(base.kcal * factor),
    macros: {
      protein: Math.round(base.macros.protein * factor),
      carb: Math.round(base.macros.carb * factor),
      fat: Math.round(base.macros.fat * factor),
    },
    grams: Math.round(base.grams * factor),
  }
}

/** Total grams for a portion: serving grams × amount. */
export function portionGrams(servingGrams: number, amount: number): number {
  const factor = Number.isFinite(amount) && amount > 0 ? amount : 0
  return Math.round(servingGrams * factor)
}

/**
 * Average calories across the given days. Days that are still open (today, when
 * incomplete) ARE included — this matches the design's headline average of
 * 1,660 kcal across 11–17 Oct.
 *
 * Returns `null` when there are no days (no data is not the same as 0 kcal).
 */
export function averageKcal(days: DayNutrition[]): number | null {
  if (days.length === 0) return null
  const total = days.reduce((sum, day) => sum + day.kcal, 0)
  return Math.round(total / days.length)
}

/**
 * Average across only the days that are fully complete (used to show the
 * "เฉลี่ย 6 วันก่อนหน้า 1,770 kcal" comparison, excluding today).
 */
export function averageKcalOfCompleteDays(days: DayNutrition[]): number | null {
  const complete = days.filter((day) => day.isComplete)
  return averageKcal(complete)
}

/** Whether there is enough data to draw a trend (spec §7.5: needs ≥ 3 logged days). */
export function hasEnoughTrendData(days: DayNutrition[], minimum = 3): boolean {
  return loggedDays(days).length >= minimum
}

/** The list of days that actually contain data (never padded with zeros). */
export function loggedDays(days: DayNutrition[]): DayNutrition[] {
  return days.filter((day) => day.kcal > 0 || (day.macros.protein + day.macros.carb + day.macros.fat) > 0)
}
