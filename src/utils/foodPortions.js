export const EGG_SIZE_PORTIONS = [
  { size: '0', grams: 62 },
  { size: '1', grams: 59 },
  { size: '2', grams: 55 },
  { size: '3', grams: 50 },
  { size: '4', grams: 46 },
  { size: '5', grams: 42 },
  { size: '6', grams: 37 },
];

const FOOD_PORTION_RULES = [
  { pattern: /ไข่(?:ไก่|เป็ด)|(?:chicken|duck)\s+egg|egg,\s*(?:whole|chicken|duck)/i, unit: 'ฟอง', grams: 50 },
  { pattern: /ส้มเขียวหวาน|ส้มจีน|ส้มเช้ง|ส้มสายน้ำผึ้ง|(?:^|[\s,])ส้ม(?:[\s,]|$)|orange/i, unit: 'ลูก', grams: 130, exclude: /น้ำส้ม|orange juice|orange peel/i },
  { pattern: /กล้วย|banana/i, unit: 'ผล', grams: 100, exclude: /กล้วยทอด|กล้วยฉาบ|banana chips|banana, dried|banana, fried/i },
  { pattern: /แอปเปิล|apple/i, unit: 'ผล', grams: 180, exclude: /น้ำแอปเปิล|apple juice|apple sauce/i },
  { pattern: /มะม่วง|mango/i, unit: 'ผล', grams: 200, exclude: /มะม่วงกวน|mango dried|mango pickle/i },
  { pattern: /ฝรั่ง|guava/i, unit: 'ผล', grams: 150, exclude: /น้ำฝรั่ง|guava juice/i },
];

export function inferServingUnit(food) {
  const name = `${food?.nameTh || ''} ${food?.nameEn || ''}`;
  if (/ส้มตำ|ส้มแขก/.test(name)) return null;
  const rule = FOOD_PORTION_RULES.find((item) => item.pattern.test(name) && !item.exclude?.test(name));
  if (!rule) return null;

  const isChickenEgg = /ไข่ไก่|chicken\s+egg|egg,\s*(?:whole|chicken)/i.test(name);
  if (isChickenEgg) {
    const sizeMatch = name.match(/(?:เบอร์|no\.?|#)\s*([0-6])\b/i);
    const eggSize = sizeMatch?.[1] || '3';
    const sizePortion = EGG_SIZE_PORTIONS.find((item) => item.size === eggSize);
    return {
      unit: rule.unit,
      grams: sizePortion.grams,
      eggSize,
    };
  }

  return { unit: rule.unit, grams: rule.grams };
}
