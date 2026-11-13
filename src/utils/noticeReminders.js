// When to remind users about an admin notice (e.g. planned maintenance).
// Pure, so it can be tested without the notifications API.

export const NOTICE_LEAD_MINUTES = 30;

const KIND_TITLE = {
  maintenance: 'อีกไม่นานจะปิดปรับปรุงระบบ',
  update: 'อีกไม่นานจะมีการอัปเดตแอป',
  info: 'ประกาศจาก CalTrack',
};

const clock = (date) => {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * One local reminder per notice that hasn't started yet, fired
 * NOTICE_LEAD_MINUTES before it starts (or soon, if that moment has passed).
 * Notices already running or ended get none: the Home card covers them.
 * @returns {{ id: string, date: Date, title: string, body: string }[]}
 */
export function noticeReminderPlan(notices, now = new Date(), leadMinutes = NOTICE_LEAD_MINUTES) {
  return (Array.isArray(notices) ? notices : [])
    .filter((notice) => notice && notice.id && new Date(notice.startsAt) > now)
    .map((notice) => {
      const start = new Date(notice.startsAt);
      const ideal = new Date(start.getTime() - leadMinutes * 60 * 1000);
      // Too late for the 30-minute mark: remind a minute from now instead.
      const date = ideal > now ? ideal : new Date(Math.min(now.getTime() + 60 * 1000, start.getTime()));
      return {
        id: String(notice.id),
        date,
        title: KIND_TITLE[notice.kind] || KIND_TITLE.info,
        body: `${notice.title} · เริ่ม ${clock(start)}–${clock(notice.endsAt)} น.`,
      };
    })
    .filter((plan) => plan.date > now);
}
