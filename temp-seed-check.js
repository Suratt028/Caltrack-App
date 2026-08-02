require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'caltrack',
      serverSelectionTimeoutMS: 10000,
    });

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

    const user = await User.findOne({ email: 'demo@caltrack.app' });
    if (!user) {
      console.log('not found');
      process.exit(0);
    }

    const res = await User.updateOne({ _id: user._id }, { $set: { displayName: 'Demo User' } });
    console.log(JSON.stringify({ ok: true, res }));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
