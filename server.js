require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');

const multer = require('multer');
const { processAndSaveFood } = require('./controllers/foodController');
const { processFoodUpload } = require('./services/foodUploadService');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const dbName = process.env.MONGODB_DB_NAME || 'caltrack';
const mongoUser = process.env.MONGODB_USERNAME;
const mongoPassword = process.env.MONGODB_PASSWORD;
const mongoHost = process.env.MONGODB_HOST || 'cluster0.eef27bu.mongodb.net';
const authSecret = process.env.AUTH_SECRET || 'dev-secret-change-me';
const fatSecretClientId = process.env.FATSECRET_CLIENT_ID;
const fatSecretClientSecret = process.env.FATSECRET_CLIENT_SECRET;
const fatSecretCustomerKey = process.env.FATSECRET_CUSTOMER_KEY;
const fatSecretOAuthUrl = process.env.FATSECRET_OAUTH_URL || 'https://oauth.fatsecret.com/connect/token';
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const uri =
  process.env.MONGODB_URI ||
  (mongoUser && mongoPassword
    ? `mongodb+srv://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPassword)}@${mongoHost}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`
    : undefined);

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

// ---------------------------------------------------------------------------
// AI VISION FOOD SCAN ENDPOINT
// ---------------------------------------------------------------------------
app.post('/api/ai/scan', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const apiKey = geminiApiKey;

    if (apiKey) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const promptText = `
คุณเป็นผู้เชี่ยวชาญด้านโภชนาการ วิเคราะห์ภาพอาหารนี้และตอบเป็น JSON เท่านั้นในรูปแบบต่อไปนี้:
{
  "name": "ชื่ออาหารภาษาไทย (ถ้าเป็นอาหารต่างชาติให้ทับศัพท์)",
  "kcal": แคลอรี่โดยประมาณ (ตัวเลข integer),
  "protein": โปรตีนกี่กรัม (ตัวเลข integer/float),
  "carbs": คาร์โบไฮเดรตกี่กรัม (ตัวเลข integer/float),
  "fat": ไขมันกี่กรัม (ตัวเลข integer/float),
  "confidence": ค่าความมั่นใจในการระบุอาหาร (0.5 - 0.99)
}
ห้ามใส่ข้อความอื่น ห้ามใส่ markdown block เพิ่มเติม ให้ตอบเพียง JSON string เท่านั้น
`;

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });

      const data = await response.json();
      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let textResult = data.candidates[0].content.parts[0].text.trim();
        // Clean markdown backticks if returned
        textResult = textResult.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(textResult);

        return res.json({
          success: true,
          source: 'gemini_vision',
          usedApiKey: !!apiKey,
          result: {
            name: parsed.name || 'อาหารไม่ทราบชื่อ',
            kcal: Number(parsed.kcal) || 350,
            protein: Number(parsed.protein) || 15,
            carbs: Number(parsed.carbs) || 45,
            fat: Number(parsed.fat) || 12,
            confidence: Number(parsed.confidence) || 0.9,
          },
        });
      }
    }

    // Fallback if API Key missing or call failed
    const sampleFoods = [
      { name: 'ข้าวมันไก่', kcal: 596, protein: 24, carbs: 70, fat: 24, confidence: 0.88 },
      { name: 'ผัดไทยกุ้งสด', kcal: 545, protein: 22, carbs: 64, fat: 20, confidence: 0.85 },
      { name: 'ข้าวผัดกระเพราหมูสับ + ไข่ดาว', kcal: 630, protein: 28, carbs: 68, fat: 26, confidence: 0.91 },
      { name: 'ต้มยำกุ้งน้ำข้น', kcal: 320, protein: 26, carbs: 18, fat: 16, confidence: 0.82 },
      { name: 'แกงเขียวหวานไก่', kcal: 480, protein: 20, carbs: 22, fat: 34, confidence: 0.86 },
    ];
    const picked = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];
    return res.json({
      success: true,
      source: apiKey ? 'fallback_error' : 'fallback_no_key',
      result: picked,
    });
  } catch (err) {
    console.error('AI Scan Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Server Listen Configuration with Error Handling
const port = process.env.PORT || 3001;

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