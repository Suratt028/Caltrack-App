const test = require('node:test');
const assert = require('node:assert/strict');
const { macroShares, rankFoodsByFocus } = require('../server/foodFocus');

const food = (nameTh, kcal, protein_g, carbAvailable_g, fat_g, foodGroupTh = 'อาหารปรุงสำเร็จ อาหารจานเดียว') => ({
  foodId: nameTh, nameTh, kcal, protein_g, carbAvailable_g, fat_g, foodGroupTh,
});

const FOODS = [
  food('ไก่ย่าง', 165, 31, 0, 3.6),
  food('ข้าวมันไก่', 180, 8, 24, 6),
  food('ข้าวสวย', 130, 2.7, 28, 0.3, 'ธัญพืชและผลิตภัณฑ์'),
  food('แกงมัสมั่น', 190, 9, 8, 14),
  food('น้ำมันหมู', 900, 0, 0, 100, 'อื่นๆ ของทอด เครื่องดื่ม'),
  food('ผักกาด', 12, 1, 2, 0.1, 'ผักและผลิตภัณฑ์'),
  food('พริกป่น', 300, 12, 50, 6, 'เครื่องเทศและเครื่องปรุงรส'),
  food('อกไก่, ดิบ', 120, 23, 0, 2.6, 'เนื้อสัตว์ เป็ด ไก่ และผลิตภัณฑ์'),
  { foodId: 'x', nameTh: 'ไม่ครบ', kcal: 100, protein_g: 10 },
];

test('macro shares add up to 1 and use 4/4/9 kcal per gram', () => {
  const shares = macroShares(food('a', 100, 10, 10, 10));
  assert.ok(Math.abs(shares.protein + shares.carbs + shares.fat - 1) < 1e-9);
  assert.ok(shares.fat > shares.protein);
  assert.equal(macroShares({ protein_g: 1 }), null);
});

test('protein focus ranks dishes first and sinks raw ingredients', () => {
  const names = rankFoodsByFocus(FOODS, 'protein').map((f) => f.nameTh);
  assert.equal(names[0], 'ไก่ย่าง');
  assert.ok(names.indexOf('อกไก่, ดิบ') > names.indexOf('ไก่ย่าง'));
});

test('carbs and fat focus pick the right foods and skip pure fats, seasonings, tiny-kcal and incomplete rows', () => {
  const carbs = rankFoodsByFocus(FOODS, 'carbs').map((f) => f.nameTh);
  assert.deepEqual(carbs, ['ข้าวสวย']);
  const fat = rankFoodsByFocus(FOODS, 'fat').map((f) => f.nameTh);
  assert.ok(fat.includes('แกงมัสมั่น'));
  for (const skipped of ['น้ำมันหมู', 'พริกป่น', 'ผักกาด', 'ไม่ครบ']) {
    assert.ok(![...carbs, ...fat].includes(skipped), skipped);
  }
});

test('variants of the same food collapse to the best one', () => {
  const names = rankFoodsByFocus([
    food('ปลาทูน่า, ในน้ำเกลือ', 110, 25, 0, 1, 'ปลา กุ้ง สัตว์น้ำอื่นๆ และผลิตภัณฑ์'),
    food('ปลาทูน่า, ในน้ำแร่', 105, 24, 0, 0.6, 'ปลา กุ้ง สัตว์น้ำอื่นๆ และผลิตภัณฑ์'),
    food('ไก่ย่าง', 165, 31, 0, 3.6),
  ], 'protein').map((f) => f.nameTh);
  assert.equal(names.filter((n) => n.startsWith('ปลาทูน่า')).length, 1);
  assert.ok(names.includes('ไก่ย่าง'));
});

test('each result carries its share for the badge, and unknown macros return nothing', () => {
  const [top] = rankFoodsByFocus(FOODS, 'protein', 1);
  assert.equal(top.focus.macro, 'protein');
  assert.ok(top.focus.share > 0.5 && top.focus.share <= 1);
  assert.deepEqual(rankFoodsByFocus(FOODS, 'sugar'), []);
});
