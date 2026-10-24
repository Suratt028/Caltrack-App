// src/services/foodService.js
// Food lookups against the CalTrack server (MongoDB "foods" collection, values per 100 g).
import { API_BASE_URL } from '../config';

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
    name: food.nameTh || food.nameEn || 'อาหารไม่ทราบชื่อ',
    nameEn: food.nameEn || '',
    serving: food.servingSize || 'ต่อ 100 กรัม',
    per100g,
    // Fields calculated by scripts/clean-foods.js rather than measured (e.g. ['kcal']).
    estimated: Array.isArray(food.estimated) ? food.estimated : [],
  };
}

export async function searchNutritionFoods(query, limit = 5) {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return [];
  const resultLimit = Math.max(1, Math.min(20, Math.trunc(Number(limit) || 5)));

  const response = await fetch(
    `${API_BASE_URL}/foods/search?q=${encodeURIComponent(normalizedQuery)}&limit=${resultLimit}`
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `ค้นหาฐานข้อมูลอาหารไม่สำเร็จ (${response.status})`);
  }

  return (Array.isArray(payload.results) ? payload.results : []).map(normalizeNutritionFood);
}

export async function getNutritionFoodById(foodId) {
  const response = await fetch(`${API_BASE_URL}/foods/${encodeURIComponent(foodId)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `โหลดข้อมูลอาหารไม่สำเร็จ (${response.status})`);
  }
  return payload.food ? normalizeNutritionFood(payload.food) : null;
}
