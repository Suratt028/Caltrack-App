// src/services/nutritionService.js
import { API_BASE_URL } from '../config';

/**
 * Calculates real nutrition totals by scaling a food's per-100g database
 * values by an actual gram amount (or a named serving x quantity).
 *
 * @param {Array<{ foodId: string, grams?: number, servingLabel?: string, quantity?: number }>} items
 * @returns {Promise<{
 *   totals: Record<string, number|null>,
 *   breakdown: Array<{ foodId: string, nameTh: string, nameEn: string, grams: number, nutrition: object }>,
 *   notFound: string[]
 * }>}
 */
export async function calculateNutrition(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('calculateNutrition requires a non-empty items array');
  }

  const response = await fetch(`${API_BASE_URL}/nutrition/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Nutrition calculation failed (${response.status})`);
  }

  return response.json();
}

/**
 * Convenience helper for the common single-food case (e.g. AI scan dbMatch
 * confirmation): given a foodId and a gram amount, return the scaled
 * { kcal, protein, carbs, fat } ready to drop into a food log.
 */
export async function calculateSingleFoodMacros(foodId, grams) {
  const { totals, notFound } = await calculateNutrition([{ foodId, grams }]);
  if (notFound.includes(String(foodId))) {
    throw new Error('ไม่พบอาหารนี้ในฐานข้อมูล');
  }
  return {
    kcal: totals.kcal ?? 0,
    protein: totals.protein_g ?? 0,
    carbs: totals.carbAvailable_g ?? 0,
    fat: totals.fat_g ?? 0,
    fiber: totals.fiber_g ?? 0,
    sugar: totals.sugar_g ?? 0,
    sodium: totals.sodium_mg ?? 0,
    calcium: totals.calcium_mg ?? 0,
    iron: totals.iron_mg ?? 0,
    vitaminC: totals.vitaminC_mg ?? 0,
  };
}
