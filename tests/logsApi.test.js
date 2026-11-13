// API tests for food-log writes (POST/PATCH /api/logs) and /api/nutrition/calculate
// input limits, against an in-memory MongoDB.
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApiServer } = require('./helpers/apiServer');

let api;
let request;
let alice;
let bob;
let carol; // for tests that write logs; bob must keep none

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
  carol = await registerUser('carol-logs@caltrack.test');
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

describe('POST /api/logs/:userId with clientId (idempotent retries)', () => {
  before(async () => {
    await api.model('Log').init(); // unique {userId, clientId} index must exist before the race test
  });

  test('a repeated clientId returns the first log instead of saving a copy', async () => {
    const body = { dateKey: '2026-10-22', clientId: '1760000000000_abcde', entry: { name: 'โจ๊ก', kcal: 250 } };
    const first = await createLog(alice, body);
    assert.equal(first.status, 200, JSON.stringify(first.body));
    const again = await createLog(alice, body);
    assert.equal(again.status, 200);
    assert.equal(again.body.duplicate, true);
    assert.equal(again.body.log._id, first.body.log._id);
    assert.equal(again.body.userFood.foodName, 'โจ๊ก');
    assert.equal(await api.model('Log').countDocuments({ userId: alice.id, clientId: body.clientId }), 1);
    assert.equal(await api.model('UserFood').countDocuments({ logId: first.body.log._id }), 1);
  });

  test('parallel copies of one request still store a single log', async () => {
    const body = { dateKey: '2026-10-22', clientId: 'race-0000-0001', entry: { name: 'ชาเย็น', kcal: 180 } };
    const results = await Promise.all(Array.from({ length: 5 }, () => createLog(alice, body)));
    assert.ok(results.every((r) => r.status === 200), JSON.stringify(results.map((r) => r.status)));
    assert.equal(new Set(results.map((r) => r.body.log._id)).size, 1);
    assert.equal(await api.model('Log').countDocuments({ userId: alice.id, clientId: body.clientId }), 1);
  });

  test('the same clientId from another user is a separate log', async () => {
    const body = { dateKey: '2026-10-22', clientId: 'shared-id-0001', entry: { name: 'ไข่ต้ม', kcal: 75 } };
    const a = await createLog(alice, body);
    const b = await createLog(carol, body);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.notEqual(a.body.log._id, b.body.log._id);
  });

  test('rejects a malformed clientId', async () => {
    for (const clientId of ['short', 'x'.repeat(65), 'has space 123', { $gt: '' }, 12345678]) {
      const res = await createLog(alice, { dateKey: '2026-10-22', clientId, entry: { name: 'x', kcal: 1 } });
      assert.equal(res.status, 400, JSON.stringify(clientId));
    }
  });
});

describe('GET /api/logs/:userId date range', () => {
  before(async () => {
    for (const dateKey of ['2026-09-01', '2026-09-15', '2026-09-30']) {
      const res = await createLog(carol, { dateKey, entry: { name: `meal ${dateKey}`, kcal: 100 } });
      assert.equal(res.status, 200);
    }
  });

  test('without from/to returns every log (what the app expects today)', async () => {
    const res = await request('GET', `/api/logs/${carol.id}`, { token: carol.token });
    assert.equal(res.status, 200);
    assert.ok(res.body.logs.length >= 3);
  });

  test('from/to are inclusive', async () => {
    const res = await request('GET', `/api/logs/${carol.id}?from=2026-09-15&to=2026-09-30`, { token: carol.token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.logs.map((l) => l.dateKey), ['2026-09-30', '2026-09-15']);
    const onlyFrom = await request('GET', `/api/logs/${carol.id}?from=2026-09-30`, { token: carol.token });
    assert.ok(onlyFrom.body.logs.every((l) => l.dateKey >= '2026-09-30'));
  });

  test('rejects bad dates, reversed and over-long ranges', async () => {
    for (const query of ['from=2026-9-1', 'to=yesterday', 'from[$gt]=', 'from=2026-09-30&to=2026-09-01', 'from=2025-01-01&to=2026-09-01']) {
      const res = await request('GET', `/api/logs/${carol.id}?${query}`, { token: carol.token });
      assert.equal(res.status, 400, query);
    }
  });
});

describe('request body limits', () => {
  test('ordinary routes refuse bodies over 1 MB', async () => {
    const res = await createLog(alice, { dateKey: '2026-10-22', entry: { name: 'x', note: 'y'.repeat(1.5 * 1024 * 1024) } });
    assert.equal(res.status, 413);
  });

  test('the scan route checks the token before reading a large photo body', async () => {
    const imageBase64 = 'A'.repeat(3 * 1024 * 1024);
    const anonymous = await request('POST', '/api/ai/scan', { body: { imageBase64 } });
    assert.equal(anonymous.status, 401);
    // Signed in, the 3 MB body is accepted; the test server has no Gemini key, hence 503.
    const signedIn = await request('POST', '/api/ai/scan', { token: alice.token, body: { imageBase64 } });
    assert.equal(signedIn.status, 503);
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
