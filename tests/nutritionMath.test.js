const test = require('node:test');
const assert = require('node:assert/strict');
const { addNutritionTotals, scaleNutrition } = require('../server/nutritionMath');

const fields = ['kcal', 'protein_g', 'sodium_mg'];

test('scales per-100g nutrient values to the supplied gram amount', () => {
  const result = scaleNutrition({ kcal: 123.456, protein_g: 10, sodium_mg: 250 }, 150, fields);
  assert.deepEqual(result, { kcal: 185.18, protein_g: 15, sodium_mg: 375 });
});

test('preserves unavailable nutrient values rather than treating them as zero', () => {
  const result = scaleNutrition({ kcal: 80, protein_g: null, sodium_mg: undefined }, 50, fields);
  assert.deepEqual(result, { kcal: 40, protein_g: null, sodium_mg: null });
});

test('adds nutrition values across foods while skipping unavailable values', () => {
  const totals = { kcal: 0, protein_g: 0, sodium_mg: 0 };
  addNutritionTotals(totals, { kcal: 50, protein_g: 3, sodium_mg: null });
  addNutritionTotals(totals, { kcal: 25, protein_g: null, sodium_mg: 40 });
  assert.deepEqual(totals, { kcal: 75, protein_g: 3, sodium_mg: 40 });
});
