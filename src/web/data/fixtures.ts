/**
 * Pure data fixtures for unit tests (`lib/nutrition.test.ts`).
 *
 * Kept separate from production code on purpose: these numbers are made-up
 * test values (reference day 2026-10-17) and never reach any screen.
 */
import type { DayNutrition, FoodLogEntry, NutritionGoal } from '../types'

/** Reference date used by the fixtures. */
export const FIXTURE_TODAY = '2026-10-17'

export const FIXTURE_GOAL: NutritionGoal = {
  kcal: 2000,
  macros: { protein: 110, carb: 255, fat: 60 },
}

/** Food log entries for the fixture day (dinner intentionally empty). */
export const FIXTURE_LOG: FoodLogEntry[] = [
  {
    id: 'log-1',
    date: FIXTURE_TODAY,
    meal: 'breakfast',
    time: '08:00',
    name: 'แซนด์วิชไข่',
    amount: 1,
    unit: 'ชิ้น',
    grams: 150,
    kcal: 320,
    macros: { protein: 18, carb: 44, fat: 8 },
  },
  {
    id: 'log-2',
    date: FIXTURE_TODAY,
    meal: 'lunch',
    time: '12:15',
    name: 'ข้าวกะเพราไก่',
    amount: 1,
    unit: 'จาน',
    grams: 300,
    kcal: 560,
    macros: { protein: 32, carb: 72, fat: 16 },
  },
  {
    id: 'log-3',
    date: FIXTURE_TODAY,
    meal: 'snack',
    time: '15:00',
    name: 'โยเกิร์ตรสธรรมชาติ',
    amount: 1,
    unit: 'ถ้วย',
    grams: 150,
    kcal: 120,
    macros: { protein: 6, carb: 15, fat: 4 },
  },
]

/** Previous 6 days + today (11–17 Oct 2026). */
export const FIXTURE_WEEK: DayNutrition[] = [
  { date: '2026-10-11', kcal: 1720, macros: { protein: 90, carb: 205, fat: 60 }, isComplete: true },
  { date: '2026-10-12', kcal: 1860, macros: { protein: 100, carb: 230, fat: 60 }, isComplete: true },
  { date: '2026-10-13', kcal: 1640, macros: { protein: 85, carb: 190, fat: 60 }, isComplete: true },
  { date: '2026-10-14', kcal: 1920, macros: { protein: 105, carb: 240, fat: 60 }, isComplete: true },
  { date: '2026-10-15', kcal: 1800, macros: { protein: 100, carb: 215, fat: 60 }, isComplete: true },
  { date: '2026-10-16', kcal: 1680, macros: { protein: 90, carb: 195, fat: 60 }, isComplete: true },
  { date: FIXTURE_TODAY, kcal: 1000, macros: { protein: 56, carb: 131, fat: 28 }, isComplete: false },
]
