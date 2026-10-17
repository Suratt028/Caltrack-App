require('dotenv').config();
const mongoose = require('mongoose');

// Turn on verbose query/command logging
mongoose.set('debug', true);

// Log every connection state change so we can see exactly where it stalls
mongoose.connection.on('connecting', () => console.log('EVENT: connecting'));
mongoose.connection.on('connected', () => console.log('EVENT: connected'));
mongoose.connection.on('open', () => console.log('EVENT: open'));
mongoose.connection.on('disconnecting', () => console.log('EVENT: disconnecting'));
mongoose.connection.on('disconnected', () => console.log('EVENT: disconnected'));
mongoose.connection.on('close', () => console.log('EVENT: close'));
mongoose.connection.on('reconnected', () => console.log('EVENT: reconnected'));
mongoose.connection.on('error', (e) => console.log('EVENT: error ->', e.message));

// Low-level driver topology events (very useful for replica set discovery issues)
mongoose.connection.on('fullsetup', () => console.log('EVENT: fullsetup (all replica members discovered)'));
mongoose.connection.on('all', () => console.log('EVENT: all'));

(async () => {
  console.log('--- Starting connection attempt ---');
  console.log('URI (masked):', (process.env.MONGODB_URI || '').replace(/:[^:@]+@/, ':****@'));

  try {
    console.time('connect');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'caltrack',
      serverSelectionTimeoutMS: 10000,
    });
    console.timeEnd('connect');
    console.log('--- mongoose.connect() resolved ---');
    console.log('readyState:', mongoose.connection.readyState); // 1 = connected

    const User = mongoose.model(
      'User',
      new mongoose.Schema({
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        displayName: String,
        createdAt: { type: Date, default: Date.now },
      }),
      'users'
    );

    console.log('--- Running findOne query ---');
    console.time('findOne');
    const user = await User.findOne({ email: 'demo@caltrack.app' });
    console.timeEnd('findOne');

    if (!user) {
      console.log('not found');
      process.exit(0);
    }

    console.log('--- Running updateOne ---');
    const res = await User.updateOne({ _id: user._id }, { $set: { displayName: 'Demo User' } });
    console.log(JSON.stringify({ ok: true, res }));

    await mongoose.disconnect();
    console.log('--- Disconnected cleanly ---');
  } catch (err) {
    console.error('--- CAUGHT ERROR ---');
    console.error(err);
    console.log('readyState at failure:', mongoose.connection.readyState);
    process.exit(1);
  }
})();