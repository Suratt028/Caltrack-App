const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { transformFileSync } = require('@babel/core');

function loadEsModule(relativePath) {
  const source = transformFileSync(path.resolve(__dirname, '..', relativePath), {
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const mod = { exports: {} };
  new Function('module', 'exports', source)(mod, mod.exports);
  return mod.exports;
}

const { recentFoodNames, POPULAR_FOODS } = loadEsModule('src/utils/quickPicks.js');
const { summarizeScanItems } = loadEsModule('src/utils/trialScan.js');

test('recent names are unique and newest first', () => {
  const logs = {
    '2026-11-12': [
      { name: 'ผัดไทย', time: '2026-11-12T05:00:00Z' },
      { name: 'ข้าวมันไก่', time: '2026-11-12T12:00:00Z' },
    ],
    '2026-11-13': [
      { name: 'ผัดไทย', time: '2026-11-13T05:00:00Z' },
      { name: '  ' },
    ],
  };
  assert.deepEqual(recentFoodNames(logs), ['ผัดไทย', 'ข้าวมันไก่']);
  assert.deepEqual(recentFoodNames(logs, 1), ['ผัดไทย']);
});

test('no logs means no recent names, so the screen falls back to popular foods', () => {
  assert.deepEqual(recentFoodNames({}), []);
  assert.deepEqual(recentFoodNames(undefined), []);
  assert.ok(POPULAR_FOODS.length >= 6);
});

test('trial summary prefers the confident database match over the AI estimate', () => {
  const { rows, total } = summarizeScanItems([
    {
      name_th: 'ข้าวมันไก่',
      estimated_grams: { likely: 300 },
      estimated_nutrition: { kcal: 999, protein: 1, carbs: 1, fat: 1 },
      candidates: [{
        nameTh: 'ข้าวมันไก่ต้ม',
        confident: true,
        per100g: { kcal: 200, protein_g: 10, carbAvailable_g: 25, fat_g: 7 },
      }],
    },
    {
      name_th: 'น้ำซุป',
      estimated_grams: { likely: 150 },
      estimated_nutrition: { kcal: 30, protein: 2, carbs: 1, fat: 1 },
      candidates: [{ nameTh: 'ซุปอื่น', confident: false, per100g: { kcal: 500 } }],
    },
  ]);
  assert.deepEqual(rows.map((row) => [row.name, row.kcal, row.fromDatabase]), [
    ['ข้าวมันไก่ต้ม', 600, true],
    ['น้ำซุป', 30, false],
  ]);
  assert.deepEqual(total, { kcal: 630, protein: 32, carbs: 76, fat: 22 });
});
