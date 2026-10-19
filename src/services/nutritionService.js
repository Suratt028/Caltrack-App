// src/services/nutritionService.js
import { API_BASE_URL } from '../config';

/**
 * Calculates nutrition totals from per-100g database values and gram amounts.
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
  const invalidItem = items.find((item) => {
    const grams = Number(item?.grams);
    return (
      !item?.foodId ||
      !Number.isFinite(grams) ||
      grams <= 0 ||
      grams > 5000
    );
  });
  if (invalidItem) {
    throw new Error('อาหารแต่ละรายการต้องมี foodId และน้ำหนัก 1–5000 กรัม');
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
