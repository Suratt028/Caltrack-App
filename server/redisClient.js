// Optional Redis connection (REDIS_URL). Returns null when not configured.
//
// Tuned to fail fast rather than queue: if Redis is unreachable, commands
// reject immediately and callers (the rate limiter) fall back to memory,
// instead of hanging sign-in requests while ioredis reconnects.
const Redis = require('ioredis');

const ERROR_LOG_INTERVAL_MS = 60 * 1000;

function createRedisClient(url, { RedisClass = Redis, log = console } = {}) {
  if (!url) return null;

  const client = new RedisClass(url, {
    enableOfflineQueue: false, // no buffering while disconnected
    maxRetriesPerRequest: 1,
    commandTimeout: 500,
    connectTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 500, 10000), // keep reconnecting, at most every 10 s
  });

  let lastErrorLogAt = 0;
  client.on('ready', () => log.log('✅ Redis connected (shared rate limits)'));
  client.on('error', (error) => {
    const now = Date.now();
    if (now - lastErrorLogAt < ERROR_LOG_INTERVAL_MS) return;
    lastErrorLogAt = now;
    log.warn(`⚠️ Redis error: ${error.message}`);
  });
  return client;
}

module.exports = { createRedisClient };
