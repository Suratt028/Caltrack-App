// API tests for server.js auth and permission rules, against an in-memory MongoDB.
// Rate limits are per process and keyed by IP, so this file stays under the
// register (5/hour) and login (30/15 min) limits; tests/apiRateLimit.test.js
// exercises the limits themselves.
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApiServer, legacyPasswordHash } = require('./helpers/apiServer');

let api;
let request;
let adminToken;

async function registerUser(email, password = 'secret123') {
  const res = await request('POST', '/api/auth/register', { body: { email, password, displayName: email.split('@')[0] } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return { id: res.body.user.id, email, password, token: res.body.user.token };
}

async function adminLogin(email, password) {
  const res = await request('POST', '/api/admin/login', { body: { email, password } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.token;
}

before(async () => {
  api = await startApiServer();
  request = api.request;
  adminToken = await adminLogin(api.env.ADMIN_EMAIL, api.env.ADMIN_PASSWORD);
});

after(async () => {
  await api?.stop();
});

describe('auth: register and login', () => {
  test('register and login both return a user token', async () => {
    const user = await registerUser('reg@caltrack.test', 'pass-1234');
    assert.ok(user.token);

    const login = await request('POST', '/api/auth/login', { body: { email: 'REG@caltrack.test', password: 'pass-1234' } });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.id, user.id);
    assert.equal(login.body.user.role, 'user');
    assert.ok(login.body.user.token);
    assert.equal(login.body.user.adminToken, undefined);

    const stored = await api.model('User').findById(user.id).lean();
    assert.match(stored.password, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  });

  test('login rejects a wrong password', async () => {
    const res = await request('POST', '/api/auth/login', { body: { email: 'reg@caltrack.test', password: 'wrong-pass' } });
    assert.equal(res.status, 401);
    assert.equal(res.body.user, undefined);
  });

  test('a legacy HMAC password still logs in and is upgraded to scrypt', async () => {
    const User = api.model('User');
    const legacy = await User.create({ email: 'legacy@caltrack.test', password: legacyPasswordHash('old-pass-1'), displayName: 'Legacy' });

    const first = await request('POST', '/api/auth/login', { body: { email: 'legacy@caltrack.test', password: 'old-pass-1' } });
    assert.equal(first.status, 200);
    assert.ok(first.body.user.token);

    const stored = await User.findById(legacy._id).lean();
    assert.match(stored.password, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);

    const second = await request('POST', '/api/auth/login', { body: { email: 'legacy@caltrack.test', password: 'old-pass-1' } });
    assert.equal(second.status, 200);
  });
});

describe('per-user data (requireSelf)', () => {
  let alice;
  let bob;

  before(async () => {
    alice = await registerUser('alice@caltrack.test');
    bob = await registerUser('bob@caltrack.test');
  });

  const routes = [
    ['GET', (id) => `/api/logs/${id}`],
    ['GET', (id) => `/api/profiles/${id}`],
    ['GET', (id) => `/api/weights/${id}`],
    ['DELETE', (id) => `/api/users/${id}/data`],
  ];

  for (const [method, path] of routes) {
    const label = `${method} ${path(':userId')}`;

    test(`${label}: 401 without a token`, async () => {
      const res = await request(method, path(alice.id));
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_REQUIRED');
    });

    test(`${label}: 401 with a forged token`, async () => {
      const [payload] = alice.token.split('.');
      const res = await request(method, path(alice.id), { token: `${payload}.not-the-signature` });
      assert.equal(res.status, 401);
    });

    test(`${label}: 403 with another user's token`, async () => {
      const res = await request(method, path(alice.id), { token: bob.token });
      assert.equal(res.status, 403);
    });

    test(`${label}: 200 for the owner`, async () => {
      const res = await request(method, path(alice.id), { token: alice.token });
      assert.equal(res.status, 200);
    });

    test(`${label}: 200 for an admin`, async () => {
      const res = await request(method, path(alice.id), { token: adminToken });
      assert.equal(res.status, 200);
    });
  }

  test('writes to another user\'s data are rejected and leave nothing behind', async () => {
    const log = await request('POST', `/api/logs/${alice.id}`, { token: bob.token, body: { entry: { name: 'x', kcal: 1 } } });
    assert.equal(log.status, 403);
    const profile = await request('PUT', `/api/profiles/${alice.id}`, { token: bob.token, body: { name: 'hijacked' } });
    assert.equal(profile.status, 403);
    const weight = await request('PUT', `/api/weights/${alice.id}/2026-10-20`, { token: bob.token, body: { weightKg: 70 } });
    assert.equal(weight.status, 403);

    assert.equal(await api.model('Log').countDocuments({ userId: alice.id }), 0);
    assert.equal(await api.model('Profile').countDocuments({ userId: alice.id }), 0);
    assert.equal(await api.model('WeightLog').countDocuments({ userId: alice.id }), 0);
  });

  describe('tickets', () => {
    let aliceTicket;

    test('a user creates tickets as themselves, whatever the body says', async () => {
      const res = await request('POST', '/api/tickets', {
        token: alice.token,
        body: { topic: 'Bug', detail: 'broken', userEmail: bob.email, userId: bob.id },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.ticket.userEmail, alice.email);
      assert.equal(res.body.ticket.userId, alice.id);
      aliceTicket = res.body.ticket;

      const bobRes = await request('POST', '/api/tickets', { token: bob.token, body: { topic: 'Question' } });
      assert.equal(bobRes.status, 201);
      assert.equal(bobRes.body.ticket.userEmail, bob.email);
    });

    test('creating or listing tickets requires a token', async () => {
      assert.equal((await request('POST', '/api/tickets', { body: { topic: 'x', userEmail: 'a@b.c' } })).status, 401);
      assert.equal((await request('GET', '/api/tickets')).status, 401);
    });

    test('a user only sees their own tickets, even when asking for another email', async () => {
      const res = await request('GET', `/api/tickets?email=${encodeURIComponent(bob.email)}`, { token: alice.token });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.tickets.map((t) => t.userEmail), [alice.email]);

      const bobRes = await request('GET', '/api/tickets', { token: bob.token });
      assert.deepEqual(bobRes.body.tickets.map((t) => t.userEmail), [bob.email]);
    });

    test('an admin sees all tickets', async () => {
      const res = await request('GET', '/api/tickets', { token: adminToken });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.tickets.map((t) => t.userEmail).sort(), [alice.email, bob.email].sort());
    });

    test('PATCH and DELETE need an admin token', async () => {
      const id = aliceTicket.ticketId;
      assert.equal((await request('PATCH', `/api/tickets/${id}`, { body: { status: 'Resolved' } })).status, 401);
      assert.equal((await request('PATCH', `/api/tickets/${id}`, { token: alice.token, body: { status: 'Resolved' } })).status, 401);
      assert.equal((await request('DELETE', `/api/tickets/${id}`, { token: alice.token })).status, 401);
      const unchanged = await api.model('Ticket').findOne({ ticketId: id }).lean();
      assert.equal(unchanged.status, 'Open');

      const patched = await request('PATCH', `/api/tickets/${id}`, { token: adminToken, body: { status: 'Resolved' } });
      assert.equal(patched.status, 200);
      assert.equal(patched.body.ticket.status, 'Resolved');
      const deleted = await request('DELETE', `/api/tickets/${id}`, { token: adminToken });
      assert.equal(deleted.status, 200);
      assert.equal(await api.model('Ticket').countDocuments({ ticketId: id }), 0);
    });
  });

  test('POST /api/ai/scan returns 401 without a token', async () => {
    const res = await request('POST', '/api/ai/scan', { body: { imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg' } });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_REQUIRED');
    assert.equal(await api.model('ScanLog').countDocuments(), 0);
  });

  test('admin routes reject user tokens', async () => {
    assert.equal((await request('GET', '/api/admin/users')).status, 401);
    assert.equal((await request('GET', '/api/admin/users', { token: alice.token })).status, 401);
    assert.equal((await request('GET', '/api/admin/users', { token: adminToken })).status, 200);
  });
});

describe('admin user management guards', () => {
  let adminId;

  before(async () => {
    adminId = String((await api.model('User').findOne({ email: api.env.ADMIN_EMAIL }).lean())._id);
  });

  test('an admin cannot delete or demote themselves', async () => {
    const del = await request('DELETE', `/api/admin/users/${adminId}`, { token: adminToken });
    assert.equal(del.status, 400);
    const demote = await request('PATCH', `/api/admin/users/${adminId}`, { token: adminToken, body: { role: 'user' } });
    assert.equal(demote.status, 400);
    const stored = await api.model('User').findById(adminId).lean();
    assert.equal(stored.role, 'admin');
  });

  test('the last admin cannot be deleted or demoted', async () => {
    const created = await request('POST', '/api/admin/users', {
      token: adminToken,
      body: { email: 'second-admin@caltrack.test', password: 'second-pass-1', role: 'admin' },
    });
    assert.equal(created.status, 201);
    const secondToken = await adminLogin('second-admin@caltrack.test', 'second-pass-1');

    // Two admins: demoting the second one is allowed.
    const demote = await request('PATCH', `/api/admin/users/${created.body.user._id}`, { token: adminToken, body: { role: 'user' } });
    assert.equal(demote.status, 200);
    assert.equal(demote.body.user.role, 'user');

    // Its still-valid admin token now targets the only admin left.
    const del = await request('DELETE', `/api/admin/users/${adminId}`, { token: secondToken });
    assert.equal(del.status, 400);
    assert.match(del.body.error, /at least one admin/i);
    const demoteLast = await request('PATCH', `/api/admin/users/${adminId}`, { token: secondToken, body: { role: 'user' } });
    assert.equal(demoteLast.status, 400);

    const stored = await api.model('User').findById(adminId).lean();
    assert.equal(stored.role, 'admin');
  });

  test('deleting a user removes their profile, logs, weights and user.foods', async () => {
    const victim = await registerUser('victim@caltrack.test');
    const auth = { token: victim.token };
    assert.equal((await request('PUT', `/api/profiles/${victim.id}`, { ...auth, body: { name: 'Victim', kcalGoal: 2000 } })).status, 200);
    assert.equal((await request('POST', `/api/logs/${victim.id}`, { ...auth, body: { dateKey: '2026-10-20', entry: { name: 'Rice', kcal: 200 } } })).status, 200);
    assert.equal((await request('PUT', `/api/weights/${victim.id}/2026-10-20`, { ...auth, body: { weightKg: 65 } })).status, 200);

    const models = ['Profile', 'Log', 'WeightLog', 'UserFood'];
    for (const name of models) {
      assert.equal(await api.model(name).countDocuments({ userId: victim.id }), 1, `${name} before delete`);
    }

    const res = await request('DELETE', `/api/admin/users/${victim.id}`, { token: adminToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.password, undefined);

    assert.equal(await api.model('User').countDocuments({ _id: victim.id }), 0);
    for (const name of models) {
      assert.equal(await api.model(name).countDocuments({ userId: victim.id }), 0, `${name} after delete`);
    }
  });
});

describe('maintenance mode', () => {
  const setMaintenance = (maintenanceMode) => request('PUT', '/api/admin/system-settings', {
    token: adminToken,
    body: { maxFreeScansPerDay: 0, maintenanceMode },
  });

  test('returns 503 MAINTENANCE for app routes but not /api/admin or /api/auth/login', async () => {
    const user = await api.model('User').findOne({ email: 'alice@caltrack.test' }).lean();
    const userId = String(user._id);
    const login = await request('POST', '/api/auth/login', { body: { email: 'alice@caltrack.test', password: 'secret123' } });
    const userToken = login.body.user.token;

    assert.equal((await setMaintenance(true)).status, 200);
    try {
      const logs = await request('GET', `/api/logs/${userId}`, { token: userToken });
      assert.equal(logs.status, 503);
      assert.equal(logs.body.code, 'MAINTENANCE');
      const register = await request('POST', '/api/auth/register', { body: { email: 'late@caltrack.test', password: 'secret123' } });
      assert.equal(register.status, 503);
      assert.equal(register.body.code, 'MAINTENANCE');

      const admin = await request('GET', '/api/admin/users', { token: adminToken });
      assert.equal(admin.status, 200);
      const signIn = await request('POST', '/api/auth/login', { body: { email: 'alice@caltrack.test', password: 'secret123' } });
      assert.equal(signIn.status, 200);
      assert.ok(signIn.body.user.token);
    } finally {
      assert.equal((await setMaintenance(false)).status, 200);
    }

    const resumed = await request('GET', `/api/logs/${userId}`, { token: userToken });
    assert.equal(resumed.status, 200);
  });
});
