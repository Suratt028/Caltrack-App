require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'caltrack';
const authSecret = process.env.AUTH_SECRET || 'dev-secret-change-me';

if (!uri) {
  console.error('❌ Missing MONGODB_URI in environment');
}

let isMongoReady = false;

async function connectMongo() {
  if (!uri) return;
  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
    });
    isMongoReady = true;
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    isMongoReady = false;
  }
}

connectMongo();

// Schema Definitions
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  displayName: String,
  createdAt: { type: Date, default: Date.now },
});

const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  gender: String,
  age: Number,
  heightCm: Number,
  weightKg: Number,
  activityLevel: String,
  goal: String,
  targetWeightKg: Number,
  kcalGoal: Number,
  proteinGoal: Number,
  carbsGoal: Number,
  fatGoal: Number,
  updatedAt: { type: Date, default: Date.now },
});

const logSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  dateKey: String,
  entry: Object,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema, 'users');
const Profile = mongoose.model('Profile', profileSchema, 'profiles');
const Log = mongoose.model('Log', logSchema, 'logs');

// Helper Functions
function hashPassword(password) {
  return crypto.createHmac('sha256', authSecret).update(password).digest('hex');
}

function verifyPassword(inputPassword, storedPassword) {
  return hashPassword(inputPassword) === storedPassword;
}

async function seedDemoData() {
  const demoEmail = 'demo@caltrack.app';
  let user = await User.findOne({ email: demoEmail });

  if (!user) {
    user = await User.create({
      email: demoEmail,
      password: hashPassword('demo1234'),
      displayName: 'Demo User',
    });
  } else {
    await User.updateOne({ _id: user._id }, { $set: { displayName: 'Demo User' } });
    user = await User.findOne({ _id: user._id });
  }

  let profile = await Profile.findOne({ userId: user._id.toString() });
  if (!profile) {
    profile = await Profile.create({
      userId: user._id.toString(),
      gender: 'female',
      age: 28,
      heightCm: 168,
      weightKg: 62,
      activityLevel: 'moderate',
      goal: 'maintain',
      targetWeightKg: 60,
      kcalGoal: 1900,
      proteinGoal: 140,
      carbsGoal: 210,
      fatGoal: 60,
      updatedAt: new Date(),
    });
  } else {
    profile.updatedAt = new Date();
    await profile.save();
  }

  const demoLogs = [
    {
      userId: user._id.toString(),
      dateKey: '2026-07-27',
      entry: {
        breakfast: { name: 'Greek yogurt', calories: 220 },
        lunch: { name: 'Chicken rice bowl', calories: 540 },
        dinner: { name: 'Salmon salad', calories: 480 },
      },
    },
    {
      userId: user._id.toString(),
      dateKey: '2026-07-28',
      entry: {
        breakfast: { name: 'Oatmeal', calories: 280 },
        lunch: { name: 'Turkey wrap', calories: 430 },
        dinner: { name: 'Pasta', calories: 620 },
      },
    },
  ];

  await Log.deleteMany({ userId: user._id.toString(), dateKey: { $in: ['2026-07-27', '2026-07-28'] } });
  const logs = await Log.insertMany(demoLogs);

  return { user, profile, logs };
}

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongo: isMongoReady });
});

app.post('/api/seed-demo', async (req, res) => {
  try {
    const data = await seedDemoData();
    res.json({ message: 'Demo data created successfully', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'email already exists' });

    const user = await User.create({ email, password: hashPassword(password), displayName });
    res.json({ user: { id: user._id.toString(), email: user.email, displayName: user.displayName } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    res.json({ user: { id: user._id.toString(), email: user.email, displayName: user.displayName } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profiles/:userId', async (req, res) => {
  try {
    const payload = { ...req.body, userId: req.params.userId, updatedAt: new Date() };
    const profile = await Profile.findOneAndUpdate({ userId: req.params.userId }, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/profiles/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOneAndDelete({ userId: req.params.userId });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/logs/:userId', async (req, res) => {
  try {
    const logs = await Log.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logs/:userId', async (req, res) => {
  try {
    const log = await Log.create({ userId: req.params.userId, ...req.body });
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/logs/:userId/:logId', async (req, res) => {
  try {
    const log = await Log.findOneAndUpdate({ userId: req.params.userId, _id: req.params.logId }, req.body, { new: true });
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/logs/:userId/:logId', async (req, res) => {
  try {
    const log = await Log.findOneAndDelete({ userId: req.params.userId, _id: req.params.logId });
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server Listen Configuration with Error Handling
const port = process.env.PORT || 3002;

const server = app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${port} is currently in use.`);
    console.error('👉 Please run "taskkill /f /im node.exe" in CMD or change PORT in .env file.');
  } else {
    console.error('❌ Server error:', err);
  }
});