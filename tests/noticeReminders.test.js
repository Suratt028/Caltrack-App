const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { transformFileSync } = require('@babel/core');

const source = transformFileSync(path.resolve(__dirname, '..', 'src/utils/noticeReminders.js'), {
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
const mod = { exports: {} };
new Function('module', 'exports', source)(mod, mod.exports);
const { noticeReminderPlan } = mod.exports;

const NOW = new Date(2026, 10, 13, 18, 0);
const at = (h, m = 0) => new Date(2026, 10, 13, h, m).toISOString();
const notice = (id, start, end, kind = 'maintenance') => ({ id, kind, title: 'ปิดปรับปรุงระบบ', startsAt: start, endsAt: end });

test('reminds 30 minutes before an upcoming notice, with time in the body', () => {
  const [plan] = noticeReminderPlan([notice('a', at(22), at(23))], NOW);
  assert.equal(plan.id, 'a');
  assert.equal(plan.date.getHours(), 21);
  assert.equal(plan.date.getMinutes(), 30);
  assert.equal(plan.title, 'อีกไม่นานจะปิดปรับปรุงระบบ');
  assert.match(plan.body, /22:00–23:00/);
});

test('if the 30-minute mark has passed, reminds a minute from now (never after it starts)', () => {
  const [plan] = noticeReminderPlan([notice('soon', at(18, 10), at(19))], NOW);
  assert.equal(plan.date.getTime(), NOW.getTime() + 60 * 1000);
});

test('running or ended notices get no reminder; update notices get their own title', () => {
  const plans = noticeReminderPlan(
    [notice('live', at(17), at(19)), notice('old', at(10), at(11)), notice('upd', at(20), at(21), 'update')],
    NOW
  );
  assert.deepEqual(plans.map((p) => p.id), ['upd']);
  assert.equal(plans[0].title, 'อีกไม่นานจะมีการอัปเดตแอป');
});
