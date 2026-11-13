const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApiServer } = require('./helpers/apiServer');

let api;
let adminToken;

before(async () => {
  api = await startApiServer();
  const login = await api.request('POST', '/api/admin/login', {
    body: { email: api.env.ADMIN_EMAIL, password: api.env.ADMIN_PASSWORD },
  });
  adminToken = login.body.token || login.body.adminToken || login.body.user?.adminToken;
});

after(async () => {
  await api?.stop();
});

const H = 60 * 60 * 1000;

test('admin endpoints need an admin token', async () => {
  assert.equal((await api.request('GET', '/api/admin/announcements')).status, 401);
  assert.equal((await api.request('POST', '/api/admin/announcements', { body: {} })).status, 401);
});

test('admin creates, edits and deletes a notice; users see it only inside its window', async () => {
  assert.ok(adminToken, 'admin login returned a token');
  const now = Date.now();
  const created = await api.request('POST', '/api/admin/announcements', {
    token: adminToken,
    body: {
      kind: 'maintenance',
      title: 'ปิดปรับปรุงระบบ',
      message: 'ประมาณ 1 ชั่วโมง',
      startsAt: new Date(now + 2 * H).toISOString(),
      endsAt: new Date(now + 3 * H).toISOString(),
      notifyFrom: new Date(now - H).toISOString(),
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.announcement.status, 'upcoming');
  const id = created.body.announcement.id;

  const visible = await api.request('GET', '/api/announcements');
  assert.equal(visible.status, 200);
  assert.deepEqual(visible.body.announcements.map((a) => a.id), [id]);

  // Move it so users aren't notified yet.
  const edited = await api.request('PUT', `/api/admin/announcements/${id}`, {
    token: adminToken,
    body: {
      kind: 'update',
      title: 'อัปเดตแอป',
      startsAt: new Date(now + 48 * H).toISOString(),
      endsAt: new Date(now + 49 * H).toISOString(),
      notifyFrom: new Date(now + 24 * H).toISOString(),
    },
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.announcement.status, 'scheduled');
  assert.deepEqual((await api.request('GET', '/api/announcements')).body.announcements, []);

  const listed = await api.request('GET', '/api/admin/announcements', { token: adminToken });
  assert.equal(listed.body.announcements.length, 1);

  assert.equal((await api.request('DELETE', `/api/admin/announcements/${id}`, { token: adminToken })).status, 200);
  assert.equal((await api.request('DELETE', `/api/admin/announcements/${id}`, { token: adminToken })).status, 404);
});

test('invalid input is rejected with a message', async () => {
  const res = await api.request('POST', '/api/admin/announcements', {
    token: adminToken,
    body: { title: 'x', startsAt: '2026-11-20T10:00:00Z', endsAt: '2026-11-20T09:00:00Z' },
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /เวลาสิ้นสุด/);
});
