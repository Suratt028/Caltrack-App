const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { SPELLING_VARIANTS, DISH_ALIASES } = require('../server/thaiFoodAliases');
const {
  canonicalSpelling,
  spellingRegexSource,
  thaiNameVariants,
  candidateSearchTerms,
  rankFoodCandidates,
  rankSearchResults,
  isConfidentMatch,
} = require('../server/foodMatching');

const complete = { kcal: 100, protein_g: 5, fat_g: 3, carbAvailable_g: 12 };
const food = (foodId, nameTh, nameEn, extra = {}) => ({ foodId, nameTh, nameEn, foodGroupTh: 'อาหารปรุงสำเร็จ', ...complete, ...extra });

const FOODS = [
  food('rice-raw', 'ข้าวเจ้า, 100%, ดิบ', 'Rice, white, 100%, raw', { foodGroupTh: 'ธัญพืชและผลิตภัณฑ์' }),
  food('rice-steamed', 'ข้าวเจ้า, นึ่ง', 'Rice, white, steamed', { foodGroupTh: 'ธัญพืชและผลิตภัณฑ์' }),
  food('basil-leaf', 'กะเพราขาว, ใบ', 'Holy basil, white, leaves', { foodGroupTh: 'ผักและผลิตภัณฑ์' }),
  food('kaprao-rice', 'ข้าวราดผัดกะเพราไก่', 'Rice topped with stir-fried chicken and holy basil'),
  food('kaprao-inmu', 'กระเพราไก่', 'Stir-fried chicken with holy basil'),
  food('padthai', 'ก๋วยเตี๋ยวผัดไทย, ใส่ไข่', 'Rice noodles, fried, Thai style'),
  food('cha-yen', 'ชาเย็น', 'Iced tea'),
  food('cha-yen-milk', 'ชาเย็นนมสด', 'Iced tea with fresh milk'),
  food('noodle', 'ก๋วยเตี๋ยว, เส้นเล็ก, เส้นสด', 'Noodle, rice, small strip, fresh', { foodGroupTh: 'ธัญพืชและผลิตภัณฑ์' }),
];

test('spelling variants fold to one spelling without doubling the canonical form', () => {
  assert.equal(canonicalSpelling('กระเพราไก่'), 'กะเพราไก่');
  assert.equal(canonicalSpelling('ก๊วยเตี๋ยวเรือ'), 'ก๋วยเตี๋ยวเรือ');
  assert.equal(canonicalSpelling('ผัดไท'), 'ผัดไทย');
  assert.equal(canonicalSpelling('ผัดไทยกุ้งสด'), 'ผัดไทยกุ้งสด');
  assert.equal(canonicalSpelling('ข้าวผัดกะเพรา'), 'ข้าวผัดกะเพรา');
});

test('database regexes accept every spelling of a term', () => {
  const regex = new RegExp(spellingRegexSource('กะเพราไก่'));
  assert.ok(regex.test('กระเพราไก่'));
  assert.ok(regex.test('ข้าวราดผัดกะเพราไก่'));
  assert.ok(!regex.test('กะเพราหมู'));
  assert.ok(new RegExp(spellingRegexSource('ผัดไท')).test('ก๋วยเตี๋ยวผัดไทย, ใส่ไข่'));
  // Regex characters in user input are literal.
  assert.doesNotThrow(() => new RegExp(spellingRegexSource('ข้าว (ผัด)*')));
});

test('everyday names expand to table names; the name itself is kept', () => {
  const names = thaiNameVariants('ข้าวสวย').map((v) => v.name);
  assert.deepEqual(names, ['ข้าวสวย', 'ข้าวเจ้า, นึ่ง']);
  assert.ok(thaiNameVariants('ชาไทยนมสด').some((v) => v.name === 'ชาเย็นนมสด'));
  // Aliases only rewrite the start of a name, where the dish type is.
  assert.deepEqual(thaiNameVariants('ไข่เจียวหมูสับ').map((v) => v.name), ['ไข่เจียวหมูสับ']);
  // AI aliases are tried too, below the main name.
  const withAi = thaiNameVariants('ข้าวมันไก่ต้ม', ['ข้าวมันไก่']);
  assert.equal(withAi.find((v) => v.name === 'ข้าวมันไก่').penalty > 0, true);
  const { terms } = candidateSearchTerms('ข้าวสวย');
  assert.ok(terms.includes('ข้าวเจ้า'));
});

test('"ข้าวสวย" finds "ข้าวเจ้า, นึ่ง" as a confident match', () => {
  const [top] = rankFoodCandidates(FOODS, 'ข้าวสวย', 'Steamed rice');
  assert.equal(top.foodId, 'rice-steamed');
  assert.ok(isConfidentMatch(top));
});

test('"กระเพราไก่" (common misspelling) finds a กะเพรา row', () => {
  const ranked = rankFoodCandidates(FOODS, 'กระเพราไก่', 'Basil chicken');
  assert.ok(['kaprao-inmu', 'kaprao-rice'].includes(ranked[0].foodId));
  assert.equal(ranked[0].matchType, 'exact');
  assert.ok(ranked.some((f) => f.foodId === 'kaprao-rice'));
  // "ข้าวกะเพราไก่" is the rice-plate row exactly.
  assert.equal(rankFoodCandidates(FOODS, 'ข้าวกะเพราไก่', '')[0].foodId, 'kaprao-rice');
});

test('other spellings and everyday names reach the table rows', () => {
  assert.equal(rankFoodCandidates(FOODS, 'ผัดไท', 'Pad thai')[0].foodId, 'padthai');
  assert.equal(rankFoodCandidates(FOODS, 'ชาไทย', 'Thai tea')[0].foodId, 'cha-yen');
  assert.equal(rankFoodCandidates(FOODS, 'ชาไทยนมสด', '')[0].foodId, 'cha-yen-milk');
  assert.equal(rankFoodCandidates(FOODS, 'ก๊วยเตี๋ยว', 'Noodles')[0].foodId, 'noodle');
});

test('AI aliases are used when the main name misses', () => {
  // Alone, the name only shares the word "ข้าว": a weak partial match.
  assert.ok(!isConfidentMatch(rankFoodCandidates(FOODS, 'ข้าวเปล่าจานเล็ก', '')[0]));
  const [top] = rankFoodCandidates(FOODS, 'ข้าวเปล่าจานเล็ก', '', 5, { aliases: ['ข้าวสวย'] });
  assert.equal(top.foodId, 'rice-steamed');
  assert.ok(isConfidentMatch(top));
});

test('search ranking: complete exact/variant matches first, incomplete rows sink', () => {
  const rows = [
    food('contains', 'ข้าวราดไข่เจียวหมูสับ', 'Rice with omelette'),
    food('variant-incomplete', 'ไข่เจียว, ทอด', 'Omelette, fried', { kcal: null }),
    food('exact', 'ไข่เจียว', 'Omelette'),
    food('variant', 'ไข่เจียว, หมูสับ', 'Omelette, minced pork'),
  ];
  const ids = rankSearchResults(rows, 'ไข่เจียว', 10).map((f) => f.foodId);
  assert.deepEqual(ids.slice(0, 2), ['exact', 'variant']);
  assert.ok(ids.indexOf('variant-incomplete') > ids.indexOf('variant'));
  // Nothing the database matched is dropped, only reordered.
  assert.equal(ids.length, rows.length);
  // Typed aliases and spellings work in search too.
  assert.equal(rankSearchResults(FOODS, 'ข้าวสวย', 5)[0].foodId, 'rice-steamed');
  assert.equal(rankSearchResults(FOODS, 'ข้าวเจ้า', 5)[0].foodId, 'rice-steamed');
});

// Keeps the table honest: every name it points at must exist in the shipped data.
test('alias targets and spellings exist in the food data', () => {
  const root = path.join(__dirname, '..');
  const names = [
    ...require(path.join(root, 'thaiFoods_clean.json')).map((f) => f.nameTh),
    ...Object.values(require(path.join(root, 'data/inmu/inmu-foods.json')).foods).map((f) => f.thai),
  ].map(canonicalSpelling);
  for (const [, targets] of DISH_ALIASES) {
    for (const target of targets) {
      assert.ok(names.some((name) => name.includes(canonicalSpelling(target))), `alias target not in data: ${target}`);
    }
  }
  for (const [from, to] of SPELLING_VARIANTS) {
    assert.notEqual(from, to);
    assert.ok(names.some((name) => name.includes(to)), `spelling not in data: ${to}`);
  }
});
