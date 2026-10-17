const AsyncStorage = require('@react-native-async-storage/async-storage');

const USERS_KEY = '@caltrack/local-users';

function displayNameFromEmail(email = '') {
  const base = String(email || '').split('@')[0] || 'User';
  return base
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function readUsers(storage = AsyncStorage) {
  const raw = await storage.getItem(USERS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUsers(users, storage = AsyncStorage) {
  await storage.setItem(USERS_KEY, JSON.stringify(users));
}

async function registerLocalUser({ email, password, displayName, storage = AsyncStorage } = {}) {
  if (!email || !password) {
    throw new Error('กรุณากรอกอีเมลและรหัสผ่าน');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedPassword = String(password);
  const users = await readUsers(storage);
  const sameEmail = users.find((user) => user.email === normalizedEmail);

  if (sameEmail) {
    throw new Error('email already exists');
  }

  const user = {
    id: `local_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    email: normalizedEmail,
    password: trimmedPassword,
    displayName: (displayName || displayNameFromEmail(normalizedEmail)).trim() || displayNameFromEmail(normalizedEmail),
    createdAt: new Date().toISOString(),
  };

  await writeUsers([...users, user], storage);
  return { id: user.id, email: user.email, displayName: user.displayName };
}

async function loginLocalUser({ email, password, storage = AsyncStorage } = {}) {
  if (!email || !password) {
    throw new Error('กรุณากรอกอีเมลและรหัสผ่าน');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const users = await readUsers(storage);
  const matched = users.find((user) => user.email === normalizedEmail && user.password === String(password));

  if (!matched) {
    throw new Error('invalid credentials');
  }

  return {
    id: matched.id,
    email: matched.email,
    displayName: matched.displayName,
  };
}

const localAuth = { registerLocalUser, loginLocalUser };

module.exports = localAuth;
module.exports.registerLocalUser = registerLocalUser;
module.exports.loginLocalUser = loginLocalUser;

if (typeof globalThis !== 'undefined') {
  globalThis.registerLocalUser = registerLocalUser;
  globalThis.loginLocalUser = loginLocalUser;
}
