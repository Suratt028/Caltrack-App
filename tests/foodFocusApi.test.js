const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApiServer } = require('./helpers/apiServer');

let api;

before(async () => {
  api = await startApiServer();
  await api.model('Food').insertMany([
    { foodId: 'f1', nameTh: 'ไก่ย่าง', kcal: 165, protein_g: 31, carbAvailable_g: 0, fat_g: 3.6, foodGroupTh: 'อาหารปรุงสำเร็จ อาหารจานเดียว' },
    { foodId: 'f2', nameTh: 'ข้าวสวย', kcal: 130, protein_g: 2.7, carbAvailable_g: 28, fat_g: 0.3, foodGroupTh: 'ธัญพืชและผลิตภัณฑ์' },
  ]);
});

after(async () => {
  await api?.stop();
});

test('GET /api/foods/focus returns foods for the chosen macro (not treated as a food id)', async () => {
  const protein = await api.request('GET', '/api/foods/focus?macro=protein');
  assert.equal(protein.status, 200);
  assert.deepEqual(protein.body.results.map((f) => f.nameTh), ['ไก่ย่าง']);
  assert.equal(protein.body.results[0].focus.macro, 'protein');

  const carbs = await api.request('GET', '/api/foods/focus?macro=carbs&limit=5');
  assert.deepEqual(carbs.body.results.map((f) => f.nameTh), ['ข้าวสวย']);
});

test('GET /api/foods/focus rejects an unknown macro', async () => {
  const res = await api.request('GET', '/api/foods/focus?macro=sugar');
  assert.equal(res.status, 400);
});
