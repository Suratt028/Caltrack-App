require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');

const { addNutritionTotals, scaleNutrition } = require('./server/nutritionMath');
const { getGeminiScanError } = require('./server/geminiScanError');
const { requestWithGeminiFallback } = require('./server/geminiScanRequest');
const {
  candidateSearchTerms,
  englishWords,
  spellingRegexSource,
  thaiNameVariants,
  rankFoodCandidates,
  rankSearchResults,
  isConfidentMatch,
} = require('./server/foodMatching');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Maintenance mode (Admin → Settings): block the app's API while keeping the
// admin console, health checks and sign-in reachable.
const MAINTENANCE_ALLOWED = ['/health', '/api/health', '/api/admin', '/api/auth/login', '/api/diagnostics'];
app.use(async (req, res, next) => {
  if (MAINTENANCE_ALLOWED.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) return next();
  try {
    const { maintenanceMode } = await getSystemSettings();
    if (maintenanceMode) {
      return res.status(503).json({ error: 'ระบบปิดปรับปรุงชั่วคราว กรุณาลองใหม่ภายหลัง', code: 'MAINTENANCE' });
    }
  } catch (error) {
    console.warn('System settings check failed:', error.message);
  }
  return next();
});

const dbName = process.env.MONGODB_DB_NAME || 'caltrack';
const mongoUser = process.env.MONGODB_USERNAME;
const mongoPassword = process.env.MONGODB_PASSWORD;
const mongoHost = process.env.MONGODB_HOST || 'cluster0.eef27bu.mongodb.net';
const authSecret = process.env.AUTH_SECRET || 'dev-secret-change-me';
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@caltrack.app').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'CalTrack Administrator';
// The fallbacks above are public (they are in the repo), so anyone could sign
// admin tokens or log in as admin. Fine for local dev only.
const PLACEHOLDER_SECRETS = ['dev-secret-change-me', 'change-me-in-production'];
if (!process.env.AUTH_SECRET || PLACEHOLDER_SECRETS.includes(process.env.AUTH_SECRET)) {
  console.warn('⚠️  AUTH_SECRET is not set or is a placeholder; anyone could forge sign-in tokens. Set a random value before deploying.');
} else if (Buffer.byteLength(process.env.AUTH_SECRET) < 32) {
  console.warn('⚠️  AUTH_SECRET is shorter than 32 characters; use a longer random value (e.g. `openssl rand -hex 32`).');
}
if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD is not set; the admin account uses a public default password. Set it before deploying.');
}
const googleOAuthClientIds = (process.env.GOOGLE_OAUTH_CLIENT_IDS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const appleOAuthClientIds = (process.env.APPLE_OAUTH_CLIENT_IDS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const appleServiceId = process.env.APPLE_SERVICE_ID;
const appleRedirectUri = process.env.APPLE_REDIRECT_URI;
const googleOAuthClient = new OAuth2Client();
// Server-only. Never read an EXPO_PUBLIC_* key here: those are bundled into the app.
const geminiApiKey = process.env.GEMINI_API_KEY || '';
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

// isMongoReady follows the driver's connection events, so it recovers after a
// network drop (the driver reconnects by itself). If the very first connect
// fails, connectMongo keeps retrying with backoff instead of staying down
// until someone restarts the server.
const MONGO_RETRY_START_MS = 2000;
const MONGO_RETRY_MAX_MS = 60 * 1000;
let mongoRetryDelayMs = MONGO_RETRY_START_MS;
let adminAccountEnsured = false;

function onMongoUp(event) {
  const wasReady = isMongoReady;
  isMongoReady = true;
  mongoRetryDelayMs = MONGO_RETRY_START_MS;
  if (!wasReady) console.log(`✅ MongoDB ${event}`);
  if (!adminAccountEnsured) {
    adminAccountEnsured = true;
    ensureAdminAccount().catch((error) => {
      adminAccountEnsured = false;
      console.error('❌ Admin account setup failed:', error.message);
    });
  }
}

mongoose.connection.on('connected', () => onMongoUp('connected'));
mongoose.connection.on('reconnected', () => onMongoUp('reconnected'));
mongoose.connection.on('disconnected', () => {
  if (isMongoReady) console.warn('⚠️ MongoDB disconnected; the driver will try to reconnect');
  isMongoReady = false;
});

async function connectMongo() {
  if (!uri) return;
  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
    });
  } catch (err) {
    isMongoReady = false;
    console.error(`❌ MongoDB connection error: ${err.message} (retrying in ${mongoRetryDelayMs / 1000}s)`);
    setTimeout(connectMongo, mongoRetryDelayMs);
    mongoRetryDelayMs = Math.min(mongoRetryDelayMs * 2, MONGO_RETRY_MAX_MS);
  }
}

// Schema Definitions
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: false },
  googleId: { type: String, unique: true, sparse: true },
  appleId: { type: String, unique: true, sparse: true },
  displayName: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
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

const weightLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  dateKey: { type: String, required: true },
  weightKg: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});
weightLogSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

const scanImageSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  imageBase64: { type: String, required: true },
  mimeType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// One row per /api/ai/scan request, for the admin "Recent Scan Audit Log".
// Images are not stored here; scanId links to scanImages when the user consented.
const scanLogSchema = new mongoose.Schema({
  userId: { type: String, default: null },
  scanId: { type: String, default: null },
  mimeType: String,
  model: { type: String, default: null },
  status: { type: String, enum: ['success', 'low_conf', 'no_food', 'failed'], required: true },
  items: [{ _id: false, name_th: String, confidence: Number }],
  topConfidence: { type: Number, default: null },
  latencyMs: Number,
  tokens: { type: Number, default: null },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});
scanLogSchema.index({ createdAt: -1 });

// Admin-editable settings, one document per key (e.g. 'aiScan').
const appSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: Object,
  updatedBy: String,
  updatedAt: { type: Date, default: Date.now },
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

const oauthTicketSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

const userFoodSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  logId: { type: mongoose.Schema.Types.ObjectId },
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
const WeightLog = mongoose.model('WeightLog', weightLogSchema, 'weightLogs');
const ScanImage = mongoose.model('ScanImage', scanImageSchema, 'scanImages');
const ScanLog = mongoose.model('ScanLog', scanLogSchema, 'scanLogs');
const AppSetting = mongoose.model('AppSetting', appSettingSchema, 'appSettings');

// Admin → Settings. maxFreeScansPerDay: 0 means unlimited.
const DEFAULT_SYSTEM_SETTINGS = { maxFreeScansPerDay: 0, maintenanceMode: false };
const SYSTEM_SETTINGS_TTL_MS = 15 * 1000;
let systemSettingsCache = { value: DEFAULT_SYSTEM_SETTINGS, loadedAt: 0 };

// Cached briefly because the maintenance check runs on every request.
async function getSystemSettings({ fresh = false } = {}) {
  if (!isMongoReady) return systemSettingsCache.value;
  if (!fresh && Date.now() - systemSettingsCache.loadedAt < SYSTEM_SETTINGS_TTL_MS) {
    return systemSettingsCache.value;
  }
  const saved = (await AppSetting.findOne({ key: 'system' }).lean())?.value || {};
  const value = {
    maxFreeScansPerDay: Number.isInteger(saved.maxFreeScansPerDay) && saved.maxFreeScansPerDay >= 0
      ? saved.maxFreeScansPerDay
      : DEFAULT_SYSTEM_SETTINGS.maxFreeScansPerDay,
    maintenanceMode: saved.maintenanceMode === true,
  };
  systemSettingsCache = { value, loadedAt: Date.now() };
  return value;
}

// Admin reports and daily quotas are bucketed by the app's local day.
const REPORT_TIMEZONE = process.env.REPORT_TIMEZONE || 'Asia/Bangkok';

function startOfLocalDay(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: REPORT_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const offsetMs = asUtc - Math.floor(date.getTime() / 1000) * 1000;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - offsetMs);
}
const Ticket = mongoose.model('Ticket', ticketSchema, 'tickets');
const OAuthTicket = mongoose.model('OAuthTicket', oauthTicketSchema, 'oauthTickets');
const UserFood = mongoose.model('UserFood', userFoodSchema, 'user.foods');

// Flexible schema: the "foods" collection holds ~1,167 Thai food-composition
// records with many optional micronutrient fields, so we don't lock it down.
const foodSchema = new mongoose.Schema({}, { strict: false });
// foodId is always stored as a string; the unique index makes duplicate admin
// inserts fail with E11000 (reported as "foodId already exists").
foodSchema.index({ foodId: 1 }, { unique: true });
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

function normalizeFoodLog(log) {
  const raw = typeof log.toObject === 'function' ? log.toObject() : log;
  const entry = raw.entry && typeof raw.entry === 'object' ? raw.entry : {};
  const macros = entry.macros && typeof entry.macros === 'object' ? entry.macros : {};
  const protein = Number(entry.protein ?? macros.protein) || 0;
  const carbs = Number(entry.carbs ?? entry.carb ?? macros.carbs ?? macros.carb) || 0;
  const fat = Number(entry.fat ?? macros.fat) || 0;
  const dateKey = raw.dateKey || entry.date || new Date(raw.createdAt || Date.now()).toISOString().slice(0, 10);

  return {
    ...raw,
    entry: {
      ...entry,
      id: String(raw._id),
      date: entry.date || dateKey,
      meal: entry.meal || entry.mealType || 'snack',
      protein,
      carbs,
      fat,
      macros: { protein, carb: carbs, fat },
    },
  };
}

// Helper Functions
// Passwords: salted scrypt, stored as "scrypt$<salt hex>$<hash hex>".
// Older accounts hold an unsalted HMAC-SHA256 (keyed with AUTH_SECRET); those
// still verify and are rehashed on the next successful login.
const SCRYPT_KEYLEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function isLegacyPasswordHash(storedPassword) {
  return typeof storedPassword === 'string' && !storedPassword.startsWith('scrypt$');
}

function safeEqualHex(a, b) {
  const left = Buffer.from(String(a), 'hex');
  const right = Buffer.from(String(b), 'hex');
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyPassword(inputPassword, storedPassword) {
  if (!storedPassword) return false;
  if (isLegacyPasswordHash(storedPassword)) {
    const legacy = crypto.createHmac('sha256', authSecret).update(String(inputPassword)).digest('hex');
    return safeEqualHex(legacy, storedPassword);
  }
  const [, saltHex, hashHex] = storedPassword.split('$');
  if (!saltHex || !hashHex) return false;
  const hash = crypto.scryptSync(String(inputPassword), Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN);
  return safeEqualHex(hash.toString('hex'), hashHex);
}

// Constant-time string comparison (for the ADMIN_PASSWORD from .env).
function safeEqualText(a, b) {
  const digest = (value) => crypto.createHash('sha256').update(String(value)).digest();
  return crypto.timingSafeEqual(digest(a), digest(b)) && String(a) === String(b);
}

// Call after a successful verifyPassword: moves legacy hashes to scrypt.
async function upgradePasswordHashIfNeeded(user, password) {
  if (!isLegacyPasswordHash(user.password)) return;
  try {
    await User.updateOne({ _id: user._id }, { $set: { password: hashPassword(password) } });
  } catch (error) {
    console.warn('Password hash upgrade failed:', error.message);
  }
}

function parseAppleOAuthState(state) {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === 'dev-secret-change-me' || Buffer.byteLength(authSecret) < 32) {
    throw new Error('A strong AUTH_SECRET is required for Apple OAuth');
  }
  if (typeof state !== 'string') throw new Error('Invalid Apple OAuth state');
  const [encodedPayload, signature] = state.split('.');
  if (!encodedPayload || !signature) throw new Error('Invalid Apple OAuth state');

  const expected = crypto.createHmac('sha256', authSecret).update(encodedPayload).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid Apple OAuth state');
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Date.now()) throw new Error('Apple OAuth state expired');
  return payload;
}

function createAppleOAuthState(returnUri, nonce) {
  const encodedPayload = Buffer.from(JSON.stringify({
    returnUri,
    nonce,
    exp: Date.now() + 10 * 60 * 1000,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', authSecret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function isAllowedAppleReturnUri(value) {
  try {
    const uri = new URL(value);
    return uri.protocol === 'caltrack:' && uri.hostname === 'oauth' && uri.pathname === '/apple';
  } catch {
    return false;
  }
}

async function verifyAppleIdentityToken(idToken, expectedNonce) {
  if (!appleOAuthClientIds.length) {
    const error = new Error('Apple OAuth is not configured on the server');
    error.status = 503;
    throw error;
  }
  const { createRemoteJWKSet, jwtVerify } = await import('jose');
  const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
  const { payload } = await jwtVerify(idToken, appleKeys, {
    issuer: 'https://appleid.apple.com',
    audience: appleOAuthClientIds,
  });
  if (expectedNonce && payload.nonce !== expectedNonce) {
    throw new Error('Apple identity token nonce did not match');
  }
  if (!payload.sub || !payload.email || ![true, 'true'].includes(payload.email_verified)) {
    throw new Error('Apple did not return a verified email address');
  }
  return {
    provider: 'apple',
    subject: payload.sub,
    email: String(payload.email).trim().toLowerCase(),
    displayName: '',
  };
}

async function verifyGoogleIdentityToken(idToken) {
  if (!googleOAuthClientIds.length) {
    const error = new Error('Google OAuth is not configured on the server');
    error.status = 503;
    throw error;
  }
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: googleOAuthClientIds,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new Error('Google did not return a verified email address');
  }
  return {
    provider: 'google',
    subject: payload.sub,
    email: payload.email.trim().toLowerCase(),
    displayName: payload.name || '',
  };
}

async function findOrCreateOAuthUser(identity) {
  if (!isMongoReady) {
    const error = new Error('Social sign-in requires an active MongoDB connection');
    error.status = 503;
    throw error;
  }

  const providerIdField = identity.provider === 'google' ? 'googleId' : 'appleId';
  let user = await User.findOne({ [providerIdField]: identity.subject });
  if (!user) {
    user = await User.findOne({ email: identity.email });
    if (user?.role === 'admin') {
      throw new Error('Admin accounts cannot use social sign-in');
    }
    if (user) {
      user[providerIdField] = identity.subject;
      if (!user.displayName && identity.displayName) user.displayName = identity.displayName;
      await user.save();
    } else {
      user = await User.create({
        email: identity.email,
        displayName: identity.displayName || identity.email.split('@')[0],
        [providerIdField]: identity.subject,
      });
    }
  }

  if (user.role === 'admin') throw new Error('Admin accounts cannot use social sign-in');
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: user.role || 'user',
  };
}

function createAppleClientSecret() {
  const { APPLE_TEAM_ID: teamId, APPLE_KEY_ID: keyId, APPLE_PRIVATE_KEY: rawPrivateKey } = process.env;
  if (!appleServiceId || !teamId || !keyId || !rawPrivateKey) {
    const error = new Error('Apple OAuth server credentials are not configured');
    error.status = 503;
    throw error;
  }
  return import('jose').then(async ({ SignJWT, importPKCS8 }) => {
    const privateKey = await importPKCS8(rawPrivateKey.replace(/\\n/g, '\n'), 'ES256');
    return new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuer(teamId)
      .setSubject(appleServiceId)
      .setAudience('https://appleid.apple.com')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
  });
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

function signToken(claims) {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

// Returns the claims of a validly signed, unexpired Bearer token, or null.
function readBearerToken(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims && claims.exp > Date.now() ? claims : null;
  } catch {
    return null;
  }
}

function createAdminToken(email) {
  return signToken({ email, role: 'admin', exp: Date.now() + 8 * 60 * 60 * 1000 });
}

const USER_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function createUserToken(user) {
  return signToken({
    sub: String(user.id || user._id),
    email: user.email,
    role: 'user',
    exp: Date.now() + USER_TOKEN_TTL_MS,
  });
}

function requireAdmin(req, res, next) {
  const claims = readBearerToken(req);
  if (!claims) return res.status(401).json({ error: 'admin authentication required' });
  if (claims.role !== 'admin' || !claims.email) return res.status(401).json({ error: 'invalid admin token' });
  req.admin = claims;
  return next();
}

// Any signed-in user (or admin). Sets req.user = { id, email } for users.
function requireUser(req, res, next) {
  const claims = readBearerToken(req);
  if (claims?.role === 'user' && claims.sub) {
    req.user = { id: claims.sub, email: String(claims.email || '').toLowerCase() };
    return next();
  }
  if (claims?.role === 'admin' && claims.email) {
    req.admin = claims;
    return next();
  }
  return res.status(401).json({ error: 'authentication required', code: 'AUTH_REQUIRED' });
}

// For /:userId routes: only that user, or an admin, may access the data.
function requireSelf(req, res, next) {
  return requireUser(req, res, () => {
    if (req.admin || req.user.id === req.params.userId) return next();
    return res.status(403).json({ error: 'you can only access your own data' });
  });
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

// In-memory fixed-window rate limiter for sign-in/sign-up (per server process).
// Counts every attempt; keyed by IP, plus the email for login so one account
// can't be brute-forced from many addresses without hitting the IP limit too.
function rateLimit({ name, windowMs, max, keyFn }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${name}:${keyFn(req)}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: `พยายามบ่อยเกินไป กรุณารอ ${Math.ceil(retryAfterSec / 60)} นาทีแล้วลองใหม่`,
        code: 'RATE_LIMITED',
      });
    }
    return next();
  };
}

const MINUTE_MS = 60 * 1000;
const clientIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';
const loginEmail = (req) => String(req.body?.email || '').trim().toLowerCase();
const loginIpLimit = rateLimit({ name: 'login-ip', windowMs: 15 * MINUTE_MS, max: 30, keyFn: clientIp });
const loginAccountLimit = rateLimit({
  name: 'login-account', windowMs: 15 * MINUTE_MS, max: 10, keyFn: (req) => `${clientIp(req)}:${loginEmail(req)}`,
});
const adminLoginLimit = rateLimit({
  name: 'admin-login', windowMs: 15 * MINUTE_MS, max: 5, keyFn: (req) => `${clientIp(req)}:${loginEmail(req)}`,
});
const registerLimit = rateLimit({ name: 'register', windowMs: 60 * MINUTE_MS, max: 5, keyFn: clientIp });
const oauthLimit = rateLimit({ name: 'oauth', windowMs: 15 * MINUTE_MS, max: 30, keyFn: clientIp });

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

app.get('/api/diagnostics', (req, res) => {
  res.json({
    geminiApiKeyLoaded: !!geminiApiKey,
    geminiApiKey: geminiApiKey ? 'SET' : 'NOT_SET',
  });
});

// Seeding writes to the database, so it is admin-only.
app.get('/api/seed-demo', requireAdmin, async (req, res) => {
  try {
    const data = await seedDemoData();
    res.json({ message: 'Demo data created successfully', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/seed-demo', requireAdmin, async (req, res) => {
  try {
    const data = await seedDemoData();
    res.json({ message: 'Demo data created successfully', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/oauth/:provider', oauthLimit, async (req, res) => {
  try {
    const { provider } = req.params;
    if (!['google', 'apple'].includes(provider)) {
      return res.status(400).json({ error: 'unsupported OAuth provider' });
    }
    const idToken = String(req.body.idToken || '');
    if (!idToken || idToken.length > 12000) {
      return res.status(400).json({ error: 'a valid identity token is required' });
    }
    const identity = provider === 'google'
      ? await verifyGoogleIdentityToken(idToken)
      : await verifyAppleIdentityToken(idToken);
    const user = await findOrCreateOAuthUser(identity);
    return res.json({ user: { ...user, token: createUserToken(user) } });
  } catch (error) {
    console.error('OAuth sign-in failed:', error.message);
    return res.status(error.status || 401).json({ error: error.message || 'OAuth sign-in failed' });
  }
});

app.get('/api/auth/apple/start', (req, res) => {
  const redirectIsHttps = typeof appleRedirectUri === 'string' && appleRedirectUri.startsWith('https://');
  if (
    !appleServiceId ||
    !redirectIsHttps ||
    !process.env.APPLE_TEAM_ID ||
    !process.env.APPLE_KEY_ID ||
    !process.env.APPLE_PRIVATE_KEY ||
    !process.env.AUTH_SECRET ||
    process.env.AUTH_SECRET === 'dev-secret-change-me' ||
    Buffer.byteLength(authSecret) < 32
  ) {
    return res.status(503).json({ error: 'Apple OAuth server credentials are not configured' });
  }
  const returnUri = String(req.query.returnUri || '');
  if (!isAllowedAppleReturnUri(returnUri)) {
    return res.status(400).json({ error: 'unapproved Apple OAuth return URI' });
  }

  const nonce = crypto.randomBytes(32).toString('base64url');
  const state = createAppleOAuthState(returnUri, nonce);
  const authUrl = new URL('https://appleid.apple.com/auth/authorize');
  authUrl.searchParams.set('client_id', appleServiceId);
  authUrl.searchParams.set('redirect_uri', appleRedirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('response_mode', 'form_post');
  authUrl.searchParams.set('scope', 'name email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  return res.json({ authUrl: authUrl.toString() });
});

app.post('/api/auth/apple/callback', async (req, res) => {
  let stateData;
  try {
    stateData = parseAppleOAuthState(req.body.state);
    if (req.body.error) throw new Error('Apple sign-in was cancelled or denied');
    if (!req.body.code || !appleRedirectUri || !appleServiceId) {
      throw new Error('Apple authorization response is incomplete');
    }

    const clientSecret = await createAppleClientSecret();
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appleServiceId,
        client_secret: clientSecret,
        code: String(req.body.code),
        grant_type: 'authorization_code',
        redirect_uri: appleRedirectUri,
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.id_token) {
      throw new Error('Apple could not complete sign-in');
    }

    const identity = await verifyAppleIdentityToken(tokenData.id_token, stateData.nonce);
    const user = await findOrCreateOAuthUser(identity);
    const ticket = crypto.randomBytes(32).toString('base64url');
    await OAuthTicket.create({
      tokenHash: crypto.createHash('sha256').update(ticket).digest('hex'),
      userId: user.id,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });

    const returnUrl = new URL(stateData.returnUri);
    returnUrl.searchParams.set('ticket', ticket);
    return res.redirect(returnUrl.toString());
  } catch (error) {
    console.error('Apple OAuth callback failed:', error.message);
    if (stateData?.returnUri && isAllowedAppleReturnUri(stateData.returnUri)) {
      const returnUrl = new URL(stateData.returnUri);
      returnUrl.searchParams.set('error', 'apple_sign_in_failed');
      return res.redirect(returnUrl.toString());
    }
    return res.status(error.status || 400).send('Apple sign-in could not be completed');
  }
});

app.post('/api/auth/apple/exchange', oauthLimit, async (req, res) => {
  try {
    const ticket = String(req.body.ticket || '');
    if (!ticket || ticket.length > 200) {
      return res.status(400).json({ error: 'a valid Apple sign-in ticket is required' });
    }
    const tokenHash = crypto.createHash('sha256').update(ticket).digest('hex');
    const ticketRecord = await OAuthTicket.findOneAndDelete({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });
    if (!ticketRecord) return res.status(401).json({ error: 'Apple sign-in ticket expired or already used' });

    const user = await User.findById(ticketRecord.userId);
    if (!user || user.role === 'admin') return res.status(401).json({ error: 'Apple sign-in could not be completed' });
    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role || 'user',
        token: createUserToken(user),
      },
    });
  } catch (error) {
    console.error('Apple OAuth ticket exchange failed:', error.message);
    return res.status(500).json({ error: 'Apple sign-in could not be completed' });
  }
});

app.post('/api/auth/register', registerLimit, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const displayName = String(req.body.displayName || '').trim();
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });
    if (!isMongoReady || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'database is unavailable; account was not created' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'email already exists' });

    const user = await User.create({ email, password: hashPassword(password), displayName });
    return res.json({
      user: { id: user._id.toString(), email: user.email, displayName: user.displayName, token: createUserToken(user) },
    });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: 'email already exists' });
    console.error('Account registration failed:', error.message);
    return res.status(500).json({ error: 'account registration failed' });
  }
});

app.post('/api/auth/login', loginIpLimit, loginAccountLimit, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const configuredAdmin = email === adminEmail && safeEqualText(password, adminPassword);

    if (configuredAdmin) {
      const user = isMongoReady && mongoose.connection.readyState === 1
        ? await User.findOne({ email })
        : null;
      const adminUser = {
        id: user?._id?.toString() || 'admin-configured',
        email: adminEmail,
        displayName: user?.displayName || adminDisplayName,
        role: 'admin',
        adminToken: createAdminToken(adminEmail),
      };
      return res.json({ user: adminUser });
    }

    if (!isMongoReady || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'database is unavailable; please try again later' });
    }

    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    await upgradePasswordHashIfNeeded(user, password);

    const signedInUser = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role || 'user',
      token: createUserToken(user),
    };
    if (user.role === 'admin') signedInUser.adminToken = createAdminToken(user.email);
    return res.json({ user: signedInUser });
  } catch (error) {
    console.error('Account login failed:', error.message);
    return res.status(500).json({ error: 'account login failed' });
  }
});

app.post('/api/admin/login', adminLoginLimit, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const configuredAdmin = email === adminEmail && safeEqualText(password, adminPassword);
    const databaseAdmin = await User.findOne({ email, role: 'admin' });

    const databaseAdminOk = Boolean(databaseAdmin) && verifyPassword(password, databaseAdmin.password);
    if (!configuredAdmin && !databaseAdminOk) {
      return res.status(401).json({ error: 'invalid admin credentials' });
    }
    if (databaseAdminOk) await upgradePasswordHashIfNeeded(databaseAdmin, password);

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
    const DAY_MS = 24 * 60 * 60 * 1000;
    const todayStart = startOfLocalDay();
    const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);
    const [users, foods, logs, newUsers7d, dailyRows] = await Promise.all([
      User.countDocuments(),
      Food.countDocuments(),
      Log.countDocuments(),
      User.countDocuments({ createdAt: { $gte: weekStart } }),
      UserFood.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: REPORT_TIMEZONE } },
            logs: { $sum: 1 },
            users: { $addToSet: '$userId' },
          },
        },
      ]),
    ]);

    // One entry per day, oldest first, including days with no activity.
    const byDay = new Map(dailyRows.map((row) => [row._id, row]));
    const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: REPORT_TIMEZONE });
    const daily = Array.from({ length: 7 }, (_, index) => {
      const date = dayKey.format(new Date(weekStart.getTime() + index * DAY_MS + 12 * 60 * 60 * 1000));
      const row = byDay.get(date);
      return { date, logs: row?.logs || 0, activeUsers: row?.users.length || 0 };
    });

    return res.json({ users, foods, logs, newUsers7d, daily });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/reports', requireAdmin, async (req, res) => {
  try {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const last24h = new Date(now - DAY_MS);
    const last30d = new Date(now - 30 * DAY_MS);
    const prev30d = new Date(now - 60 * DAY_MS);

    const [activeUsers, [intake], topFoods, newUsers30d, newUsersPrev30d] = await Promise.all([
      UserFood.distinct('userId', { createdAt: { $gte: last24h } }),
      // Average kcal per user per logged day over the last 30 days.
      UserFood.aggregate([
        { $match: { createdAt: { $gte: last30d } } },
        { $group: { _id: { userId: '$userId', day: '$dateKey' }, kcal: { $sum: '$kcal' } } },
        { $group: { _id: null, avgKcal: { $avg: '$kcal' }, userDays: { $sum: 1 } } },
      ]),
      UserFood.aggregate([
        { $match: { createdAt: { $gte: last30d }, foodName: { $nin: [null, ''] } } },
        { $group: { _id: '$foodName', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 },
      ]),
      User.countDocuments({ createdAt: { $gte: last30d } }),
      User.countDocuments({ createdAt: { $gte: prev30d, $lt: last30d } }),
    ]);

    return res.json({
      activeUsers24h: activeUsers.length,
      avgDailyIntakeKcal: intake?.avgKcal == null ? null : Math.round(intake.avgKcal),
      userDays30d: intake?.userDays || 0,
      newUsers30d,
      newUsersPrev30d,
      // null when there is nothing to compare against.
      userGrowthPct: newUsersPrev30d > 0 ? ((newUsers30d - newUsersPrev30d) / newUsersPrev30d) * 100 : null,
      topFoods: topFoods.map((row) => ({ name: row._id, count: row.count })),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Spreadsheet apps execute cells starting with = + - @ as formulas.
function csvCell(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = value == null ? '' : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

app.get('/api/admin/export/user-foods.csv', requireAdmin, async (req, res) => {
  try {
    const emails = new Map(
      (await User.find({}, { email: 1 }).lean()).map((user) => [user._id.toString(), user.email])
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="caltrack-user-logs-${new Date().toISOString().slice(0, 10)}.csv"`);
    // BOM so Excel opens Thai text as UTF-8.
    res.write('﻿');
    const columns = ['userId', 'email', 'dateKey', 'foodName', 'kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'source', 'createdAt'];
    res.write(`${columns.join(',')}\r\n`);
    const cursor = UserFood.find({}, { entry: 0 }).sort({ createdAt: 1 }).lean().cursor();
    for await (const row of cursor) {
      const record = { ...row, email: emails.get(String(row.userId)) || '' };
      res.write(`${columns.map((column) => csvCell(record[column])).join(',')}\r\n`);
    }
    return res.end();
  } catch (error) {
    if (res.headersSent) return res.end();
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/export/foods.json', requireAdmin, async (req, res) => {
  try {
    const foods = await Food.find({}, { _id: 0, __v: 0 }).sort({ foodId: 1 }).lean();
    res.setHeader('Content-Disposition', `attachment; filename="caltrack-foods-${new Date().toISOString().slice(0, 10)}.json"`);
    return res.json(foods);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/scan-logs', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [logs, [totals]] = await Promise.all([
      ScanLog.find().sort({ createdAt: -1 }).limit(limit).lean(),
      ScanLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            scans: { $sum: 1 },
            avgLatencyMs: { $avg: '$latencyMs' },
            tokens: { $sum: { $ifNull: ['$tokens', 0] } },
            succeeded: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
      ]),
    ]);
    const stats = {
      scans: totals?.scans || 0,
      avgLatencyMs: totals?.avgLatencyMs == null ? null : Math.round(totals.avgLatencyMs),
      successRate: totals?.scans ? totals.succeeded / totals.scans : null,
      tokens: totals?.tokens || 0,
      failed: totals?.failed || 0,
    };
    return res.json({ logs, stats });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Returns an error message if removing admin rights from `target` (delete or
// demote) would lock the acting admin out or leave no admin account.
async function checkAdminRemoval(target, actingAdmin) {
  if (String(target.email || '').toLowerCase() === String(actingAdmin?.email || '').toLowerCase()) {
    return 'You cannot remove your own admin account or rights';
  }
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount <= 1) return 'At least one admin account must remain';
  return null;
}

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const pattern = q ? new RegExp(escapeRegex(q), 'i') : null;
    const filter = pattern ? { $or: [{ email: pattern }, { displayName: pattern }] } : {};
    const [users, total] = await Promise.all([
      User.find(filter, { password: 0 }).sort({ createdAt: -1 }).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return res.json({ users, total });
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

    const target = await User.findById(req.params.userId).lean();
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin' && updates.role === 'user') {
      const guardError = await checkAdminRemoval(target, req.admin);
      if (guardError) return res.status(400).json({ error: guardError });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, updates, { new: true, select: '-password' }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const target = await User.findById(req.params.userId).lean();
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') {
      const guardError = await checkAdminRemoval(target, req.admin);
      if (guardError) return res.status(400).json({ error: guardError });
    }

    const userId = target._id.toString();
    // Remove the user's personal data with the account. Scan audit logs are kept.
    await Promise.all([
      Profile.deleteMany({ userId }),
      Log.deleteMany({ userId }),
      WeightLog.deleteMany({ userId }),
      UserFood.deleteMany({ userId }),
      ScanImage.deleteMany({ userId }),
    ]);
    await User.deleteOne({ _id: target._id });
    const { password: _password, ...user } = target;
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
    const { nameTh, nameEn, kcal, protein_g, carbAvailable_g, fat_g } = req.body;
    const foodId = String(req.body.foodId ?? '').trim();
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

app.get('/api/profiles/:userId', requireSelf, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profiles/:userId', requireSelf, async (req, res) => {
  try {
    const payload = { ...req.body, userId: req.params.userId, updatedAt: new Date() };
    const profile = await Profile.findOneAndUpdate({ userId: req.params.userId }, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/profiles/:userId', requireSelf, async (req, res) => {
  try {
    const profile = await Profile.findOneAndDelete({ userId: req.params.userId });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/weights/:userId', requireSelf, async (req, res) => {
  try {
    const weights = await WeightLog.find({ userId: req.params.userId }).sort({ dateKey: 1 });
    return res.json({ weights });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put('/api/weights/:userId/:dateKey', requireSelf, async (req, res) => {
  try {
    const weightKg = Number(req.body.weightKg);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
      return res.status(400).json({ error: 'weightKg must be between 20 and 400' });
    }
    const weight = await WeightLog.findOneAndUpdate(
      { userId: req.params.userId, dateKey: req.params.dateKey },
      { $set: { weightKg, updatedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return res.json({ weight });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:userId/data', requireSelf, async (req, res) => {
  try {
    const { userId } = req.params;
    await Promise.all([
      Profile.deleteOne({ userId }),
      Log.deleteMany({ userId }),
      UserFood.deleteMany({ userId }),
      WeightLog.deleteMany({ userId }),
    ]);
    return res.json({ message: 'user data cleared' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/logs/:userId', requireSelf, async (req, res) => {
  try {
    const logs = await Log.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ logs: logs.map(normalizeFoodLog) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logs/:userId', requireSelf, async (req, res) => {
  try {
    const { userId } = req.params;
    const dateKey = String(req.body.dateKey || req.body.entry?.date || new Date().toISOString().slice(0, 10));
    const inputEntry = req.body.entry && typeof req.body.entry === 'object' ? req.body.entry : {};
    const macros = inputEntry.macros && typeof inputEntry.macros === 'object' ? inputEntry.macros : {};
    const entryProtein = Number(inputEntry.protein ?? macros.protein) || 0;
    const entryCarbs = Number(inputEntry.carbs ?? inputEntry.carb ?? macros.carbs ?? macros.carb) || 0;
    const entryFat = Number(inputEntry.fat ?? macros.fat) || 0;
    const entry = {
      ...inputEntry,
      id: undefined,
      date: inputEntry.date || dateKey,
      meal: inputEntry.meal || inputEntry.mealType || 'snack',
      protein: entryProtein,
      carbs: entryCarbs,
      fat: entryFat,
      macros: { protein: entryProtein, carb: entryCarbs, fat: entryFat },
    };
    delete entry.id;
    const createdLog = await Log.create({ userId, dateKey, entry });
    const log = normalizeFoodLog(createdLog);

    let foodName = 'อาหารทั่วไป';
    let kcal = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sugar = 0, sodium = 0;

    if (entry.name || entry.foodName) foodName = entry.name || entry.foodName;
    kcal = Number(entry.kcal || entry.calories) || 0;
    protein = Number(entry.protein) || 0;
    carbs = Number(entry.carbs) || 0;
    fat = Number(entry.fat) || 0;
    fiber = Number(entry.fiber) || 0;
    sugar = Number(entry.sugar) || 0;
    sodium = Number(entry.sodium) || 0;

    const userFood = await UserFood.create({
      userId,
      logId: log._id,
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

app.patch('/api/logs/:userId/:logId', requireSelf, async (req, res) => {
  try {
    const { userId: _ignoredUserId, _id: _ignoredId, ...updates } = req.body || {};
    const log = await Log.findOneAndUpdate({ userId: req.params.userId, _id: req.params.logId }, updates, { new: true });
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/logs/:userId/:logId', requireSelf, async (req, res) => {
  try {
    const { userId, logId } = req.params;
    const log = await Log.findOneAndDelete({ userId, _id: logId });
    if (!log) return res.status(404).json({ error: 'log not found' });
    // best-effort: remove the mirrored analytics row too (has logId when created by this server)
    await UserFood.deleteOne({ logId: log._id });
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// FOOD DATABASE — SEARCH, LOOKUP, NUTRITION CALCULATION
// ---------------------------------------------------------------------------

// GET /api/foods/search?q=ข้าว&limit=20
// Searches nameTh, nameEn and scientificName with a case-insensitive partial match,
// under any listed spelling ("กระเพรา" = "กะเพรา") and everyday-name alias
// ("ข้าวสวย" → "ข้าวเจ้า, นึ่ง"; see server/thaiFoodAliases.js). Rows are ranked in
// server/foodMatching before `limit` is applied, so the best match is never cut off.
const SEARCH_PREFIX_POOL = 300;
const SEARCH_CONTAINS_POOL = 600;

app.get('/api/foods/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().slice(0, 100);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    if (!q) {
      return res.json({ results: [], count: 0 });
    }

    const thaiSources = thaiNameVariants(q).map((variant) => spellingRegexSource(variant.name));
    const rawSource = escapeRegex(q);
    const anyName = (prefix) => [
      ...thaiSources.map((source) => ({ nameTh: new RegExp(prefix + source, 'i') })),
      { nameEn: new RegExp(prefix + rawSource, 'i') },
    ];
    // Names starting with the query hold the exact/variant matches; fetch them
    // separately so a long list of "contains" hits can't crowd them out.
    const [prefixHits, containsHits] = await Promise.all([
      Food.find({ $or: anyName('^') }).limit(SEARCH_PREFIX_POOL).lean(),
      Food.find({ $or: [...anyName(''), { scientificName: new RegExp(rawSource, 'i') }] })
        .limit(SEARCH_CONTAINS_POOL)
        .lean(),
    ]);
    const pool = [...new Map([...prefixHits, ...containsHits].map((food) => [String(food._id), food])).values()];
    const results = rankSearchResults(pool, q, limit);

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
const SCAN_LOW_CONFIDENCE = 0.7;

// Database candidates for one AI-detected dish: pre-filter in MongoDB on the
// whole names (the AI's name, its aliases and table aliases) and on any Thai
// word/word-pair or whole English word, then rank in server/foodMatching.
// The whole-name query runs separately so word hits can't crowd out the best rows.
async function findFoodCandidates(nameTh, nameEn, limit = 5, aliases = []) {
  const { names, terms } = candidateSearchTerms(nameTh, aliases);
  const conditions = [
    ...terms.map((term) => ({ nameTh: new RegExp(spellingRegexSource(term)) })),
    ...englishWords(nameEn).map((word) => ({ nameEn: new RegExp(`\\b${escapeRegex(word)}\\b`, 'i') })),
  ];
  if (!conditions.length) return [];
  const [nameHits, termHits] = await Promise.all([
    names.length
      ? Food.find({ $or: names.map((name) => ({ nameTh: new RegExp(spellingRegexSource(name)) })) }).limit(300).lean()
      : [],
    Food.find({ $or: conditions }).limit(1500).lean(),
  ]);
  const pool = [...new Map([...nameHits, ...termHits].map((food) => [String(food._id), food])).values()];
  return rankFoodCandidates(pool, nameTh, nameEn, limit, { aliases });
}
const SCAN_PROMPT_MAX_LENGTH = 4000;
// The JSON response schema is fixed in code; admins only edit the instructions.
const DEFAULT_SCAN_PROMPT = `
วิเคราะห์อาหารทุกชนิดที่มองเห็นแยกเป็นรายการ ไม่รวมอาหารต่างชนิดเป็นเมนูเดียว
การตั้งชื่อ (name_th) ให้ตรงกับตารางคุณค่าทางโภชนาการอาหารไทย:
- ขึ้นต้นด้วยชนิดอาหารหลัก ตามด้วยส่วนประกอบหรือวิธีปรุง คั่นด้วยจุลภาค เช่น "ข้าวผัด, หมู" "ส้มตำ, ปลาร้า" "ก๋วยเตี๋ยวเส้นเล็ก, หมู, น้ำ"
- สะกดตามพจนานุกรม เช่น กะเพรา ก๋วยเตี๋ยว ผัดไทย ซีอิ๊ว กะทิ
- ข้าวสวยให้ใช้ "ข้าวเจ้า, นึ่ง" ข้าวเหนียวให้ใช้ "ข้าวเหนียว, นึ่ง"
- กับข้าวราดบนข้าวในจานเดียว (ข้าวราดแกง ข้าวราดกะเพรา) ให้เป็นรายการเดียวชื่อ "ข้าวราด..." เช่น "ข้าวราดผัดกะเพราไก่"
- ข้าวที่ผัดหรือหุงรวมกับเครื่อง (ข้าวผัด ข้าวมันไก่ ข้าวหมก) เป็นรายการเดียว
- ข้าวแยกถ้วยหรือแยกจานจากกับข้าว ให้แยกเป็นรายการข้าวกับรายการกับข้าว
- ใส่ชื่ออื่นที่คนไทยเรียกกันทั่วไปใน aliases (ไม่เกิน 3 ชื่อ) เช่น "ข้าวสวย" "ชาไทย" "กะเพราไก่"
ประเมินกรัมเป็นช่วง min/likely/max โดยเทียบกับภาชนะไทยทั่วไป และย้ำว่าเป็นค่าประมาณจากภาพ ไม่ใช่การชั่งจริง:
- ข้าวสวย 1 ทัพพี ประมาณ 55-60 กรัม ข้าวราดแกง 1 จาน ข้าวประมาณ 150-200 กรัม
- ก๋วยเตี๋ยวน้ำ 1 ชาม ประมาณ 350-450 กรัม รวมน้ำซุป แกง/ต้ม 1 ถ้วย ประมาณ 200-250 กรัม
- อาหารจานเดียว (ข้าวผัด ผัดไทย) 1 จาน ประมาณ 250-350 กรัม เครื่องดื่ม 1 แก้ว ประมาณ 250-400 กรัม
- ใช้ช้อน ส้อม ตะเกียบ หรือมือในภาพเป็นตัวเทียบขนาดถ้ามี และระบุใน reference_object
ใส่กรอบภาพเป็น [ymin, xmin, ymax, xmax] ช่วง 0-1000 หากระบุตำแหน่งได้
ประมาณสารอาหารสำหรับน้ำหนัก likely ของแต่ละรายการ และตอบ JSON ตาม schema เท่านั้น
หากไม่แน่ใจชื่อ ให้ใช้ชื่อที่ใกล้เคียงและลด confidence ห้ามแต่งข้อมูลอ้างอิงหรือค่าความแม่นยำ
`.trim();

// Returns { model, prompt } with defaults filled in. The saved model is only
// honoured if it is still in GEMINI_SCAN_MODELS.
async function getAiScanConfig() {
  let saved = {};
  if (isMongoReady) {
    try {
      saved = (await AppSetting.findOne({ key: 'aiScan' }).lean())?.value || {};
    } catch (error) {
      console.warn('AI scan config could not be loaded:', error.message);
    }
  }
  return {
    model: geminiScanModels.includes(saved.model) ? saved.model : geminiScanModels[0],
    prompt: typeof saved.prompt === 'string' && saved.prompt.trim() ? saved.prompt : DEFAULT_SCAN_PROMPT,
  };
}

app.get('/api/admin/system-settings', requireAdmin, async (req, res) => {
  try {
    return res.json(await getSystemSettings({ fresh: true }));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/system-settings', requireAdmin, async (req, res) => {
  try {
    const maxFreeScansPerDay = Number(req.body?.maxFreeScansPerDay);
    const { maintenanceMode } = req.body || {};
    if (!Number.isInteger(maxFreeScansPerDay) || maxFreeScansPerDay < 0 || maxFreeScansPerDay > 1000) {
      return res.status(400).json({ error: 'maxFreeScansPerDay must be a whole number from 0 to 1000' });
    }
    if (typeof maintenanceMode !== 'boolean') {
      return res.status(400).json({ error: 'maintenanceMode must be true or false' });
    }
    if (!isMongoReady) return res.status(503).json({ error: 'database is not connected' });

    await AppSetting.findOneAndUpdate(
      { key: 'system' },
      { value: { maxFreeScansPerDay, maintenanceMode }, updatedBy: req.admin?.email, updatedAt: new Date() },
      { upsert: true }
    );
    return res.json(await getSystemSettings({ fresh: true }));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/ai-scan-config', requireAdmin, async (req, res) => {
  const config = await getAiScanConfig();
  return res.json({ ...config, models: geminiScanModels, defaultPrompt: DEFAULT_SCAN_PROMPT });
});

app.put('/api/admin/ai-scan-config', requireAdmin, async (req, res) => {
  try {
    const { model, prompt } = req.body || {};
    if (!geminiScanModels.includes(model)) {
      return res.status(400).json({ error: `model must be one of: ${geminiScanModels.join(', ')}` });
    }
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt is required' });
    }
    if (prompt.length > SCAN_PROMPT_MAX_LENGTH) {
      return res.status(400).json({ error: `prompt must be at most ${SCAN_PROMPT_MAX_LENGTH} characters` });
    }
    if (!isMongoReady) return res.status(503).json({ error: 'database is not connected' });

    await AppSetting.findOneAndUpdate(
      { key: 'aiScan' },
      { value: { model, prompt: prompt.trim() }, updatedBy: req.admin?.email, updatedAt: new Date() },
      { upsert: true }
    );
    return res.json(await getAiScanConfig());
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/scan', requireUser, async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', storeImage = false } = req.body || {};
    // From the token, not the body, so the daily quota can't be dodged. Admin scans have no user.
    const userId = req.user?.id || null;
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

    // Daily free-scan quota (Admin → Settings). Failed scans don't count.
    const { maxFreeScansPerDay } = await getSystemSettings();
    if (maxFreeScansPerDay > 0 && userId && isMongoReady) {
      const usedToday = await ScanLog.countDocuments({
        userId,
        status: { $ne: 'failed' },
        createdAt: { $gte: startOfLocalDay() },
      });
      if (usedToday >= maxFreeScansPerDay) {
        return res.status(429).json({
          error: `วันนี้ใช้สแกนครบ ${maxFreeScansPerDay} ครั้งแล้ว กรุณาลองใหม่พรุ่งนี้ หรือค้นหาอาหารด้วยตนเอง`,
          code: 'SCAN_QUOTA_EXCEEDED',
        });
      }
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    let scanId = null;
    let usedModel = null;
    const startedAt = Date.now();
    // Fire-and-forget: an audit-log failure must never break the scan response.
    const logScan = (status, fields = {}) => {
      if (!isMongoReady) return;
      ScanLog.create({
        userId,
        scanId,
        mimeType,
        model: usedModel,
        status,
        latencyMs: Date.now() - startedAt,
        tokens: Number(data?.usageMetadata?.totalTokenCount) || null,
        ...fields,
      }).catch((logError) => console.warn('Scan audit log could not be saved:', logError.message));
    };

    if (storeImage === true) {
      try {
        const savedScan = await ScanImage.create({ userId, imageBase64: cleanBase64, mimeType });
        scanId = savedScan._id.toString();
      } catch (storageError) {
        console.warn('Consented scan image could not be saved:', storageError.message);
      }
    }

    const scanConfig = await getAiScanConfig();
    const promptText = scanConfig.prompt;
    // Admin's chosen model first; the remaining configured models stay as fallbacks.
    const scanModels = [scanConfig.model, ...geminiScanModels.filter((m) => m !== scanConfig.model)];

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
                      aliases: { type: 'ARRAY', items: { type: 'STRING' } },
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
          scanModels,
          (model) => {
            usedModel = model;
            return requestGemini(
              `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
              requestBody
            );
          },
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
        logScan('failed', { error: details.error || geminiError.message });
        return res.status(502).json(details);
      }

      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        logScan('failed', { error: 'empty Gemini response' });
        return res.status(502).json({ error: 'AI ไม่ได้ส่งผลวิเคราะห์กลับมา กรุณาลองใหม่' });
      }

      let parsed;
      try {
        parsed = parseGeminiJson(responseText);
      } catch (parseError) {
        console.warn('Gemini returned malformed scan JSON:', parseError.message);
        logScan('failed', { error: 'malformed Gemini JSON' });
        return res.status(502).json({ error: 'AI ส่งผลวิเคราะห์ในรูปแบบที่อ่านไม่ได้ กรุณาลองใหม่' });
      }
      if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
        logScan('no_food');
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
        const nameEn = String(rawItem.name_en || '').trim();
        const aliases = (Array.isArray(rawItem.aliases) ? rawItem.aliases : [])
          .map((alias) => String(alias || '').trim())
          .filter((alias) => alias && alias.length <= 80 && alias !== nameTh)
          .slice(0, 5);
        let candidates = [];
        try {
          candidates = await findFoodCandidates(nameTh, nameEn, 5, aliases);
        } catch (matchError) {
          console.warn('Food candidate lookup failed:', matchError.message);
        }

        items.push({
          name_th: nameTh,
          name_en: nameEn,
          aliases,
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
            matchType: food.matchType,
            matchScore: food.matchScore,
            // The app pre-selects this candidate instead of the AI's own estimate.
            confident: isConfidentMatch(food),
            estimated: Array.isArray(food.estimated) ? food.estimated : [],
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
        logScan('failed', { error: 'incomplete item data' });
        return res.status(502).json({ error: 'AI ส่งข้อมูลอาหารไม่ครบถ้วน กรุณาลองใหม่' });
      }

      const topConfidence = Math.max(...items.map((item) => item.confidence));
      logScan(topConfidence < SCAN_LOW_CONFIDENCE ? 'low_conf' : 'success', {
        items: items.map(({ name_th, confidence }) => ({ name_th, confidence })),
        topConfidence,
      });

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

app.get('/api/scan-images/:scanId', requireUser, async (req, res) => {
  try {
    const scan = await ScanImage.findById(req.params.scanId).lean();
    // Same 404 for "not yours" so scan ids can't be probed.
    if (!scan || (!req.admin && scan.userId !== req.user.id)) {
      return res.status(404).json({ error: 'scan image not found' });
    }
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
    const { topic, detail } = req.body;
    // Signed-in users file tickets as themselves; only an admin may name another email.
    const userId = req.user ? req.user.id : String(req.body.userId || '');
    const userEmail = req.user ? req.user.email : String(req.body.userEmail || '');
    if (!userEmail || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'userEmail and topic are required' });
    }
    const fields = {
      userId,
      userEmail: userEmail.trim().toLowerCase(),
      topic: topic.trim().slice(0, 200),
      detail: String(detail || '').trim().slice(0, 5000),
      status: 'Open',
    };
    // 8 random hex chars (~4 billion ids); retry on the rare unique-index collision.
    let ticket;
    for (let attempt = 0; !ticket; attempt += 1) {
      const ticketId = `TK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      try {
        ticket = await Ticket.create({ ...fields, ticketId });
      } catch (error) {
        if (error?.code !== 11000 || attempt >= 4) throw error;
      }
    }
    res.status(201).json({ ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handleGetTickets = async (req, res) => {
  try {
    // Users always get their own tickets; admins get all, or one email via ?email=.
    const email = req.user ? req.user.email : String(req.query.email || '').trim().toLowerCase();
    const filter = email ? { userEmail: email } : {};
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
    if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'status must be Open, In Progress, or Resolved' });
    }
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

app.post('/tickets', requireUser, handleCreateTicket);
app.post('/api/tickets', requireUser, handleCreateTicket);
app.get('/tickets', requireUser, handleGetTickets);
app.get('/api/tickets', requireUser, handleGetTickets);
app.patch('/tickets/:id', requireAdmin, handleUpdateTicket);
app.patch('/api/tickets/:id', requireAdmin, handleUpdateTicket);
app.delete('/tickets/:id', requireAdmin, handleDeleteTicket);
app.delete('/api/tickets/:id', requireAdmin, handleDeleteTicket);

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
  // Wait for the first attempt so early requests don't race the connection;
  // the admin account is ensured from the 'connected' handler.
  await connectMongo();

  const server = app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${port} is currently in use (another server is probably still running).`);
      console.error(`👉 Stop that server, or find it with "netstat -ano | findstr :${port}" and end only that PID, or change PORT in .env.`);
    } else {
      console.error('❌ Server error:', err);
    }
  });
}

// Start only when run directly (`node server.js`); tests require the app
// and connect it to their own database.
if (require.main === module) {
  startServer();
}

module.exports = { app };