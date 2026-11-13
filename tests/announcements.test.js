const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAnnouncement, announcementStatus, visibleAnnouncements } = require('../server/announcements');

const H = 60 * 60 * 1000;
const base = new Date('2026-11-20T15:00:00.000Z');
const valid = {
  kind: 'maintenance',
  title: 'ปิดปรับปรุงระบบ',
  message: 'ปรับปรุงเซิร์ฟเวอร์ประมาณ 1 ชั่วโมง',
  startsAt: base.toISOString(),
  endsAt: new Date(base.getTime() + H).toISOString(),
};

test('valid input is cleaned and notifyFrom defaults to 24 h before start', () => {
  const { value, error } = validateAnnouncement({ ...valid, title: '  ปิดปรับปรุงระบบ  ' });
  assert.equal(error, undefined);
  assert.equal(value.title, 'ปิดปรับปรุงระบบ');
  assert.equal(value.notifyFrom.getTime(), base.getTime() - 24 * H);
  assert.equal(value.active, true);
});

test('rejects bad kinds, empty titles, reversed or overlong windows, late notify times', () => {
  assert.ok(validateAnnouncement({ ...valid, kind: 'party' }).error);
  assert.ok(validateAnnouncement({ ...valid, title: '   ' }).error);
  assert.ok(validateAnnouncement({ ...valid, endsAt: valid.startsAt }).error);
  assert.ok(validateAnnouncement({ ...valid, startsAt: 'not a date' }).error);
  assert.ok(validateAnnouncement({ ...valid, endsAt: new Date(base.getTime() + 31 * 24 * H).toISOString() }).error);
  assert.ok(validateAnnouncement({ ...valid, notifyFrom: new Date(base.getTime() + H).toISOString() }).error);
  assert.ok(validateAnnouncement({ ...valid, notifyFrom: new Date(base.getTime() - 31 * 24 * H).toISOString() }).error);
});

test('status follows the clock: scheduled → upcoming → live → ended, or hidden', () => {
  const { value } = validateAnnouncement({ ...valid, notifyFrom: new Date(base.getTime() - 2 * H).toISOString() });
  assert.equal(announcementStatus(value, new Date(base.getTime() - 3 * H)), 'scheduled');
  assert.equal(announcementStatus(value, new Date(base.getTime() - H)), 'upcoming');
  assert.equal(announcementStatus(value, new Date(base.getTime() + H / 2)), 'live');
  assert.equal(announcementStatus(value, new Date(base.getTime() + 2 * H)), 'ended');
  assert.equal(announcementStatus({ ...value, active: false }, base), 'hidden');
});

test('users only see upcoming or live notices, soonest first', () => {
  const mk = (id, startOffsetH, extra = {}) => ({
    _id: id,
    ...validateAnnouncement({
      ...valid,
      startsAt: new Date(base.getTime() + startOffsetH * H).toISOString(),
      endsAt: new Date(base.getTime() + (startOffsetH + 1) * H).toISOString(),
    }).value,
    ...extra,
  });
  const list = visibleAnnouncements(
    [mk('later', 5), mk('soon', 1), mk('off', 1, { active: false }), mk('old', -10), mk('far', 48)],
    base
  );
  assert.deepEqual(list.map((a) => a.id), ['soon', 'later']);
  assert.equal(list[0].status, 'upcoming');
});
