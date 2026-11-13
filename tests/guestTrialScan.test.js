// Guest trial scan (/api/ai/scan/trial). Own file so its per-IP counter starts at zero.
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

const tinyImage = { imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg' };

test('the signed-in scan route still requires a token', async () => {
  const res = await api.request('POST', '/api/ai/scan', { body: tinyImage });
  assert.equal(res.status, 401);
});

test('guests reach the scanner without a token, then hit the daily limit', async () => {
  // GEMINI_API_KEY is empty in tests, so a request that gets past auth and validation stops at 503.
  const trial = (body) => api.request('POST', '/api/ai/scan/trial', { body });

  assert.equal((await trial({})).status, 400, 'body is still validated');
  assert.equal((await trial(tinyImage)).status, 503);
  assert.equal((await trial(tinyImage)).status, 503);

  const limited = await trial(tinyImage);
  assert.equal(limited.status, 429);
  assert.equal(limited.body.code, 'RATE_LIMITED');
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
});
