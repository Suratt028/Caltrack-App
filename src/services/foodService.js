// src/services/foodService.js
// Uses MongoDB Atlas Data API (REST) – works in React Native / Expo.
// Set these values in your Atlas project under Data API > API Keys.
// In development you can hardcode them here, or use a config file / env.
const ATLAS_API_URL = 'https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1'; // Replace with your Atlas App ID
const ATLAS_API_KEY = 'YOUR_ATLAS_API_KEY'; // Replace with your API key
const DATA_SOURCE = 'Cluster0'; // Your Atlas cluster name
const DATABASE = 'caltrack';
const COLLECTION = 'foods';

async function atlasFind(filter = {}, limit = 1000) {
  const response = await fetch(`${ATLAS_API_URL}/action/find`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': ATLAS_API_KEY,
    },
    body: JSON.stringify({
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: COLLECTION,
      filter,
      limit,
    }),
  });
  const json = await response.json();
  if (!response.ok) {
    console.error('Atlas Data API error:', json);
    return [];
  }
  return json.documents || [];
}

/** Retrieve all food items */
export const getAllFoods = async () => {
  return atlasFind({}, 1000);
};

/** Search foods by name (Thai or English) – case-insensitive */
export const searchFood = async (query) => {
  const q = query?.trim?.();
  if (!q) return getAllFoods();
  return atlasFind(
    { $or: [{ name: { $regex: q, $options: 'i' } }, { nameEn: { $regex: q, $options: 'i' } }] },
    100
  );
};
