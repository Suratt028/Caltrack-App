/** Local-date helpers — no UTC off-by-one for Thailand (UTC+7). */

function isoOf(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today in local time as `YYYY-MM-DD`. */
export function todayIso(): string {
  return isoOf(new Date())
}

/** `daysBack(0)` is today, `daysBack(1)` is yesterday, … */
export function daysBack(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return isoOf(date)
}

/** Current wall-clock time as `HH:MM`, used as a log entry's display time. */
export function nowTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
