// Scheduled notices from the admin console ("แจ้งปัญหาล่วงหน้า"): e.g. planned
// maintenance or an app update at a set date/time. Users start seeing a notice
// at `notifyFrom` (before it starts) and stop after `endsAt`.

const KINDS = ['maintenance', 'update', 'info'];
const TITLE_MAX = 80;
const MESSAGE_MAX = 500;
const MAX_NOTICE_LEAD_MS = 30 * 24 * 60 * 60 * 1000; // show at most 30 days ahead
const MAX_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const toDate = (value) => {
  if (value instanceof Date) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Validates admin input. Returns { value } with clean fields, or { error } (Thai message).
 * `notifyFrom` defaults to 24 hours before `startsAt`.
 */
function validateAnnouncement(body = {}) {
  const kind = String(body.kind || 'info');
  if (!KINDS.includes(kind)) return { error: 'ประเภทต้องเป็น maintenance, update หรือ info' };

  const title = String(body.title || '').trim();
  if (!title) return { error: 'กรุณาใส่หัวข้อประกาศ' };
  if (title.length > TITLE_MAX) return { error: `หัวข้อยาวได้ไม่เกิน ${TITLE_MAX} ตัวอักษร` };

  const message = String(body.message || '').trim();
  if (message.length > MESSAGE_MAX) return { error: `รายละเอียดยาวได้ไม่เกิน ${MESSAGE_MAX} ตัวอักษร` };

  const startsAt = toDate(body.startsAt);
  const endsAt = toDate(body.endsAt);
  if (!startsAt || !endsAt) return { error: 'กรุณาระบุวันเวลาเริ่มและสิ้นสุดให้ถูกต้อง' };
  if (endsAt <= startsAt) return { error: 'เวลาสิ้นสุดต้องหลังเวลาเริ่ม' };
  if (endsAt - startsAt > MAX_DURATION_MS) return { error: 'ช่วงเวลาประกาศยาวได้ไม่เกิน 30 วัน' };

  const notifyFrom = body.notifyFrom == null || body.notifyFrom === ''
    ? new Date(startsAt.getTime() - 24 * 60 * 60 * 1000)
    : toDate(body.notifyFrom);
  if (!notifyFrom) return { error: 'เวลาเริ่มแจ้งล่วงหน้าไม่ถูกต้อง' };
  if (notifyFrom > startsAt) return { error: 'ต้องเริ่มแจ้งก่อนหรือพร้อมเวลาเริ่ม' };
  if (startsAt - notifyFrom > MAX_NOTICE_LEAD_MS) return { error: 'แจ้งล่วงหน้าได้ไม่เกิน 30 วัน' };

  return {
    value: {
      kind,
      title,
      message,
      startsAt,
      endsAt,
      notifyFrom,
      active: body.active !== false,
    },
  };
}

/** Where a notice stands at `now`: hidden | scheduled | upcoming (being shown) | live | ended. */
function announcementStatus(item, now = new Date()) {
  if (!item.active) return 'hidden';
  if (now > item.endsAt) return 'ended';
  if (now >= item.startsAt) return 'live';
  if (now >= item.notifyFrom) return 'upcoming';
  return 'scheduled';
}

/** Public view: only active notices users should see now, soonest first. */
function visibleAnnouncements(items, now = new Date()) {
  return items
    .filter((item) => ['upcoming', 'live'].includes(announcementStatus(item, now)))
    .sort((a, b) => a.startsAt - b.startsAt)
    .map((item) => ({
      id: String(item._id),
      kind: item.kind,
      title: item.title,
      message: item.message,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      status: announcementStatus(item, now),
      updatedAt: item.updatedAt || item.createdAt || null,
    }));
}

module.exports = { KINDS, validateAnnouncement, announcementStatus, visibleAnnouncements };
