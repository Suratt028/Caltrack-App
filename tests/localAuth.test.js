const assert = require('node:assert/strict');
const { registerLocalUser, loginLocalUser } = require('../src/services/localAuth');

(async () => {
  const memory = {};

  const user = await registerLocalUser(
    {
      email: 'demo@caltrack.app',
      password: 'demo1234',
      displayName: 'Demo User',
      storage: {
        getItem: async (key) => (key in memory ? memory[key] : null),
        setItem: async (key, value) => {
          memory[key] = value;
        },
        removeItem: async (key) => {
          delete memory[key];
        },
      },
    }
  );

  assert.equal(user.email, 'demo@caltrack.app');
  assert.equal(user.displayName, 'Demo User');

  const loggedIn = await loginLocalUser({
    email: 'demo@caltrack.app',
    password: 'demo1234',
    storage: {
      getItem: async (key) => (key in memory ? memory[key] : null),
      setItem: async (key, value) => {
        memory[key] = value;
      },
      removeItem: async (key) => {
        delete memory[key];
      },
    },
  });

  assert.equal(loggedIn.email, 'demo@caltrack.app');
  console.log('localAuth fallback test passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
