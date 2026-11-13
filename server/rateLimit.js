// Fixed-window rate limiter shared by every server instance through Redis.
//
// With the old per-process Map, three instances behind a load balancer meant
// three separate budgets (30 login attempts became 90). Counting in Redis
// gives one budget for the whole cluster.
//
// If Redis is not configured (local dev, tests) or is down, each process falls
// back to its own in-memory counters: weaker, but sign-in keeps working and
// still has per-process brute-force protection. We fail "open to memory"
// rather than fully open (no limit) or closed (nobody can log in).
const crypto = require('crypto');

// INCR the window counter; the first hit starts the window. Returns {count, ttlMs}.
// The PTTL < 0 branch repairs a key that somehow lost its expiry, so it can't
// lock someone out forever.
const HIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

const FALLBACK_WARN_INTERVAL_MS = 60 * 1000;

function createMemoryStore() {
  const windows = new Map(); // key -> { count, resetAt }
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of windows) if (entry.resetAt <= now) windows.delete(key);
  }, 60 * 1000);
  sweep.unref();

  return {
    async hit(key, windowMs) {
      const now = Date.now();
      let entry = windows.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        windows.set(key, entry);
      }
      entry.count += 1;
      return { count: entry.count, resetAt: entry.resetAt };
    },
  };
}

function createRedisStore(redis) {
  if (typeof redis.caltrackRateLimitHit !== 'function') {
    redis.defineCommand('caltrackRateLimitHit', { numberOfKeys: 1, lua: HIT_SCRIPT });
  }
  return {
    async hit(key, windowMs) {
      const [count, ttlMs] = await redis.caltrackRateLimitHit(key, String(windowMs));
      return { count: Number(count), resetAt: Date.now() + Number(ttlMs) };
    },
  };
}

// Keys hold IPs and emails; hash them so Redis never stores either in the clear.
function hashKey(raw) {
  return crypto.createHash('sha256').update(raw).digest('base64url').slice(0, 32);
}

/**
 * @param {object} [options]
 * @param {import('ioredis').Redis|null} [options.redis]  shared client, or null for memory only
 * @param {string} [options.prefix]  namespace for Redis keys
 * @param {(message: string) => void} [options.warn]
 */
function createRateLimiter({ redis = null, prefix = 'caltrack:rl', warn = console.warn } = {}) {
  const memory = createMemoryStore();
  const shared = redis ? createRedisStore(redis) : null;
  let lastFallbackWarnAt = 0;

  async function hit(key, windowMs) {
    if (shared) {
      try {
        return await shared.hit(key, windowMs);
      } catch (error) {
        const now = Date.now();
        if (now - lastFallbackWarnAt >= FALLBACK_WARN_INTERVAL_MS) {
          lastFallbackWarnAt = now;
          warn(`Rate limiter: Redis unavailable (${error.message}); using per-process limits until it recovers.`);
        }
      }
    }
    return memory.hit(key, windowMs);
  }

  return function rateLimit({ name, windowMs, max, keyFn, message }) {
    return async (req, res, next) => {
      let result;
      try {
        result = await hit(`${prefix}:${name}:${hashKey(String(keyFn(req)))}`, windowMs);
      } catch (error) {
        return next(error);
      }
      if (result.count <= max) return next();

      const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: message || `พยายามบ่อยเกินไป กรุณารอ ${Math.ceil(retryAfterSec / 60)} นาทีแล้วลองใหม่`,
        code: 'RATE_LIMITED',
      });
    };
  };
}

module.exports = { createRateLimiter, HIT_SCRIPT };
