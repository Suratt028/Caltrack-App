// Rate limiter store: shared counters through Redis (ioredis-mock runs the same
// Lua script), and the per-process fallback when Redis is missing or failing.
const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const RedisMock = require('ioredis-mock');
const { createRateLimiter } = require('../server/rateLimit');

function fakeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    set(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

// Runs one request through the middleware; resolves to 'next' or the 429 response.
function hit(middleware, req = { ip: '203.0.113.7', body: {} }) {
  return new Promise((resolve, reject) => {
    const res = fakeRes();
    const origJson = res.json.bind(res);
    res.json = (body) => { origJson(body); resolve(res); return res; };
    middleware(req, res, (error) => (error ? reject(error) : resolve('next')));
  });
}

const LIMIT = { name: 'login-ip', windowMs: 60_000, max: 3, keyFn: (req) => req.ip };

describe('with Redis', () => {
  let redis;
  beforeEach(async () => {
    redis = new RedisMock();
    await redis.flushall();
  });

  test('two server instances share one budget', async () => {
    // Each instance builds its own limiter, like two Node processes, but both talk to the same Redis.
    const serverA = createRateLimiter({ redis })(LIMIT);
    const serverB = createRateLimiter({ redis })(LIMIT);
    assert.equal(await hit(serverA), 'next');
    assert.equal(await hit(serverB), 'next');
    assert.equal(await hit(serverA), 'next');
    const limited = await hit(serverB);
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.body.code, 'RATE_LIMITED');
    const retryAfter = Number(limited.headers['retry-after']);
    assert.ok(retryAfter >= 1 && retryAfter <= 60, `Retry-After ${retryAfter}`);
  });

  test('different IPs and different limit names count separately', async () => {
    const limiter = createRateLimiter({ redis });
    const login = limiter(LIMIT);
    const register = limiter({ ...LIMIT, name: 'register' });
    for (let i = 0; i < 3; i += 1) await hit(login);
    assert.equal((await hit(login)).statusCode, 429);
    assert.equal(await hit(login, { ip: '198.51.100.1', body: {} }), 'next');
    assert.equal(await hit(register), 'next');
  });

  test('keys expire with the window and never contain the raw IP or email', async () => {
    const limiter = createRateLimiter({ redis })({ ...LIMIT, keyFn: (req) => `${req.ip}:${req.body.email}` });
    await hit(limiter, { ip: '203.0.113.7', body: { email: 'alice@example.com' } });
    const keys = await redis.keys('*');
    assert.equal(keys.length, 1);
    assert.ok(!keys[0].includes('203.0.113.7') && !keys[0].includes('alice'), keys[0]);
    const ttl = await redis.pttl(keys[0]);
    assert.ok(ttl > 0 && ttl <= 60_000, `ttl ${ttl}`);
  });

  test('when Redis fails, requests still go through a per-process limit', async () => {
    const warnings = [];
    const broken = { defineCommand() {}, caltrackRateLimitHit: async () => { throw new Error('Connection is closed.'); } };
    const limiter = createRateLimiter({ redis: broken, warn: (m) => warnings.push(m) })(LIMIT);
    for (let i = 0; i < 3; i += 1) assert.equal(await hit(limiter), 'next');
    assert.equal((await hit(limiter)).statusCode, 429);
    assert.equal(warnings.length, 1, 'warns once per minute, not per request');
    assert.match(warnings[0], /Redis unavailable/);
  });
});

describe('without Redis', () => {
  test('counts in memory and starts a fresh window after it ends', async () => {
    const limiter = createRateLimiter()({ ...LIMIT, windowMs: 50 });
    for (let i = 0; i < 3; i += 1) assert.equal(await hit(limiter), 'next');
    assert.equal((await hit(limiter)).statusCode, 429);
    await new Promise((resolve) => setTimeout(resolve, 70));
    assert.equal(await hit(limiter), 'next');
  });
});
