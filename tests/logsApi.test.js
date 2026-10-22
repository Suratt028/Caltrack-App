// API tests for food-log writes (POST/PATCH /api/logs) and /api/nutrition/calculate
// input limits, against an in-memory MongoDB.
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApiServer } = require('./helpers/apiServer');

let api;
let request;
let alice;
let bob;

async function registerUser(email) {
  const res = await request('POST', '/api/auth/register', { body: { email, password: 'secret123', displayName: email.split('@')[0] } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return { id: res.body.user.id, token: res.body.user.token };
}

async function createLog(user, body) {
  return request('POST', `/api/logs/${user.id}`, { token: user.token, body });
}

before(async () => {
  api = await startApiServer();
  request = api.request;
  alice = await registerUser('alice-logs@caltrack.test');
  bob = await registerUser('bob-logs@caltrack.test');
});

after(async () => {
  await api?.stop();
});

describe('POST /api/logs/:userId', () => {
  test('stores a valid entry and its user.foods mirror', async () => {
    const res = await createLog(alice, {
      dateKey: '2026-10-20',
      entry: { name: 'ข้าวผัด', meal: 'lunch', kcal: 520, protein: 15, carbs: '70', fat: 18, sodium: 900 },
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.log.dateKey, '2026-10-20');
    assert.equal(res.body.log.entry.carbs, 70);
    assert.equal(res.body.userFood.foodName, 'ข้าวผัด');
    assert.equal(res.body.userFood.sodium, 900);
  });

  test('rejects a dateKey that is not YYYY-MM-DD', async () => {
    for (const dateKey of ['2026-10-20T03:00:00Z', '20/10/2026', '2026-02-30', '{"$gt":""}']) {
      const res = await createLog(alice, { dateKey, entry: { name: 'x', kcal: 1 } });
      assert.equal(res.status, 400, dateKey);
    }
    const viaEntry = await createLog(alice, { entry: { name: 'x', kcal: 1, date: 'yesterday' } });
    assert.equal(viaEntry.status, 400);
  });

  test('defaults a missing dateKey to the Bangkok calendar day', async () => {
    const res = await createLog(alice, { entry: { name: 'กาแฟ', kcal: 90 } });
    assert.equal(res.status, 200);
    const expected = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
    assert.equal(res.body.log.dateKey, expected);
  });

  test('requires a name and sane nutrient numbers', async () => {
    assert.equal((await createLog(alice, { dateKey: '2026-10-20', entry: { kcal: 100 } })).status, 400);
    assert.equal((await createLog(alice, { dateKey: '2026-10-20', entry: { name: '  ', kcal: 100 } })).status, 400);
    assert.equal((await createLog(alice, { dateKey: '2026-10-20', entry: { name: 'x', kcal: -5 } })).status, 400);
    assert.equal((await createLog(alice, { dateKey: '2026-10-20', entry: { name: 'x', kcal: 'lots' } })).status, 400);
    assert.equal((await createLog(alice, { dateKey: '2026-10-20', entry: { name: 'x', protein: 1e9 } })).status, 400);
  });

  test('rejects oversize entries and Mongo operator keys', async () => {
    const items = Array.from({ length: 21 }, (_, i) => ({ name: `item ${i}`, grams: 10 }));
    assert.equal((await createLog(alice, { dateKey: '2026-10-20', entry: { name: 'x', items } })).status, 400);
    assert.equal((await createLog(alice, { dateKey: '2026-10-20', entry: { name: 'x'.repeat(201) } })).status, 400);
    assert.equal((await createLog(alice, { dateKey: '2026-10-20', entry: { name: 'x', note: 'y'.repeat(1001) } })).status, 400);
    assert.equal((await createLog(alice, { dateKey: '2026-10-20', entry: { name: 'x', extra: { $where: '1' } } })).status, 400);
  });
});

describe('PATCH /api/logs/:userId/:logId', () => {
  let logId;

  before(async () => {
    const res = await createLog(alice, { dateKey: '2026-10-21', entry: { name: 'ส้มตำ', meal: 'lunch', kcal: 120, protein: 3, carbs: 20, fat: 2 } });
    assert.equal(res.status, 200);
    logId = res.body.log._id;
  });

  test('updates whitelisted fields and the user.foods mirror', async () => {
    const res = await request('PATCH', `/api/logs/${alice.id}/${logId}`, {
      token: alice.token,
      body: { name: 'ส้มตำไทย', kcal: 150, protein: 4, servings: 1.5, meal: 'dinner' },
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.log.entry.name, 'ส้มตำไทย');
    assert.equal(res.body.log.entry.kcal, 150);
    assert.equal(res.body.log.entry.carbs, 20);
    assert.deepEqual(res.body.log.entry.macros, { protein: 4, carb: 20, fat: 2 });

    const mirror = await api.model('UserFood').findOne({ logId }).lean();
    assert.equal(mirror.foodName, 'ส้มตำไทย');
    assert.equal(mirror.kcal, 150);
    assert.equal(mirror.protein, 4);
  });

  test('cannot move a log to another user or touch non-whitelisted fields', async () => {
    const res = await request('PATCH', `/api/logs/${alice.id}/${logId}`, {
      token: alice.token,
      body: { $set: { userId: bob.id }, userId: bob.id, dateKey: '1999-01-01' },
    });
    assert.equal(res.status, 400);

    const mixed = await request('PATCH', `/api/logs/${alice.id}/${logId}`, {
      token: alice.token,
      body: { kcal: 160, $set: { userId: bob.id }, userId: bob.id },
    });
    assert.equal(mixed.status, 200);

    const stored = await api.model('Log').findById(logId).lean();
    assert.equal(stored.userId, alice.id);
    assert.equal(stored.dateKey, '2026-10-21');
    assert.equal(stored.entry.kcal, 160);
    assert.equal(await api.model('Log').countDocuments({ userId: bob.id }), 0);
  });

  test('another user\'s token is rejected and their own route cannot reach the log', async () => {
    const forbidden = await request('PATCH', `/api/logs/${alice.id}/${logId}`, { token: bob.token, body: { kcal: 1 } });
    assert.equal(forbidden.status, 403);
    const notFound = await request('PATCH', `/api/logs/${bob.id}/${logId}`, { token: bob.token, body: { kcal: 1 } });
    assert.equal(notFound.status, 404);
    const stored = await api.model('Log').findById(logId).lean();
    assert.equal(stored.entry.kcal, 160);
  });

  test('validates numbers and returns 404 for unknown logs', async () => {
    const bad = await request('PATCH', `/api/logs/${alice.id}/${logId}`, { token: alice.token, body: { kcal: -1 } });
    assert.equal(bad.status, 400);
    const huge = await request('PATCH', `/api/logs/${alice.id}/${logId}`, { token: alice.token, body: { grams: Infinity, fat: 5000 } });
    assert.equal(huge.status, 400);
    const missing = await request('PATCH', `/api/logs/${alice.id}/000000000000000000000000`, { token: alice.token, body: { kcal: 1 } });
    assert.equal(missing.status, 404);
    const malformed = await request('PATCH', `/api/logs/${alice.id}/not-an-id`, { token: alice.token, body: { kcal: 1 } });
    assert.equal(malformed.status, 404);
  });
});

describe('POST /api/nutrition/calculate', () => {
  test('rejects more than 50 items', async () => {
    const items = Array.from({ length: 51 }, () => ({ foodId: '1001', grams: 100 }));
    const res = await request('POST', '/api/nutrition/calculate', { body: { items } });
    assert.equal(res.status, 400);
  });

  test('accepts up to 50 items', async () => {
    const items = Array.from({ length: 50 }, () => ({ foodId: 'missing', grams: 100 }));
    const res = await request('POST', '/api/nutrition/calculate', { body: { items } });
    assert.equal(res.status, 200);
    assert.equal(res.body.notFound.length, 50);
  });
});
