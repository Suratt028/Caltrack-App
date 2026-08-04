// src/services/foodService.js
// Uses MongoDB Atlas Data API (REST) if configured, otherwise falls back to a local sample dataset.
import {
  MONGODB_DATA_API_ENDPOINT,
  MONGODB_DATA_API_KEY,
  MONGODB_DATA_API_DATABASE,
  MONGODB_DATA_API_COLLECTION,
  MONGODB_DATA_SOURCE,
} from '../config';

const FALLBACK_FOODS = [
  {
    id: 'thai-01',
    name: 'ข้าวผัดกะเพราไก่',
    nameEn: 'Basil chicken fried rice',
    kcal: 450,
    protein: 22,
    carbs: 60,
    fat: 15,
    serving: '1 จาน',
    category: 'thai',
  },
  {
    id: 'thai-02',
    name: 'ส้มตำไทย',
    nameEn: 'Papaya salad',
    kcal: 180,
    protein: 5,
    carbs: 25,
    fat: 8,
    serving: '1 จาน',
    category: 'thai',
  },
  {
    id: 'thai-03',
    name: 'ต้มยำกุ้ง',
    nameEn: 'Tom yum soup with shrimp',
    kcal: 120,
    protein: 10,
    carbs: 6,
    fat: 7,
    serving: '1 ถ้วย',
    category: 'thai',
  },
  {
    id: 'thai-04',
    name: 'ผัดไทยกุ้งสด',
    nameEn: 'Pad thai with shrimp',
    kcal: 520,
    protein: 18,
    carbs: 75,
    fat: 18,
    serving: '1 จาน',
    category: 'thai',
  },
  {
    id: 'thai-05',
    name: 'ข้าวต้มหมู',
    nameEn: 'Rice porridge with pork',
    kcal: 320,
    protein: 16,
    carbs: 45,
    fat: 8,
    serving: '1 ถ้วย',
    category: 'thai',
  },
];

const isAtlasConfigured = () =>
  Boolean(
    MONGODB_DATA_API_ENDPOINT &&
      !MONGODB_DATA_API_ENDPOINT.includes('xxxxx') &&
      MONGODB_DATA_API_KEY &&
      MONGODB_DATA_API_KEY !== 'YOUR_MONGODB_DATA_API_KEY'
  );

function normalizeFoodItem(item) {
  return {
    id: String(item._id || item.id || item.name || `${item.nameEn}-${Math.random()}`),
    name: item.name || item.nameEn || 'อาหาร',
    nameEn: item.nameEn || item.name || 'Food item',
    kcal: Number(item.kcal || item.calories || 0),
    protein: Number(item.protein || 0),
    carbs: Number(item.carbs || 0),
    fat: Number(item.fat || 0),
    serving: item.serving || '1 หน่วย',
    category: item.category || 'thai',
  };
}

async function atlasFind(filter = {}, limit = 1000) {
  const response = await fetch(`${MONGODB_DATA_API_ENDPOINT}/action/find`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGODB_DATA_API_KEY,
    },
    body: JSON.stringify({
      dataSource: MONGODB_DATA_SOURCE,
      database: MONGODB_DATA_API_DATABASE,
      collection: MONGODB_DATA_API_COLLECTION,
      filter,
      limit,
    }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.error || json?.message || 'Atlas Data API error';
    throw new Error(message);
  }

  return Array.isArray(json.documents) ? json.documents.map(normalizeFoodItem) : [];
}

async function localSearch(query) {
  const q = query?.trim?.toLowerCase() || '';
  if (!q) return FALLBACK_FOODS;

  return FALLBACK_FOODS.filter(
    (item) => item.name.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q)
  );
}

export const getAllFoods = async () => {
  if (!isAtlasConfigured()) {
    return FALLBACK_FOODS;
  }

  try {
    return await atlasFind({}, 1000);
  } catch (error) {
    console.warn('FoodService: Atlas fallback enabled', error?.message || error);
    return FALLBACK_FOODS;
  }
};

export const searchFood = async (query) => {
  const q = query?.trim?.();
  if (!q) return getAllFoods();

  if (!isAtlasConfigured()) {
    return localSearch(q);
  }

  try {
    return await atlasFind(
      {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { nameEn: { $regex: q, $options: 'i' } },
        ],
      },
      100
    );
  } catch (error) {
    console.warn('FoodService: search fallback enabled', error?.message || error);
    return localSearch(q);
  }
};
