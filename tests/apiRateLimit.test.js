// Sign-in rate limits. Separate from api.test.js because the counters live in
// the server process and would otherwise eat into that file's login budget.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApiServer } = require('./helpers/apiServer');

let api;

before(async () => {
  api = await startApiServer();
});

after(async () => {
  await api?.stop();
});

function assertRateLimited(res) {
  assert.equal(res.status, 429);
  assert.equal(res.body.code, 'RATE_LIMITED');
  const retryAfter = Number(res.headers.get('retry-after'));
  assert.ok(Number.isInteger(retryAfter) && retryAfter > 0, `Retry-After was ${res.headers.get('retry-after')}`);
}

test('the 11th bad login for one account returns 429 with Retry-After', async () => {
  const login = (email, password) => api.request('POST', '/api/auth/login', { body: { email, password } });
  const registered = await api.request('POST', '/api/auth/register', { body: { email: 'target@caltrack.test', password: 'right-pass-1' } });
  assert.equal(registered.status, 200);

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    assert.equal((await login('target@caltrack.test', `wrong-${attempt}`)).status, 401, `attempt ${attempt}`);
  }
  assertRateLimited(await login('target@caltrack.test', 'wrong-11'));
  // Once limited, even the right password is refused for that account...
  assertRateLimited(await login('target@caltrack.test', 'right-pass-1'));
  // ...while other accounts from the same IP are still under the per-IP limit.
  assert.equal((await login('someone-else@caltrack.test', 'whatever')).status, 401);
});

test('the 6th admin login attempt returns 429 with Retry-After', async () => {
  const adminLogin = (password) => api.request('POST', '/api/admin/login', { body: { email: api.env.ADMIN_EMAIL, password } });

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assert.equal((await adminLogin(`wrong-${attempt}`)).status, 401, `attempt ${attempt}`);
  }
  assertRateLimited(await adminLogin('wrong-6'));
  assertRateLimited(await adminLogin(api.env.ADMIN_PASSWORD));
});
