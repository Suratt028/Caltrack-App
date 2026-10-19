import type { NutritionGoal } from '../types'

/** Units offered when adjusting a portion (spec §6.9). */
export const PORTION_UNITS = ['จาน', 'ถ้วย', 'กรัม'] as const

/** Ready-made daily-goal presets shown on the profile screen. */
export const GOAL_PRESETS: NutritionGoal[] = [
  { kcal: 1600, macros: { protein: 90, carb: 200, fat: 53 } },
  { kcal: 1800, macros: { protein: 100, carb: 225, fat: 60 } },
  { kcal: 2000, macros: { protein: 110, carb: 255, fat: 60 } },
  { kcal: 2200, macros: { protein: 120, carb: 275, fat: 73 } },
]
