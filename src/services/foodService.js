// src/services/foodService.js
// Food lookups against the CalTrack server (MongoDB "foods" collection, values per 100 g).
import { API_BASE_URL } from '../config';
import { fetchWithTimeout } from './atlasService';
import { getFoodDisplayName } from '../utils/foodDisplayName';
import { inferServingUnit } from '../utils/foodPortions';

const NUTRIENT_FIELDS = {
  kcal: 'kcal',
  protein: 'protein_g',
  carbs: 'carbAvailable_g',
  fat: 'fat_g',
  fiber: 'fiber_g',
  sugar: 'sugar_g',
  sodium: 'sodium_mg',
  calcium: 'calcium_mg',
  iron: 'iron_mg',
  vitaminC: 'vitaminC_mg',
};

function normalizeNutritionFood(food) {
  const per100g = Object.fromEntries(
    Object.entries(NUTRIENT_FIELDS).map(([key, field]) => [key, food[field] ?? null])
  );
  return {
    id: String(food.foodId),
    foodId: String(food.foodId),
    name: getFoodDisplayName(food.nameTh || food.nameEn || 'อาหารไม่ทราบชื่อ'),
    nameEn: food.nameEn || '',
    serving: food.servingSize || 'ต่อ 100 กรัม',
    servingUnit: inferServingUnit(food),
    per100g,
    // Fields calculated by scripts/clean-foods.js rather than measured (e.g. ['kcal']).
    estimated: Array.isArray(food.estimated) ? food.estimated : [],
  };
}

export async function searchNutritionFoods(query, limit = 5) {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return [];
  const resultLimit = Math.max(1, Math.min(20, Math.trunc(Number(limit) || 5)));

  const response = await fetchWithTimeout(
    `${API_BASE_URL}/foods/search?q=${encodeURIComponent(normalizedQuery)}&limit=${resultLimit}`
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `ค้นหาฐานข้อมูลอาหารไม่สำเร็จ (${response.status})`);
  }

  return (Array.isArray(payload.results) ? payload.results : []).map(normalizeNutritionFood);
}

/**
 * Foods whose energy leans on one macro ("โปรตีนเด่น" / "คาร์บพลังดี" / "ไขมันเข้มข้น").
 * Each result also has `focus: { macro, share, shares }` (energy shares, 0–1).
 * @param {'protein'|'carbs'|'fat'} macro
 */
export async function fetchFocusFoods(macro, limit = 20) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/foods/focus?macro=${encodeURIComponent(macro)}&limit=${Math.max(1, Math.min(50, limit))}`
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `โหลดเมนูแนะนำไม่สำเร็จ (${response.status})`);
  }
  return (Array.isArray(payload.results) ? payload.results : []).map((food) => ({
    ...normalizeNutritionFood(food),
    focus: food.focus || null,
  }));
}

/** Share of energy from protein/carbs/fat for a normalized food (per100g), or null. */
export function macroEnergyShares(per100g = {}) {
  const protein = Number(per100g.protein);
  const carbs = Number(per100g.carbs);
  const fat = Number(per100g.fat);
  if (![protein, carbs, fat].every(Number.isFinite)) return null;
  const total = protein * 4 + carbs * 4 + fat * 9;
  if (total <= 0) return null;
  return { protein: (protein * 4) / total, carbs: (carbs * 4) / total, fat: (fat * 9) / total };
}

export async function getNutritionFoodById(foodId) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/foods/${encodeURIComponent(foodId)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `โหลดข้อมูลอาหารไม่สำเร็จ (${response.status})`);
  }
  return payload.food ? normalizeNutritionFood(payload.food) : null;
}
