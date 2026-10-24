// API tests for "forgot password": /api/auth/forgot-password emails a 6-digit
// code, /api/auth/reset-password trades it for a new password. The mail sender
// is swapped for one that records the code. forgot-password allows 5 requests
// per 15 min per IP, so this file makes at most 5.
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApiServer, legacyPasswordHash } = require('./helpers/apiServer');

let api;
let request;
const sent = [];

async function forgot(email) {
  const res = await request('POST', '/api/auth/forgot-password', { body: { email } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return sent.filter((mail) => mail.to === email.toLowerCase()).at(-1)?.code;
}

const reset = (email, code, password) =>
  request('POST', '/api/auth/reset-password', { body: { email, code, password } });
const login = (email, password) => request('POST', '/api/auth/login', { body: { email, password } });
const wrongCode = (code) => (code === '000000' ? '111111' : '000000');

before(async () => {
  api = await startApiServer();
  request = api.request;
  require('../server').setPasswordResetSender(async (mail) => {
    sent.push(mail);
  });
});

after(async () => {
  await api?.stop();
});

describe('forgot password', () => {
  test('a legacy-hash account can reset its password with the emailed code', async () => {
    await api.model('User').create({ email: 'old@caltrack.test', password: legacyPasswordHash('lost-pass'), displayName: 'Old' });

    const code = await forgot('OLD@caltrack.test');
    assert.match(code, /^\d{6}$/);
    assert.equal(sent.at(-1).minutes, 15);

    const res = await reset('old@caltrack.test', code, 'brand-new-1');
    assert.equal(res.status, 200, JSON.stringify(res.body));

    assert.equal((await login('old@caltrack.test', 'brand-new-1')).status, 200);
    assert.equal((await login('old@caltrack.test', 'lost-pass')).status, 401);

    const again = await reset('old@caltrack.test', code, 'another-pass');
    assert.equal(again.status, 400, 'a code works only once');
    assert.equal(again.body.code, 'INVALID_RESET_CODE');
  });

  test('an unknown email gets the same reply and no mail', async () => {
    const before = sent.length;
    const res = await request('POST', '/api/auth/forgot-password', { body: { email: 'nobody@caltrack.test' } });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true });
    assert.equal(sent.length, before);

    const resetRes = await reset('nobody@caltrack.test', '123456', 'whatever-1');
    assert.equal(resetRes.status, 400);
  });

  test('five wrong codes burn the code', async () => {
    await api.model('User').create({ email: 'guess@caltrack.test', password: legacyPasswordHash('x-pass-1') });
    const code = await forgot('guess@caltrack.test');

    for (let i = 0; i < 5; i += 1) {
      const res = await reset('guess@caltrack.test', wrongCode(code), 'new-pass-1');
      assert.equal(res.status, 400);
    }
    const right = await reset('guess@caltrack.test', code, 'new-pass-1');
    assert.equal(right.status, 400, 'the right code no longer works after 5 misses');
    assert.equal((await login('guess@caltrack.test', 'new-pass-1')).status, 401);
  });

  test('rejects a short new password and an expired code', async () => {
    await api.model('User').create({ email: 'short@caltrack.test', password: legacyPasswordHash('x-pass-1') });
    const code = await forgot('short@caltrack.test');

    const short = await reset('short@caltrack.test', code, '123');
    assert.equal(short.status, 400);
    assert.match(short.body.error, /at least 6/);

    await api.model('PasswordReset').updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const expired = await reset('short@caltrack.test', code, 'long-enough-1');
    assert.equal(expired.status, 400);
    assert.equal(expired.body.code, 'INVALID_RESET_CODE');
  });

  test('the .env admin is never sent a code', async () => {
    const before = sent.length;
    const res = await request('POST', '/api/auth/forgot-password', { body: { email: api.env.ADMIN_EMAIL } });
    assert.equal(res.status, 200);
    assert.equal(sent.length, before);
  });
});
