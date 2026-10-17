require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');

const multer = require('multer');
const { processAndSaveFood } = require('./controllers/foodController');
const { processFoodUpload } = require('./services/foodUploadService');
const { addNutritionTotals, scaleNutrition } = require('./server/nutritionMath');
const { getGeminiScanError } = require('./server/geminiScanError');
const { requestWithGeminiFallback } = require('./server/geminiScanRequest');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const dbName = process.env.MONGODB_DB_NAME || 'caltrack';
const mongoUser = process.env.MONGODB_USERNAME;
const mongoPassword = process.env.MONGODB_PASSWORD;
const mongoHost = process.env.MONGODB_HOST || 'cluster0.eef27bu.mongodb.net';
const authSecret = process.env.AUTH_SECRET || 'dev-secret-change-me';
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@caltrack.app').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'CalTrack Administrator';
const defaultAdminEmail = 'admin@caltrack.app';
const defaultAdminPassword = 'Admin@1234';
const fatSecretClientId = process.env.FATSECRET_CLIENT_ID;
const fatSecretClientSecret = process.env.FATSECRET_CLIENT_SECRET;
const fatSecretCustomerKey = process.env.FATSECRET_CUSTOMER_KEY;
const fatSecretOAuthUrl = process.env.FATSECRET_OAUTH_URL || 'https://oauth.fatsecret.com/connect/token';
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const configuredGeminiScanModels = [...new Set(
  (process.env.GEMINI_SCAN_MODELS || 'gemini-3.6-flash,gemini-3.5-flash-lite')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)
)];
const geminiScanModels = configuredGeminiScanModels.length > 0
  ? configuredGeminiScanModels
  : ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];

const uri =
  process.env.MONGODB_URI ||
  (mongoUser && mongoPassword
    ? `mongodb+srv://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPassword)}@${mongoHost}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`
    : undefined);

if (!uri) {
  console.error('❌ Missing MONGODB_URI in environment');
}

let isMongoReady = false;

function parseGeminiJson(text) {
  const cleaned = String(text || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Gemini returned invalid JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function requestGemini(url, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json();
    if (response.ok) return data;
    const error = new Error(data?.error?.message || `Gemini HTTP ${response.status}`);
    error.status = response.status;
    error.code = data?.error?.status || data?.error?.code;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

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

// Schema Definitions
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  displayName: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
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

const scanImageSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  imageBase64: { type: String, required: true },
  mimeType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: String },
  userEmail: { type: String, required: true },
  topic: { type: String, required: true },
  detail: { type: String, default: '' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
  createdAt: { type: Date, default: Date.now },
});

const userFoodSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  dateKey: String,
  foodName: String,
  kcal: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
  source: { type: String, default: 'log' },
  entry: Object,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema, 'users');
const Profile = mongoose.model('Profile', profileSchema, 'profiles');
const Log = mongoose.model('Log', logSchema, 'logs');
const ScanImage = mongoose.model('ScanImage', scanImageSchema, 'scanImages');
const Ticket = mongoose.model('Ticket', ticketSchema, 'tickets');
const UserFood = mongoose.model('UserFood', userFoodSchema, 'user.foods');

// Flexible schema: the "foods" collection holds ~1,167 Thai food-composition
// records with many optional micronutrient fields, so we don't lock it down.
const foodSchema = new mongoose.Schema({}, { strict: false });
const Food = mongoose.model('Food', foodSchema, 'foods');

// Nutrient fields stored per 100g edible portion (see thaiFoods_full.json / seed-foods.js)
const NUTRIENT_FIELDS = [
  'kcal', 'water_g', 'protein_g', 'fat_g', 'carbAvailable_g', 'carbTotal_g', 'fiber_g', 'ash_g',
  'calcium_mg', 'phosphorus_mg', 'magnesium_mg', 'sodium_mg', 'potassium_mg', 'iron_mg', 'copper_mg',
  'zinc_mg', 'iodine_ug', 'betacarotene_ug', 'retinol_ug', 'vitaminA_RAE_ug', 'thiamin_mg',
  'riboflavin_mg', 'niacin_mg', 'vitaminC_mg', 'vitaminE_mg', 'sugar_g', 'cholesterol_mg', 'folate_ug',
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper Functions
function hashPassword(password) {
  return crypto.createHmac('sha256', authSecret).update(password).digest('hex');
}

function verifyPassword(inputPassword, storedPassword) {
  return hashPassword(inputPassword) === storedPassword;
}

async function ensureAdminAccount() {
  if (!isMongoReady) return null;

  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: { displayName: adminDisplayName, role: 'admin' },
      $setOnInsert: { password: hashPassword(adminPassword) },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  console.log(`✅ Admin account ready: ${adminEmail}`);
  return admin;
}

function createAdminToken(email) {
  const payload = Buffer.from(JSON.stringify({ email, role: 'admin', exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function requireAdmin(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return res.status(401).json({ error: 'admin authentication required' });

  const expected = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'invalid admin token' });
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (claims.role !== 'admin' || !claims.email || claims.exp < Date.now()) {
      return res.status(401).json({ error: 'expired admin token' });
    }
    req.admin = claims;
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid admin token' });
  }
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

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend server is running correctly!',
  });
});

app.get('/api/food/analyze', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'This endpoint is for browsing. To analyze food, send a POST request to /api/food/scan or /api/food/upload.',
    supportedMethods: {
      scan: 'POST /api/food/scan',
      upload: 'POST /api/food/upload',
      aiScan: 'POST /api/ai/scan',
    },
    note: 'GET does not accept an image body, so use POST for actual analysis.',
  });
});

app.get('/api/diagnostics', (req, res) => {
  res.json({
    geminiApiKeyLoaded: !!geminiApiKey,
    geminiApiKey: geminiApiKey ? 'SET' : 'NOT_SET',
  });
});

app.post('/api/food/scan', upload.single('image'), processAndSaveFood);

app.post('/api/food/upload', upload.single('image'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ success: false, message: 'Image file is required' });
  }

  try {
    const savedLog = await processFoodUpload(req.file.buffer, req.file.mimetype, {
      userId: req.body.userId,
      imageUrl: req.body.imageUrl,
    });

    return res.status(201).json({ success: true, data: savedLog });
  } catch (error) {
    console.error('Food upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to process food upload' });
  }
});

app.post('/api/fatsecret/token', async (req, res) => {
  if (!fatSecretClientId || !fatSecretClientSecret) {
    return res.status(500).json({ error: 'FatSecret credentials are not configured' });
  }

  try {
    const basicAuth = Buffer.from(`${fatSecretClientId}:${fatSecretClientSecret}`).toString('base64');
    const body = new URLSearchParams({ grant_type: 'client_credentials', scope: 'basic' }).toString();

    const tokenResponse = await fetch(fatSecretOAuthUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({ error: tokenData.error || tokenData });
    }

    return res.json(tokenData);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch FatSecret token' });
  }
});

app.get('/api/seed-demo', async (req, res) => {
  try {
    const data = await seedDemoData();
    res.json({ message: 'Demo data created successfully', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const configuredAdmin =
      (email === adminEmail && password === adminPassword) ||
      (email === defaultAdminEmail && password === defaultAdminPassword);
    const user = isMongoReady ? await User.findOne({ email }) : null;

    if (configuredAdmin) {
      const adminUser = {
        id: user?._id?.toString() || 'admin-configured',
        email: adminEmail,
        displayName: user?.displayName || adminDisplayName,
        role: 'admin',
        adminToken: createAdminToken(adminEmail),
      };
      return res.json({ user: adminUser });
    }

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const signedInUser = { id: user._id.toString(), email: user.email, displayName: user.displayName, role: user.role || 'user' };
    if (user.role === 'admin') signedInUser.adminToken = createAdminToken(user.email);
    res.json({ user: signedInUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const configuredAdmin =
      (adminEmail && adminPassword && email === adminEmail && password === adminPassword) ||
      (email === defaultAdminEmail && password === defaultAdminPassword);
    const databaseAdmin = await User.findOne({ email, role: 'admin' });

    if (!configuredAdmin && (!databaseAdmin || !verifyPassword(password, databaseAdmin.password))) {
      return res.status(401).json({ error: 'invalid admin credentials' });
    }

    return res.json({
      token: createAdminToken(email),
      admin: { email, role: 'admin', displayName: databaseAdmin?.displayName || 'Administrator' },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/overview', requireAdmin, async (req, res) => {
  try {
    const [users, foods, logs] = await Promise.all([User.countDocuments(), Food.countDocuments(), Log.countDocuments()]);
    return res.json({ users, foods, logs });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const user = await User.create({
      email: cleanEmail,
      password: hashPassword(password),
      displayName: String(displayName || '').trim(),
      role: role === 'admin' ? 'admin' : 'user',
    });
    return res.status(201).json({ user: { _id: user._id.toString(), email: user.email, displayName: user.displayName, role: user.role, createdAt: user.createdAt } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { displayName, password, role } = req.body;
    const updates = {};
    if (displayName !== undefined) updates.displayName = String(displayName).trim();
    if (password) updates.password = hashPassword(password);
    if (role) updates.role = role === 'admin' ? 'admin' : 'user';

    const user = await User.findByIdAndUpdate(req.params.userId, updates, { new: true, select: '-password' }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users/:userId/logs', requireAdmin, async (req, res) => {
  try {
    const userFoods = await UserFood.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(100).lean();
    if (userFoods && userFoods.length > 0) {
      return res.json({ logs: userFoods });
    }
    const logs = await Log.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/foods', requireAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const filter = q ? { $or: [{ nameTh: new RegExp(escapeRegex(q), 'i') }, { nameEn: new RegExp(escapeRegex(q), 'i') }] } : {};
    const foods = await Food.find(filter).sort({ nameTh: 1 }).limit(limit).lean();
    return res.json({ foods });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/foods', requireAdmin, async (req, res) => {
  try {
    const { foodId, nameTh, nameEn, kcal, protein_g, carbAvailable_g, fat_g } = req.body;
    if (!foodId || !nameTh) return res.status(400).json({ error: 'foodId and nameTh are required' });
    const food = await Food.create({ foodId, nameTh, nameEn, kcal, protein_g, carbAvailable_g, fat_g });
    return res.status(201).json({ food });
  } catch (error) {
    return res.status(500).json({ error: error.code === 11000 ? 'foodId already exists' : error.message });
  }
});

app.patch('/api/admin/foods/:foodId', requireAdmin, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    delete updates.foodId;
    const food = await Food.findOneAndUpdate({ foodId: req.params.foodId }, updates, { new: true }).lean();
    if (!food) return res.status(404).json({ error: 'food not found' });
    return res.json({ food });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/foods/:foodId', requireAdmin, async (req, res) => {
  try {
    const food = await Food.findOneAndDelete({ foodId: req.params.foodId }).lean();
    if (!food) return res.status(404).json({ error: 'food not found' });
    return res.json({ food });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
    const { userId } = req.params;
    const { dateKey, entry } = req.body;
    const log = await Log.create({ userId, dateKey, entry });

    let foodName = 'อาหารทั่วไป';
    let kcal = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sugar = 0, sodium = 0;

    if (entry) {
      if (entry.name || entry.foodName) foodName = entry.name || entry.foodName;
      if (entry.kcal || entry.calories) kcal = Number(entry.kcal || entry.calories) || 0;
      if (entry.protein) protein = Number(entry.protein) || 0;
      if (entry.carbs) carbs = Number(entry.carbs) || 0;
      if (entry.fat) fat = Number(entry.fat) || 0;
      if (entry.fiber) fiber = Number(entry.fiber) || 0;
      if (entry.sugar) sugar = Number(entry.sugar) || 0;
      if (entry.sodium) sodium = Number(entry.sodium) || 0;

      for (const key of Object.keys(entry)) {
        if (typeof entry[key] === 'object' && entry[key] !== null) {
          const sub = entry[key];
          if (sub.name || sub.foodName) foodName = sub.name || sub.foodName;
          if (sub.kcal || sub.calories) kcal = Number(sub.kcal || sub.calories) || kcal;
          if (sub.protein) protein = Number(sub.protein) || protein;
          if (sub.carbs) carbs = Number(sub.carbs) || carbs;
          if (sub.fat) fat = Number(sub.fat) || fat;
        }
      }
    }

    const userFood = await UserFood.create({
      userId,
      dateKey: dateKey || new Date().toISOString().slice(0, 10),
      foodName,
      kcal,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      source: 'log',
      entry,
    });

    res.json({ log, userFood });
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

// ---------------------------------------------------------------------------
// FOOD DATABASE — SEARCH, LOOKUP, NUTRITION CALCULATION
// ---------------------------------------------------------------------------

// GET /api/foods/search?q=ข้าว&limit=20
// Searches nameTh, nameEn and scientificName with a case-insensitive partial match.
// Works for food names, fruits, and dish/ingredient descriptions alike, since the
// dataset's "name" fields already include ingredient wording (e.g. "ข้าวผัดกระเพราหมูสับ").
app.get('/api/foods/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    if (!q) {
      return res.json({ results: [], count: 0 });
    }

    const regex = new RegExp(escapeRegex(q), 'i');
    const results = await Food.find({
      $or: [{ nameTh: regex }, { nameEn: regex }, { scientificName: regex }],
    })
      .limit(limit)
      .lean();

    // Rank names that start with the query above names that merely contain it
    const qLower = q.toLowerCase();
    const startsWith = (s) => (s || '').toLowerCase().startsWith(qLower);
    results.sort((a, b) => (startsWith(b.nameTh) || startsWith(b.nameEn)) - (startsWith(a.nameTh) || startsWith(a.nameEn)));

    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/foods/:foodId  — full detail for one item (all nutrient fields, per 100g)
app.get('/api/foods/:foodId', async (req, res) => {
  try {
    const food = await Food.findOne({ foodId: req.params.foodId }).lean();
    if (!food) return res.status(404).json({ error: 'food not found' });
    res.json({ food });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nutrition/calculate
// Body: { items: [{ foodId: "1001", grams: 150 }, { foodId: "4012", grams: 80 }] }
// Scales each food's per-100g values by grams/100 and returns per-item + total nutrition.
app.post('/api/nutrition/calculate', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required, e.g. [{ foodId, grams }]' });
    }
    const invalidItem = items.find((item) => {
      const grams = Number(item?.grams);
      return (
        !item ||
        (typeof item.foodId !== 'string' && typeof item.foodId !== 'number') ||
        !String(item.foodId).trim() ||
        !Number.isFinite(grams) ||
        grams <= 0 ||
        grams > 5000
      );
    });
    if (invalidItem) {
      return res.status(400).json({ error: 'Each item requires a foodId and a gram amount between 1 and 5000' });
    }

    const foodIds = items.map((i) => String(i.foodId));
    const foods = await Food.find({ foodId: { $in: foodIds } }).lean();
    const foodMap = new Map(foods.map((f) => [String(f.foodId), f]));

    const totals = Object.fromEntries(NUTRIENT_FIELDS.map((k) => [k, 0]));
    const breakdown = [];
    const notFound = [];

    for (const item of items) {
      const food = foodMap.get(String(item.foodId));
      const grams = Number(item.grams) || 0;

      if (!food) {
        notFound.push(item.foodId);
        continue;
      }

      const nutrition = scaleNutrition(food, grams, NUTRIENT_FIELDS);
      addNutritionTotals(totals, nutrition);

      breakdown.push({
        foodId: food.foodId,
        nameTh: food.nameTh,
        nameEn: food.nameEn,
        grams,
        nutrition,
      });
    }

    res.json({ totals, breakdown, notFound });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// AI VISION FOOD SCAN ENDPOINT
// ---------------------------------------------------------------------------
app.post('/api/ai/scan', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userId = null, storeImage = false } = req.body || {};
    if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }
    if (!/^image\/(jpeg|png|webp)$/i.test(mimeType)) {
      return res.status(400).json({ error: 'mimeType must be JPEG, PNG, or WEBP' });
    }

    const apiKey = geminiApiKey;
    if (!apiKey) {
      return res.status(503).json({ error: 'บริการวิเคราะห์ภาพยังไม่พร้อมใช้งาน กรุณาตั้งค่า GEMINI_API_KEY หรือค้นหาอาหารด้วยตนเอง' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    let scanId = null;

    if (storeImage === true) {
      try {
        const savedScan = await ScanImage.create({ userId, imageBase64: cleanBase64, mimeType });
        scanId = savedScan._id.toString();
      } catch (storageError) {
        console.warn('Consented scan image could not be saved:', storageError.message);
      }
    }

    const promptText = `
วิเคราะห์อาหารทุกชนิดที่มองเห็นแยกเป็นรายการ ไม่รวมอาหารต่างชนิดเป็นเมนูเดียว
ประเมินกรัมเป็นช่วง min/likely/max โดยย้ำว่าเป็นค่าประมาณจากภาพ ไม่ใช่การชั่งจริง
ใส่กรอบภาพเป็น [ymin, xmin, ymax, xmax] ช่วง 0-1000 หากระบุตำแหน่งได้
ประมาณสารอาหารสำหรับน้ำหนัก likely ของแต่ละรายการ และตอบ JSON ตาม schema เท่านั้น
หากไม่แน่ใจชื่อ ให้ใช้ชื่อที่ใกล้เคียงและลด confidence ห้ามแต่งข้อมูลอ้างอิงหรือค่าความแม่นยำ
`;

      let data;
      try {
        const requestBody = {
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                reference_object: { type: 'STRING' },
                items: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      name_th: { type: 'STRING' },
                      name_en: { type: 'STRING' },
                      box_2d: { type: 'ARRAY', items: { type: 'NUMBER' } },
                      cooking_method: { type: 'STRING' },
                      estimated_grams: {
                        type: 'OBJECT',
                        properties: {
                          min: { type: 'NUMBER' },
                          likely: { type: 'NUMBER' },
                          max: { type: 'NUMBER' },
                        },
                        required: ['min', 'likely', 'max'],
                      },
                      estimated_nutrition: {
                        type: 'OBJECT',
                        properties: {
                          kcal: { type: 'NUMBER' },
                          protein: { type: 'NUMBER' },
                          carbs: { type: 'NUMBER' },
                          fat: { type: 'NUMBER' },
                          fiber: { type: 'NUMBER' },
                          sugar: { type: 'NUMBER' },
                          sodium: { type: 'NUMBER' },
                          calcium: { type: 'NUMBER' },
                          iron: { type: 'NUMBER' },
                          vitaminC: { type: 'NUMBER' },
                        },
                      },
                      confidence: { type: 'NUMBER' },
                    },
                    required: ['name_th', 'estimated_grams', 'estimated_nutrition', 'confidence'],
                  },
                },
              },
              required: ['items', 'reference_object'],
            },
          },
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        };
        data = await requestWithGeminiFallback(
          geminiScanModels,
          (model) => requestGemini(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
            requestBody
          ),
          {
            onFallback: (fromModel, toModel, error) => {
              console.warn('Gemini scan switching to fallback model:', {
                fromModel,
                toModel,
                status: error.status || null,
                code: error.code || null,
              });
            },
          }
        );
      } catch (geminiError) {
        const details = getGeminiScanError(geminiError);
        console.error('Gemini scan failed:', {
          status: geminiError.status || null,
          code: geminiError.code || null,
          message: geminiError.message,
        });
        return res.status(502).json(details);
      }

      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        return res.status(502).json({ error: 'AI ไม่ได้ส่งผลวิเคราะห์กลับมา กรุณาลองใหม่' });
      }

      let parsed;
      try {
        parsed = parseGeminiJson(responseText);
      } catch (parseError) {
        console.warn('Gemini returned malformed scan JSON:', parseError.message);
        return res.status(502).json({ error: 'AI ส่งผลวิเคราะห์ในรูปแบบที่อ่านไม่ได้ กรุณาลองใหม่' });
      }
      if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
        return res.status(422).json({ error: 'ไม่พบรายการอาหารในภาพ กรุณาลองถ่ายใหม่หรือค้นหาอาหารด้วยตนเอง' });
      }

      const items = [];
      for (const rawItem of parsed.items) {
        const nameTh = String(rawItem?.name_th || '').trim();
        const grams = rawItem?.estimated_grams || {};
        if (!nameTh || !Number.isFinite(Number(grams.likely)) || Number(grams.likely) <= 0) continue;

        const box = Array.isArray(rawItem.box_2d) && rawItem.box_2d.length === 4 &&
          rawItem.box_2d.every((value) => Number.isFinite(Number(value)))
          ? rawItem.box_2d.map(Number)
          : null;
        const regex = new RegExp(escapeRegex(nameTh), 'i');
        let candidates = [];
        try {
          candidates = await Food.find({
            $or: [{ nameTh: regex }, { nameEn: regex }],
          }).limit(5).lean();
        } catch (matchError) {
          console.warn('Food candidate lookup failed:', matchError.message);
        }

        items.push({
          name_th: nameTh,
          name_en: String(rawItem.name_en || ''),
          box_2d: box,
          cooking_method: String(rawItem.cooking_method || ''),
          estimated_grams: {
            min: Math.max(0, Number(grams.min) || 0),
            likely: Number(grams.likely),
            max: Math.max(Number(grams.likely), Number(grams.max) || Number(grams.likely)),
          },
          estimated_nutrition: Object.fromEntries(
            ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'calcium', 'iron', 'vitaminC']
              .map((key) => {
                const value = rawItem.estimated_nutrition?.[key];
                return [key, value == null || !Number.isFinite(Number(value)) ? null : Number(value)];
              })
          ),
          confidence: Math.max(0, Math.min(1, Number(rawItem.confidence) || 0)),
          candidates: candidates.map((food) => ({
            foodId: String(food.foodId),
            nameTh: food.nameTh,
            nameEn: food.nameEn,
            per100g: {
              kcal: food.kcal,
              protein_g: food.protein_g,
              fat_g: food.fat_g,
              carbAvailable_g: food.carbAvailable_g,
              fiber_g: food.fiber_g,
              sugar_g: food.sugar_g,
              sodium_mg: food.sodium_mg,
              calcium_mg: food.calcium_mg,
              iron_mg: food.iron_mg,
              vitaminC_mg: food.vitaminC_mg,
            },
          })),
        });
      }

      if (items.length === 0) {
        return res.status(502).json({ error: 'AI ส่งข้อมูลอาหารไม่ครบถ้วน กรุณาลองใหม่' });
      }

    return res.json({
      success: true,
      source: 'gemini_vision',
      scanId,
      result: {
        reference_object: String(parsed.reference_object || ''),
        items,
      },
    });
  } catch (err) {
    console.error('AI Scan Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/scan-images/:scanId', async (req, res) => {
  try {
    const scan = await ScanImage.findById(req.params.scanId).lean();
    if (!scan) return res.status(404).json({ error: 'scan image not found' });
    res.json({ scan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// TICKET / REPORT ENDPOINTS
// ---------------------------------------------------------------------------
const handleCreateTicket = async (req, res) => {
  try {
    const { userId, userEmail, topic, detail } = req.body;
    if (!userEmail || !topic) {
      return res.status(400).json({ error: 'userEmail and topic are required' });
    }
    const ticketId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticket = await Ticket.create({
      ticketId,
      userId: userId || '',
      userEmail: userEmail.trim().toLowerCase(),
      topic: topic.trim(),
      detail: (detail || '').trim(),
      status: 'Open',
    });
    res.status(201).json({ ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handleGetTickets = async (req, res) => {
  try {
    const { email } = req.query;
    const filter = email ? { userEmail: email.trim().toLowerCase() } : {};
    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handleUpdateTicket = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { ticketId: id }] } : { ticketId: id };
    const ticket = await Ticket.findOneAndUpdate(filter, { status }, { new: true });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handleDeleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { ticketId: id }] } : { ticketId: id };
    const ticket = await Ticket.findOneAndDelete(filter);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

app.post('/tickets', handleCreateTicket);
app.post('/api/tickets', handleCreateTicket);
app.get('/tickets', handleGetTickets);
app.get('/api/tickets', handleGetTickets);
app.patch('/tickets/:id', handleUpdateTicket);
app.patch('/api/tickets/:id', handleUpdateTicket);
app.delete('/tickets/:id', handleDeleteTicket);
app.delete('/api/tickets/:id', handleDeleteTicket);

// ---------------------------------------------------------------------------
// SERVER STARTUP
// ---------------------------------------------------------------------------
// FIX: previously connectMongo() was fired-and-forgotten while app.listen()
// ran immediately after, so the server could accept requests (e.g. register)
// before Mongoose had actually finished connecting to Atlas. Any query that
// arrived in that window would sit in Mongoose's command buffer and, if the
// connection wasn't ready within 10s, fail with:
//   "Operation `logs.insertOne()` buffering timed out after 10000ms"
// Waiting for connectMongo() to finish before app.listen() removes that race.
const port = process.env.PORT || 3001;

async function startServer() {
  await connectMongo();
  try {
    await ensureAdminAccount();
  } catch (error) {
    console.error('❌ Admin account setup failed:', error.message);
  }

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
}

startServer();