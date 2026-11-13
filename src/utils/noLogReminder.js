// Which evenings should get a "no food logged yet" reminder. Pure, so it can be
// tested without the notifications API.

export const REMINDER_HOUR = 20;
export const REMINDER_DAYS_AHEAD = 7;

const pad = (n) => String(n).padStart(2, '0');
export const dateKeyOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Reminder times for the next `daysAhead` days at `hour`:00, skipping days
 * that already have a food log and times already in the past.
 * Future days are always included; logging that day removes it on the next
 * reschedule, and if the app isn't opened the reminders simply stop after a week.
 * @param {Record<string, unknown[]>} logsByDay
 * @param {Date} now
 * @returns {Date[]}
 */
export function reminderTimes(logsByDay, now = new Date(), { hour = REMINDER_HOUR, daysAhead = REMINDER_DAYS_AHEAD } = {}) {
  const times = [];
  for (let offset = 0; offset < daysAhead; offset += 1) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, 0, 0, 0);
    if (at <= now) continue;
    const logged = (logsByDay?.[dateKeyOf(at)] || []).length > 0;
    if (!logged) times.push(at);
  }
  return times;
}

export const REMINDER_COPY = {
  title: 'วันนี้ยังไม่ได้บันทึกอาหาร',
  body: 'ถ่ายรูปหรือค้นหามื้อที่ทานไว้ ใช้เวลาไม่ถึงนาที บันทึกย้อนหลังได้เสมอ',
};
