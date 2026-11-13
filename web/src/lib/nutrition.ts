// Shapes mirror the mobile app: `logsByDay` from src/context/AppContext.js
// (GET /api/logs/:userId grouped by dateKey) and the profile's daily targets.

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type FoodEntry = {
  id: string
  name: string
  meal: Meal
  kcal: number
  protein: number
  carbs: number
  fat: number
  time?: string
}

export type LogsByDay = Record<string, FoodEntry[]>

export type Targets = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export type DayTotals = Targets & { entries: number }

export type DaySummary = DayTotals & {
  dateKey: string
  isToday: boolean
  overGoal: boolean
}

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: 'มื้อเช้า',
  lunch: 'มื้อกลางวัน',
  dinner: 'มื้อเย็น',
  snack: 'ของว่าง',
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dayTotals(entries: FoodEntry[] = []): DayTotals {
  return entries.reduce<DayTotals>(
    (sum, e) => ({
      kcal: sum.kcal + (Number(e.kcal) || 0),
      protein: sum.protein + (Number(e.protein) || 0),
      carbs: sum.carbs + (Number(e.carbs) || 0),
      fat: sum.fat + (Number(e.fat) || 0),
      entries: sum.entries + 1,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, entries: 0 },
  )
}

/** The last `days` days ending today, oldest first. */
export function summarizeRange(logs: LogsByDay, goalKcal: number, days: number, today = new Date()): DaySummary[] {
  const todayKey = toDateKey(today)
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - i))
    const dateKey = toDateKey(date)
    const totals = dayTotals(logs[dateKey])
    return {
      ...totals,
      dateKey,
      isToday: dateKey === todayKey,
      overGoal: goalKcal > 0 && totals.kcal > goalKcal,
    }
  })
}

/** Average over logged, completed days only — empty days and today are left out. */
export function averageKcal(summaries: DaySummary[]): number | null {
  const counted = summaries.filter((d) => d.entries > 0 && !d.isToday)
  if (counted.length === 0) return null
  return Math.round(counted.reduce((s, d) => s + d.kcal, 0) / counted.length)
}

const thaiDate = new Intl.DateTimeFormat('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
const thaiShort = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' })
const thaiWeekday = new Intl.DateTimeFormat('th-TH', { weekday: 'short' })

const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const formatLongDate = (key: string) => thaiDate.format(parseKey(key))
export const formatShortDate = (key: string) => thaiShort.format(parseKey(key))
export const formatWeekday = (key: string) => thaiWeekday.format(parseKey(key))
export const formatKcal = (n: number) => Math.round(n).toLocaleString('th-TH')
