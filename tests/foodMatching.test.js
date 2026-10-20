const test = require('node:test');
const assert = require('node:assert/strict');
const { rankFoodCandidates, isConfidentMatch, searchTerms } = require('../server/foodMatching');

const complete = { kcal: 100, protein_g: 5, fat_g: 3, carbAvailable_g: 12 };
const food = (foodId, nameTh, nameEn, extra = {}) => ({ foodId, nameTh, nameEn, foodGroupTh: 'อาหารปรุงสำเร็จ', ...complete, ...extra });

const FOODS = [
  food('1', 'ข้าวมันไก่', 'Rice, chicken'),
  food('2', 'ส้มตำ, ปลาร้า', 'Papaya salad, fermented fish'),
  food('3', 'มันเทศ, เนื้อสีส้ม, ดิบ', 'Sweet potato, orange flesh, raw', { foodGroupTh: 'ราก หัวของพืช และผลิตภัณฑ์' }),
  food('4', 'ส้ม, โชกุน', 'Orange, Shogun', { foodGroupTh: 'ผลไม้และผลิตภัณฑ์' }),
  food('5', 'ก๋วยเตี๋ยวผัดไทย, ใส่ไข่', 'Rice noodles, fried, Thai style'),
  food('6', 'กระชาย', 'Fingerroot', { foodGroupTh: 'เครื่องเทศและเครื่องปรุงรส' }),
  food('7', 'ข้าวเหนียว, ดิบ', 'Rice, glutinous, raw', { foodGroupTh: 'ธัญพืชและผลิตภัณฑ์' }),
  food('8', 'ข้าวเหนียว, นึ่ง', 'Rice, glutinous, steamed', { foodGroupTh: 'ธัญพืชและผลิตภัณฑ์' }),
  food('9', 'ไข่ดาว', 'Egg, fried', { kcal: null }),
];

test('exact name ranks first and is confident', () => {
  const [top] = rankFoodCandidates(FOODS, 'ข้าวมันไก่', 'Chicken rice');
  assert.equal(top.foodId, '1');
  assert.equal(top.matchType, 'exact');
  assert.ok(isConfidentMatch(top));
});

test('a listed variant of the dish is confident', () => {
  const [top] = rankFoodCandidates(FOODS, 'ส้มตำ', 'Papaya salad');
  assert.equal(top.foodId, '2');
  assert.equal(top.matchType, 'variant');
  assert.ok(isConfidentMatch(top));
});

test('short names prefer the real food over incidental word uses', () => {
  // "ส้ม" is also the colour in "เนื้อสีส้ม"; it may appear, but below the fruit and never pre-selected.
  const ranked = rankFoodCandidates(FOODS, 'ส้ม', 'Orange');
  assert.equal(ranked[0].foodId, '4');
  assert.ok(isConfidentMatch(ranked[0]));
  const sweetPotato = ranked.find((f) => f.foodId === '3');
  assert.ok(!sweetPotato || !isConfidentMatch(sweetPotato));
});

test('compound dish words match across Thai word splits', () => {
  const [top] = rankFoodCandidates(FOODS, 'ผัดไทยกุ้งสด', 'Pad thai with shrimp');
  assert.equal(top.foodId, '5');
  assert.equal(top.matchType, 'partial');
  assert.ok(!isConfidentMatch(top), 'partial matches are suggestions only');
  assert.ok(searchTerms('ผัดไทยกุ้งสด').includes('ผัดไทย'));
});

test('whole words only: ชา does not match กระชาย', () => {
  assert.ok(!rankFoodCandidates(FOODS, 'ชาไทย', 'Thai tea').some((f) => f.foodId === '6'));
});

test('cooked staple beats raw, and raw staples are never confident', () => {
  const ranked = rankFoodCandidates(FOODS, 'ข้าวเหนียว', 'Sticky rice');
  assert.equal(ranked[0].foodId, '8');
  const raw = ranked.find((f) => f.foodId === '7');
  assert.ok(raw && !isConfidentMatch(raw));
});

test('rows with incomplete nutrition are never confident', () => {
  const [top] = rankFoodCandidates(FOODS, 'ไข่ดาว', 'Fried egg');
  assert.equal(top.foodId, '9');
  assert.ok(!isConfidentMatch(top));
});

test('no shared dish word means no candidate', () => {
  assert.deepEqual(rankFoodCandidates(FOODS, 'โจ๊กหมู', 'Pork congee'), []);
});
