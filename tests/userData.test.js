const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { transformFileSync } = require('@babel/core');

// Loads an ES module from src/ as CommonJS; `stubs` replaces its imports by specifier.
function loadModule(relativePath, stubs = {}) {
  const filePath = path.resolve(__dirname, '..', relativePath);
  const source = transformFileSync(filePath, {
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const mod = { exports: {} };
  const localRequire = (specifier) => (specifier in stubs ? stubs[specifier] : require(specifier));
  new Function('module', 'exports', 'require', source)(mod, mod.exports, localRequire);
  return mod.exports;
}

const calculations = loadModule('src/utils/calculations.js');
const transforms = loadModule('src/data/userDataTransforms.js', {
  '../utils/calculations': calculations,
});

test('groups API logs by date and normalises macros', () => {
  const grouped = transforms.groupLogsByDate([
    { _id: 'a'.repeat(24), dateKey: '2026-11-12', entry: { name: 'ข้าวมันไก่', kcal: 600, macros: { protein: 20, carb: 70, fat: 25 } } },
    { _id: 'b'.repeat(24), dateKey: '2026-11-12', entry: { name: 'ส้มตำ', kcal: 120, protein: '3', carbs: 20, fat: 2, mealType: 'lunch' } },
    { _id: 'c'.repeat(24), dateKey: '2026-11-13', entry: { name: 'กาแฟ' } },
  ]);

  assert.deepEqual(Object.keys(grouped), ['2026-11-12', '2026-11-13']);
  const [rice, papaya] = grouped['2026-11-12'];
  assert.equal(rice.id, 'a'.repeat(24));
  assert.equal(rice.carbs, 70);
  assert.equal(rice.meal, 'snack');
  assert.deepEqual(papaya.macros, { protein: 3, carb: 20, fat: 2 });
  assert.equal(papaya.meal, 'lunch');
  assert.deepEqual(grouped['2026-11-13'][0].macros, { protein: 0, carb: 0, fat: 0 });
});

test('groups weights by date and drops invalid ones', () => {
  assert.deepEqual(
    transforms.groupWeightsByDate([
      { dateKey: '2026-11-12', weightKg: '70.5' },
      { dateKey: '2026-11-13', weightKg: 'abc' },
      { weightKg: 60 },
    ]),
    { '2026-11-12': 70.5 }
  );
});

test('sums day totals, treating missing numbers as zero', () => {
  assert.deepEqual(
    transforms.sumDayTotals([{ kcal: 600, protein: 20, carbs: 70, fat: 25 }, { kcal: '120', protein: null }]),
    { kcal: 720, protein: 20, carbs: 70, fat: 25 }
  );
  assert.deepEqual(transforms.sumDayTotals(undefined), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
});

test('a profile counts as complete only with valid body metrics, and gets goals', () => {
  const base = { gender: 'female', age: 30, heightCm: 160, weightKg: 55, activityLevel: 'light', goal: 'maintain' };
  const complete = transforms.toCompleteProfile(base);
  assert.ok(complete.calorieGoal > 0);
  assert.equal(transforms.toCompleteProfile({ ...base, heightCm: 20 }), null);
  assert.equal(transforms.toCompleteProfile(null), null);
});

test('local log patches keep macros in step', () => {
  const patched = transforms.applyLogPatch({ id: '1', protein: 10, carbs: 10, fat: 10 }, { protein: '15' });
  assert.deepEqual(patched.macros, { protein: 15, carb: 10, fat: 10 });
});

test('tells server log ids and remote users apart from local ones', () => {
  assert.equal(transforms.isServerLogId('a'.repeat(24)), true);
  assert.equal(transforms.isServerLogId('1731400000000_ab12c'), false);
  assert.equal(transforms.isRemoteUser({ id: '64f0c0ffee' }), true);
  assert.equal(transforms.isRemoteUser({ id: 'local_123' }), false);
  assert.equal(transforms.isRemoteUser(null), false);
});

test('retries only network failures, timeouts, 5xx and 429 — at most twice', () => {
  const offline = Object.assign(new Error('offline'), { code: 'OFFLINE' });
  const { shouldRetry } = loadModule('src/data/queryClient.js', {
    'react-native': { AppState: {}, Platform: { OS: 'web' } },
    '@react-native-async-storage/async-storage': {},
    '@react-native-community/netinfo': {},
    '@tanstack/query-async-storage-persister': { createAsyncStoragePersister: () => ({}) },
    '../services/atlasService': { isOfflineError: (error) => error?.code === 'OFFLINE' },
  });

  assert.equal(shouldRetry(0, offline), true);
  assert.equal(shouldRetry(0, { status: 503 }), true);
  assert.equal(shouldRetry(0, { status: 429 }), true);
  assert.equal(shouldRetry(0, { status: 401 }), false);
  assert.equal(shouldRetry(0, { status: 404 }), false);
  assert.equal(shouldRetry(2, offline), false);
});
