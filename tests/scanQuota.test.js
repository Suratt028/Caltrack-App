// The daily scan quota must hold under parallel requests (the old
// count-then-scan check let every simultaneous scan through).
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { reserveScanSlot, getScanQuotaModel } = require('../server/scanQuota');

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'scan-quota-test' });
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

const count = async (userId, dateKey) => (await getScanQuotaModel().findById(`${userId}:${dateKey}`).lean())?.count ?? 0;

describe('reserveScanSlot', () => {
  test('ten parallel scans against a quota of 3 get exactly 3 slots', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => reserveScanSlot({ userId: 'u1', dateKey: '2026-11-13', max: 3 }))
    );
    assert.equal(results.filter(Boolean).length, 3);
    assert.equal(await count('u1', '2026-11-13'), 3);
  });

  test('a failed scan gives its slot back, once', async () => {
    const args = { userId: 'u2', dateKey: '2026-11-13', max: 1 };
    const release = await reserveScanSlot(args);
    assert.ok(release);
    assert.equal(await reserveScanSlot(args), null);
    await release();
    await release(); // second call is a no-op, not a second refund
    assert.equal(await count('u2', '2026-11-13'), 0);
    assert.ok(await reserveScanSlot(args));
  });

  test('a new day and other users have their own counters', async () => {
    assert.ok(await reserveScanSlot({ userId: 'u3', dateKey: '2026-11-13', max: 1 }));
    assert.ok(await reserveScanSlot({ userId: 'u3', dateKey: '2026-11-14', max: 1 }));
    assert.ok(await reserveScanSlot({ userId: 'u4', dateKey: '2026-11-13', max: 1 }));
  });

  test('lowering the quota mid-day blocks further scans', async () => {
    const args = { userId: 'u5', dateKey: '2026-11-13' };
    assert.ok(await reserveScanSlot({ ...args, max: 5 }));
    assert.ok(await reserveScanSlot({ ...args, max: 5 }));
    assert.equal(await reserveScanSlot({ ...args, max: 2 }), null);
  });

  test('counters carry an expiry so Mongo cleans them up', async () => {
    await reserveScanSlot({ userId: 'u6', dateKey: '2026-11-13', max: 1 });
    const doc = await getScanQuotaModel().findById('u6:2026-11-13').lean();
    assert.ok(doc.expiresAt > new Date());
  });
});
