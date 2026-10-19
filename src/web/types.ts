/**
 * Core domain types for CalTrack.
 *
 * The web app loads and saves everything through the API-backed data layer
 * (see `src/web/data/repositories.ts`); these types are the shared vocabulary.
 */

/** The three macronutrients, in grams. */
export interface Macros {
  protein: number
  carb: number
  fat: number
}

/** Meal buckets used across the app. */
export type MealId = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/** A single logged food entry for a day. */
export interface FoodLogEntry {
  id: string
  /** ISO date (local, `YYYY-MM-DD`) the entry belongs to. */
  date: string
  /** Catalogue id when the entry came from the food database (optional). */
  foodId?: string
  meal: MealId
  /** Display time, e.g. "08:00". Empty when the meal has no time yet. */
  time?: string
  name: string
  /** Portion amount in the given unit, e.g. 1.5. */
  amount: number
  /** Unit label, e.g. "จาน" / "ถ้วย" / "ชิ้น". */
  unit: string
  /** Total grams for this entry. */
  grams: number
  kcal: number
  macros: Macros
}

/** Aggregated nutrition for a single day. */
export interface DayNutrition {
  date: string
  kcal: number
  macros: Macros
  /**
   * True when the day is still "open" (e.g. today, not fully logged).
   * Incomplete days are included in the 7-day average but called out in the UI.
   */
  isComplete: boolean
}

/** The user's confirmed nutrition goal (from their profile). */
export interface NutritionGoal {
  kcal: number
  macros: Macros
}

/** The signed-in user. */
export interface UserProfile {
  name: string
  goal: NutritionGoal | null
}

/** A food in the searchable catalogue. */
export interface FoodCatalogItem {
  id: string
  name: string
  /** Serving description shown next to the name, e.g. "1 จาน · 300 กรัม". */
  servingLabel: string
  /** Serving amount in its own unit (usually 1). */
  servingAmount: number
  unit: string
  grams: number
  kcal: number
  macros: Macros
  /** Marks the most recently logged item for a gentle "recent" badge. */
  recent?: boolean
}

/** Result of an AI photo estimate — always reviewable before saving. */
export interface AiEstimate {
  name: string
  amount: number
  unit: string
  grams: number
  kcal: number
  macros: Macros
}

/** Portion multiplier applied on the portion-confirmation screen. */
export interface PortionSelection {
  amount: number
  unit: string
}
