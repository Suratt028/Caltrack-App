// Rough 4-week weight projection, two ways:
//  A) log every day and eat at the calorie goal
//  B) keep the pattern of the last 14 days (logged days at their real average,
//     unlogged days assumed to be at maintenance = TDEE, since we can't know)
// Uses ~7,700 kcal per kg and shows a range, because this is an estimate.

export const KCAL_PER_KG = 7700;
export const WINDOW_DAYS = 14;
export const HORIZON_DAYS = 28;
const MIN_LOGGED_DAYS = 3;

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const range = (change) => {
  // ±25% (at least ±0.3 kg) around the central estimate.
  const spread = Math.max(Math.abs(change) * 0.25, 0.3);
  return { change, low: change - spread, high: change + spread };
};

/**
 * @param {{ logsByDay: Record<string, {kcal?: number}[]>, tdee: number, goalKcal: number, weightKg: number, today?: Date }} input
 * @returns {null | {
 *   days: { dateKey: string, logged: boolean }[], loggedDays: number,
 *   avgLoggedKcal: number, enough: boolean,
 *   everyDay: { change: number, low: number, high: number, weight: number },
 *   asBefore: { change: number, low: number, high: number, weight: number } | null,
 * }}
 */
export function weightOutlook({ logsByDay, tdee, goalKcal, weightKg, today = new Date() }) {
  const t = Number(tdee);
  const goal = Number(goalKcal);
  const weight = Number(weightKg);
  if (!(t > 0) || !(goal > 0) || !(weight > 0)) return null;

  // The 14 completed days before today (today is still in progress).
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (WINDOW_DAYS - i));
    const dateKey = keyOf(d);
    const kcal = (logsByDay?.[dateKey] || []).reduce((sum, e) => sum + (Number(e?.kcal) || 0), 0);
    return { dateKey, logged: kcal > 0, kcal };
  });
  const logged = days.filter((d) => d.logged);
  const avgLoggedKcal = logged.length ? logged.reduce((s, d) => s + d.kcal, 0) / logged.length : 0;
  const enough = logged.length >= MIN_LOGGED_DAYS;

  const everyDayChange = ((goal - t) * HORIZON_DAYS) / KCAL_PER_KG;
  const share = logged.length / WINDOW_DAYS;
  const asBeforeIntake = share * avgLoggedKcal + (1 - share) * t;
  const asBeforeChange = ((asBeforeIntake - t) * HORIZON_DAYS) / KCAL_PER_KG;

  return {
    days: days.map(({ dateKey, logged: isLogged }) => ({ dateKey, logged: isLogged })),
    loggedDays: logged.length,
    avgLoggedKcal: Math.round(avgLoggedKcal),
    enough,
    everyDay: { ...range(everyDayChange), weight: weight + everyDayChange },
    asBefore: enough ? { ...range(asBeforeChange), weight: weight + asBeforeChange } : null,
  };
}
