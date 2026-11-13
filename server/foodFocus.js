// Ranks foods by how much of their energy comes from one macro, for the
// "อาหารตามสไตล์มื้อนี้" picker on the Log screen (โปรตีน / คาร์บ / ไขมัน).

const FOCUS_MACROS = {
  protein: { field: 'protein_g', kcalPerGram: 4, minShare: 0.3 },
  carbs: { field: 'carbAvailable_g', kcalPerGram: 4, minShare: 0.55 },
  fat: { field: 'fat_g', kcalPerGram: 9, minShare: 0.45 },
};

// Seasonings and insects are not what people mean by "a meal that's high in X".
const EXCLUDED_GROUPS = new Set(['เครื่องเทศและเครื่องปรุงรส', 'แมลง']);
const DISH_GROUP = 'อาหารปรุงสำเร็จ อาหารจานเดียว';
// Ready-to-eat dishes rank ahead of raw ingredients with a similar share.
const DISH_BONUS = 0.12;
// Raw ingredients ("หมู, มัน, ดิบ") are rarely what people log, so they sink.
const RAW_PENALTY = 0.25;
// Almost pure single-nutrient items (oil, sugar, gelatin) aren't useful picks.
const MAX_SHARE = 0.97;
// Skip near-zero-energy items (water, plain greens) whose shares are noise.
const MIN_KCAL = 40;

const num = (value) => (value == null || value === '' ? NaN : Number(value));
const baseName = (name) => String(name || '').split(',')[0].trim();

/** Energy shares of protein/carbs/fat for one food (per 100 g), or null if data is incomplete. */
function macroShares(food) {
  const protein = num(food.protein_g);
  const carbs = num(food.carbAvailable_g);
  const fat = num(food.fat_g);
  if (![protein, carbs, fat].every(Number.isFinite)) return null;
  const total = protein * 4 + carbs * 4 + fat * 9;
  if (total <= 0) return null;
  return { protein: (protein * 4) / total, carbs: (carbs * 4) / total, fat: (fat * 9) / total };
}

/**
 * Foods whose energy leans on `macro`, best first.
 * @param {object[]} foods raw food documents
 * @param {'protein'|'carbs'|'fat'} macro
 * @param {number} limit
 */
function rankFoodsByFocus(foods, macro, limit = 20) {
  const rule = FOCUS_MACROS[macro];
  if (!rule) return [];
  return foods
    .map((food) => {
      if (EXCLUDED_GROUPS.has(food.foodGroupTh)) return null;
      const kcal = num(food.kcal);
      if (!Number.isFinite(kcal) || kcal < MIN_KCAL) return null;
      const shares = macroShares(food);
      if (!shares) return null;
      const share = shares[macro];
      if (share < rule.minShare || share > MAX_SHARE) return null;
      const raw = /(^|,\s*)ดิบ(\s|,|$)/.test(String(food.nameTh || ''));
      const score = share + (food.foodGroupTh === DISH_GROUP ? DISH_BONUS : 0) - (raw ? RAW_PENALTY : 0);
      return { food, share, shares, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || String(a.food.nameTh).localeCompare(String(b.food.nameTh), 'th'))
    // One entry per base name ("ปลาทูน่า, ในน้ำเกลือ" → "ปลาทูน่า") so the list
    // isn't five tuna cans in a row.
    .filter((item, index, list) => {
      const base = baseName(item.food.nameTh);
      return list.findIndex((other) => baseName(other.food.nameTh) === base) === index;
    })
    .slice(0, limit)
    .map(({ food, share, shares }) => ({
      ...food,
      focus: {
        macro,
        share: Math.round(share * 100) / 100,
        shares: Object.fromEntries(Object.entries(shares).map(([k, v]) => [k, Math.round(v * 100) / 100])),
      },
    }));
}

module.exports = { FOCUS_MACROS, macroShares, rankFoodsByFocus };
