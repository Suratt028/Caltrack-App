// Boots server.js against a throwaway in-memory MongoDB for API tests.
// Each test file runs in its own process (node --test), so each gets its own
// database and its own in-memory rate-limit counters.
const crypto = require('crypto');
const { once } = require('events');
const { MongoMemoryServer } = require('mongodb-memory-server');

const TEST_ENV = {
  AUTH_SECRET: 'test-auth-secret-0123456789abcdef0123456789abcdef',
  ADMIN_EMAIL: 'admin@caltrack.test',
  ADMIN_PASSWORD: 'Admin-Test-Pass-1',
  MONGODB_DB_NAME: 'caltrack-test',
  // Empty so /api/ai/scan can never reach Gemini.
  GEMINI_API_KEY: '',
};

async function startApiServer() {
  const mongod = await MongoMemoryServer.create();
  // Set before server.js loads: dotenv never overrides existing variables, so
  // values from a local .env (including the real MONGODB_URI) are ignored.
  Object.assign(process.env, TEST_ENV, { MONGODB_URI: mongod.getUri() });

  const mongoose = require('mongoose');
  const { app } = require('../../server');
  await mongoose.connect(mongod.getUri(), { dbName: TEST_ENV.MONGODB_DB_NAME });

  // server.js creates the configured admin account from its 'connected' handler.
  const User = mongoose.model('User');
  for (let i = 0; !(await User.exists({ email: TEST_ENV.ADMIN_EMAIL })); i += 1) {
    if (i > 100) throw new Error('admin account was not created');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, { token, body } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Non-JSON body; tests read status/headers only.
    }
    return { status: response.status, headers: response.headers, body: json };
  }

  async function stop() {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongod.stop();
  }

  return { request, stop, mongoose, model: (name) => mongoose.model(name), env: TEST_ENV };
}

// The pre-scrypt password format: unsalted HMAC-SHA256 keyed with AUTH_SECRET.
function legacyPasswordHash(password) {
  return crypto.createHmac('sha256', TEST_ENV.AUTH_SECRET).update(password).digest('hex');
}

module.exports = { startApiServer, legacyPasswordHash };
