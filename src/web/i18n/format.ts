/**
 * Number and Thai date formatting helpers.
 * Numbers use tabular-friendly comma grouping; dates use the Thai Buddhist era.
 */

const numberFormatter = new Intl.NumberFormat('th-TH')

/** `1000` → "1,000". Safe for NaN (returns "0"). */
export function n(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return numberFormatter.format(value)
}

/** Rounds and groups, e.g. `1660` → "1,660". */
export function nf(value: number): string {
  return n(Math.round(value))
}

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const THAI_MONTHS_LONG = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

const THAI_DAYS_LONG = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์',
]

interface DateParts {
  day: number
  month: number
  year: number
  weekday: number
}

function parse(iso: string): DateParts {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
  return {
    day: d ?? 1,
    month: (m ?? 1) - 1,
    year: y ?? 2026,
    weekday: date.getUTCDay(),
  }
}

/** "2026-10-17" → "17 ต.ค. 2569" */
export function formatThaiShortDate(iso: string): string {
  const { day, month, year } = parse(iso)
  return `${day} ${THAI_MONTHS_SHORT[month]} ${year + 543}`
}

/** "2026-10-11" → "11 ตุลาคม" */
export function formatThaiDayMonth(iso: string): string {
  const { day, month } = parse(iso)
  return `${day} ${THAI_MONTHS_LONG[month]}`
}

/** "2026-10-17" → "เสาร์ 17 ตุลาคม 2569" */
export function formatThaiLongDate(iso: string): string {
  const { day, month, year, weekday } = parse(iso)
  return `วัน${THAI_DAYS_LONG[weekday]} ${day} ${THAI_MONTHS_LONG[month]} ${year + 543}`
}

/** Bare day number for chart axes: "2026-10-11" → "11". */
export function dayNumber(iso: string): string {
  return String(parse(iso).day)
}

/**
 * Chart/stat range labels:
 *   same month      → "11–17 ตุลาคม 2569"
 *   cross-month     → "29 ก.ย. – 17 ต.ค. 2569"
 *   cross-year      → "29 ธ.ค. 2568 – 17 ต.ค. 2569"
 */
export function formatThaiDateRange(startIso: string, endIso: string): string {
  const start = parse(startIso)
  const end = parse(endIso)
  if (start.year === end.year && start.month === end.month) {
    return `${start.day}–${end.day} ${THAI_MONTHS_LONG[end.month]} ${end.year + 543}`
  }
  return `${formatThaiShortDate(startIso)} – ${formatThaiShortDate(endIso)}`
}

export { THAI_MONTHS_LONG, THAI_MONTHS_SHORT }
