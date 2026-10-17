const test = require('node:test');
const assert = require('node:assert/strict');
const { getGeminiScanError } = require('../server/geminiScanError');

test('explains Gemini quota and rate limit failures without exposing upstream details', () => {
  assert.deepEqual(getGeminiScanError({ status: 429, message: 'private upstream detail' }), {
    code: 'AI_RATE_LIMITED',
    error: 'ขณะนี้มีการใช้งาน AI มากเกินไป กรุณารอสักครู่แล้วลองใหม่',
  });
});

test('explains Gemini authentication and model configuration failures', () => {
  assert.equal(getGeminiScanError({ status: 403 }).code, 'AI_CONFIGURATION_ERROR');
  assert.equal(getGeminiScanError({ status: 404 }).code, 'AI_MODEL_UNAVAILABLE');
});

test('distinguishes timeouts and temporary Gemini outages', () => {
  assert.equal(getGeminiScanError({ name: 'AbortError' }).code, 'AI_REQUEST_TIMEOUT');
  assert.equal(getGeminiScanError({ status: 503 }).code, 'AI_TEMPORARILY_UNAVAILABLE');
});
