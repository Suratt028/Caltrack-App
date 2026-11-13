import { toDateKey, type FoodEntry, type LogsByDay, type Meal, type Targets } from './nutrition'

// Deterministic demo data (same every load) until this page is wired to the API.
// Values are rough per-serving figures for common Thai dishes.
const MENU: Record<Meal, Omit<FoodEntry, 'id' | 'meal'>[]> = {
  breakfast: [
    { name: 'ข้าวต้มหมู', kcal: 320, protein: 16, carbs: 45, fat: 8 },
    { name: 'โจ๊กหมูใส่ไข่', kcal: 350, protein: 18, carbs: 44, fat: 11 },
    { name: 'ปาท่องโก๋ + น้ำเต้าหู้', kcal: 410, protein: 12, carbs: 52, fat: 17 },
    { name: 'ข้าวเหนียวหมูปิ้ง', kcal: 480, protein: 20, carbs: 62, fat: 16 },
  ],
  lunch: [
    { name: 'ข้าวกะเพราไก่ไข่ดาว', kcal: 640, protein: 32, carbs: 70, fat: 25 },
    { name: 'ข้าวมันไก่', kcal: 590, protein: 28, carbs: 68, fat: 22 },
    { name: 'ผัดไทยกุ้งสด', kcal: 620, protein: 24, carbs: 80, fat: 22 },
    { name: 'ก๋วยเตี๋ยวเรือ', kcal: 380, protein: 20, carbs: 48, fat: 11 },
  ],
  dinner: [
    { name: 'ส้มตำไทย + ไก่ย่าง', kcal: 520, protein: 38, carbs: 40, fat: 22 },
    { name: 'ข้าวผัดหมู', kcal: 560, protein: 22, carbs: 74, fat: 19 },
    { name: 'ต้มยำกุ้ง + ข้าวสวย', kcal: 470, protein: 28, carbs: 60, fat: 12 },
    { name: 'ข้าวขาหมู', kcal: 690, protein: 30, carbs: 72, fat: 31 },
  ],
  snack: [
    { name: 'ชาไทยเย็น', kcal: 260, protein: 3, carbs: 42, fat: 9 },
    { name: 'กล้วยหอม 1 ลูก', kcal: 105, protein: 1, carbs: 27, fat: 0 },
    { name: 'โยเกิร์ตรสธรรมชาติ', kcal: 130, protein: 9, carbs: 12, fat: 5 },
  ],
}

// Small seeded PRNG so the chart looks the same on every reload.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEMO_TARGETS: Targets = { kcal: 1650, protein: 90, carbs: 190, fat: 55 }
export const DEMO_USER = { name: 'มิ้น', email: 'demo@caltrack.app' }

export function buildDemoLogs(days = 30, today = new Date()): LogsByDay {
  const rand = mulberry32(20261113)
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const logs: LogsByDay = {}

  for (let back = days - 1; back >= 0; back -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - back)
    const key = toDateKey(date)
    // A couple of days with nothing logged, like real usage.
    if (back > 0 && rand() < 0.08) continue

    // Today is still in progress: breakfast + lunch only.
    const meals: Meal[] = back === 0
      ? ['breakfast', 'lunch']
      : ['breakfast', 'lunch', 'dinner', ...(rand() < 0.55 ? (['snack'] as Meal[]) : [])]

    logs[key] = meals.map((meal, i) => ({ id: `${key}-${i}`, meal, ...pick(MENU[meal]) }))
  }
  return logs
}
