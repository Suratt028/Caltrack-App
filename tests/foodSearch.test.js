// GET /api/foods/search against an in-memory MongoDB: ranking happens before
// the limit, and aliases/spellings reach the table names.
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApiServer } = require('./helpers/apiServer');

const complete = { kcal: 100, protein_g: 5, fat_g: 3, carbAvailable_g: 12 };

describe('food search', () => {
  let api;

  before(async () => {
    api = await startApiServer();
    const Food = api.model('Food');
    // 40 rows that merely contain the query, inserted before the exact match,
    // so a limit applied before ranking would never see the exact row.
    const filler = Array.from({ length: 40 }, (_, i) => ({
      foodId: `fill-${i}`,
      nameTh: `ข้าวราดไข่เจียวสูตร${i}`,
      nameEn: `Rice with omelette ${i}`,
      ...complete,
    }));
    await Food.insertMany([
      ...filler,
      { foodId: 'omelette-incomplete', nameTh: 'ไข่เจียว, ทอดกรอบ', nameEn: 'Omelette, crispy', kcal: null },
      { foodId: 'omelette', nameTh: 'ไข่เจียว', nameEn: 'Omelette', ...complete },
      { foodId: 'rice-steamed', nameTh: 'ข้าวเจ้า, นึ่ง', nameEn: 'Rice, white, steamed', foodGroupTh: 'ธัญพืชและผลิตภัณฑ์', ...complete },
      { foodId: 'kaprao-inmu', nameTh: 'กระเพราไก่', nameEn: 'Stir-fried chicken with holy basil', ...complete },
      { foodId: 'kaprao-rice', nameTh: 'ข้าวราดผัดกะเพราไก่', nameEn: 'Rice topped with basil chicken', ...complete },
    ]);
  });

  after(async () => {
    await api?.stop();
  });

  const search = async (q, limit = 5) => {
    const res = await api.request('GET', `/api/foods/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    assert.equal(res.status, 200);
    return res.body.results.map((food) => food.foodId);
  };

  test('the best match is kept when hits exceed the limit', async () => {
    const ids = await search('ไข่เจียว', 5);
    assert.equal(ids.length, 5);
    assert.equal(ids[0], 'omelette');
  });

  test('everyday names and other spellings find the table rows', async () => {
    assert.equal((await search('ข้าวสวย'))[0], 'rice-steamed');
    const kaprao = await search('กะเพราไก่');
    assert.ok(kaprao.includes('kaprao-inmu') && kaprao.includes('kaprao-rice'));
    assert.ok((await search('กระเพราไก่')).includes('kaprao-rice'));
  });

  test('English search still works', async () => {
    assert.equal((await search('omelette'))[0], 'omelette');
  });
});
