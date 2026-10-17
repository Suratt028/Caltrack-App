const test = require('node:test');
const assert = require('node:assert/strict');
const { requestWithGeminiFallback } = require('../server/geminiScanRequest');

test('retries a transient error with backoff, then uses the fallback model', async () => {
  const calls = [];
  const delays = [];
  const result = await requestWithGeminiFallback(
    ['primary', 'fallback'],
    async (model) => {
      calls.push(model);
      if (model === 'primary') {
        const error = new Error('temporarily unavailable');
        error.status = 503;
        throw error;
      }
      return { model };
    },
    { delay: async (milliseconds) => delays.push(milliseconds) }
  );

  assert.deepEqual(calls, ['primary', 'primary', 'fallback']);
  assert.deepEqual(delays, [500, 1000]);
  assert.deepEqual(result, { model: 'fallback' });
});

test('does not retry or fall back for permanent request errors', async () => {
  const calls = [];
  const delays = [];
  const request = async (model) => {
    calls.push(model);
    const error = new Error('invalid request');
    error.status = 400;
    throw error;
  };

  await assert.rejects(
    requestWithGeminiFallback(
      ['primary', 'fallback'],
      request,
      { delay: async (milliseconds) => delays.push(milliseconds) }
    ),
    { status: 400 }
  );
  assert.deepEqual(calls, ['primary']);
  assert.deepEqual(delays, []);
});

test('moves to the next model when the configured model is not found', async () => {
  const calls = [];
  const result = await requestWithGeminiFallback(
    ['missing', 'available'],
    async (model) => {
      calls.push(model);
      if (model === 'missing') {
        const error = new Error('not found');
        error.status = 404;
        throw error;
      }
      return { model };
    },
    { delay: async () => {} }
  );

  assert.deepEqual(calls, ['missing', 'available']);
  assert.deepEqual(result, { model: 'available' });
});
