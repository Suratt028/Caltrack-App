const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { transformFileSync } = require('@babel/core');

const source = transformFileSync(path.resolve(__dirname, '..', 'src/utils/weightOutlook.js'), {
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
const mod = { exports: {} };
new Function('module', 'exports', source)(mod, mod.exports);
const { weightOutlook } = mod.exports;

const TODAY = new Date(2026, 10, 13);
const key = (back) => {
  const d = new Date(2026, 10, 13 - back);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const logsFor = (backs, kcal) => Object.fromEntries(backs.map((b) => [key(b), [{ kcal }]]));

test('logging every day at goal projects (goal - TDEE) x 28 / 7700 kg', () => {
  const out = weightOutlook({ logsByDay: logsFor([1, 2, 3, 4], 1500), tdee: 2000, goalKcal: 1500, weightKg: 60, today: TODAY });
  assert.ok(Math.abs(out.everyDay.change - (-500 * 28) / 7700) < 1e-9);
  assert.ok(out.everyDay.low < out.everyDay.change && out.everyDay.high > out.everyDay.change);
  assert.ok(Math.abs(out.everyDay.weight - (60 - 1.818)) < 0.01);
});

test('"as before" counts unlogged days at maintenance, so fewer logged days means less change', () => {
  const half = weightOutlook({ logsByDay: logsFor([1, 2, 3, 4, 5, 6, 7], 1500), tdee: 2000, goalKcal: 1500, weightKg: 60, today: TODAY });
  const full = weightOutlook({ logsByDay: logsFor([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 1500), tdee: 2000, goalKcal: 1500, weightKg: 60, today: TODAY });
  assert.equal(half.loggedDays, 7);
  assert.ok(Math.abs(half.asBefore.change - full.asBefore.change / 2) < 1e-9);
  assert.ok(Math.abs(full.asBefore.change - full.everyDay.change) < 1e-9);
});

test('today is not counted and the 14-day strip marks logged days', () => {
  const out = weightOutlook({ logsByDay: { ...logsFor([0], 900), ...logsFor([1, 14, 15], 1500) }, tdee: 2000, goalKcal: 1500, weightKg: 60, today: TODAY });
  assert.equal(out.days.length, 14);
  assert.equal(out.loggedDays, 2); // day 1 and day 14; today (0) and day 15 are outside
  assert.equal(out.days.at(-1).dateKey, key(1));
});

test('needs 3 logged days for the "as before" line and valid inputs overall', () => {
  const few = weightOutlook({ logsByDay: logsFor([1, 2], 1500), tdee: 2000, goalKcal: 1500, weightKg: 60, today: TODAY });
  assert.equal(few.enough, false);
  assert.equal(few.asBefore, null);
  assert.equal(weightOutlook({ logsByDay: {}, tdee: 0, goalKcal: 1500, weightKg: 60 }), null);
});
