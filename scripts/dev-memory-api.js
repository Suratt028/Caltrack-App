// Runs server.js against a throwaway in-memory MongoDB on PORT (default 3099),
// for trying auth flows (e.g. forgot password) without touching the real database.
// Reset codes are printed to this console because SMTP_HOST is cleared.
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    MONGODB_URI: mongod.getUri(),
    MONGODB_DB_NAME: 'caltrack-dev-memory',
    SMTP_HOST: '',
    GEMINI_API_KEY: '',
  });
  const port = Number(process.env.DEV_MEMORY_API_PORT) || 3099;
  const mongoose = require('mongoose');
  const { app } = require('../server');
  await mongoose.connect(mongod.getUri(), { dbName: process.env.MONGODB_DB_NAME });
  app.listen(port, () => console.log(`🧪 In-memory API on http://localhost:${port}/api`));
})();
