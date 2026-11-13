import { buildProfileGoals } from '@shared/calculations.js'
import { toDateKey, type FoodEntry, type LogsByDay, type Meal, type Targets } from './nutrition'

// Same backend as the mobile app (server.js). Override with VITE_API_BASE_URL.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
  || 'http://localhost:3001/api'

const TIMEOUT_MS = 10000

export type SessionUser = {
  id: string
  email: string
  displayName: string
  token: string
}

export class ApiError extends Error {
  status: number | null
  constructor(message: string, status: number | null) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, { token, method = 'GET', body }: { token?: string; method?: string; body?: unknown } = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    const timedOut = (error as Error)?.name === 'AbortError'
    throw new ApiError(
      timedOut ? 'เซิร์ฟเวอร์ตอบช้าเกินไป กรุณาลองใหม่' : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่าเปิด Backend อยู่',
      null,
    )
  } finally {
    clearTimeout(timer)
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(friendlyError(response.status, payload?.error, Boolean(token)), response.status)
  }
  return payload as T
}

function friendlyError(status: number, message: unknown, signedIn: boolean): string {
  const text = typeof message === 'string' ? message : ''
  if (status === 401) return signedIn ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' : 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  if (status === 429) return text || 'พยายามบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'
  if (status === 503 && text.includes('database')) return 'ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่ภายหลัง'
  if (status >= 500) return 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง'
  return text || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
}

type LoginResponse = { user: { id: string; email: string; displayName?: string; role?: string; token?: string } }

export async function login(email: string, password: string): Promise<SessionUser> {
  const { user } = await request<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } })
  if (!user?.token) {
    // The .env admin without a user record has no user token, so it has no logs to show.
    throw new ApiError('บัญชีนี้ไม่มีข้อมูลการกิน กรุณาใช้บัญชีผู้ใช้ทั่วไป', 403)
  }
  return { id: user.id, email: user.email, displayName: user.displayName || user.email.split('@')[0], token: user.token }
}

type RawLog = { _id: string; dateKey: string; entry?: Partial<FoodEntry> & { mealType?: string } }
type RawProfile = Record<string, unknown> & { weightKg?: number; displayName?: string; name?: string }
type RawWeight = { dateKey: string; weightKg: number }

export type DashboardData = {
  logs: LogsByDay
  targets: Targets | null
  weights: RawWeight[]
  profileWeightKg: number | null
}

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

/** API logs [{ _id, dateKey, entry }] -> { [dateKey]: FoodEntry[] } (same as the mobile app). */
export function groupLogs(raw: RawLog[]): LogsByDay {
  const grouped: LogsByDay = {}
  // The API returns newest first; keep each day in the order it was logged.
  for (const log of [...raw].reverse()) {
    const entry = log.entry ?? {}
    const meal = (MEALS as string[]).includes(String(entry.meal ?? entry.mealType)) ? (entry.meal ?? entry.mealType) as Meal : 'snack'
    ;(grouped[log.dateKey] ??= []).push({
      id: String(log._id),
      name: String(entry.name || 'ไม่มีชื่อ'),
      meal,
      kcal: Number(entry.kcal) || 0,
      protein: Number(entry.protein) || 0,
      carbs: Number(entry.carbs) || 0,
      fat: Number(entry.fat) || 0,
      time: entry.time,
    })
  }
  return grouped
}

/** Daily targets from body data, exactly like the app; null until onboarding is done. */
export function targetsFromProfile(profile: RawProfile | null): Targets | null {
  if (!profile) return null
  const complete = ['male', 'female'].includes(String(profile.gender))
    && Number(profile.age) > 0 && Number(profile.heightCm) > 0 && Number(profile.weightKg) > 0
    && typeof profile.activityLevel === 'string' && typeof profile.goal === 'string'
  if (!complete) return null
  const { calorieGoal, macroGoals } = buildProfileGoals(profile)
  return { kcal: calorieGoal, ...macroGoals }
}

export async function loadDashboard(user: SessionUser, days = 30): Promise<DashboardData> {
  const today = new Date()
  const from = new Date(today)
  from.setDate(today.getDate() - (days - 1))
  const id = encodeURIComponent(user.id)
  const [logs, profile, weights] = await Promise.all([
    request<{ logs: RawLog[] }>(`/logs/${id}?from=${toDateKey(from)}&to=${toDateKey(today)}`, { token: user.token }),
    request<{ profile: RawProfile | null }>(`/profiles/${id}`, { token: user.token }),
    request<{ weights: RawWeight[] }>(`/weights/${id}`, { token: user.token }),
  ])
  return {
    logs: groupLogs(logs.logs ?? []),
    targets: targetsFromProfile(profile.profile),
    weights: (weights.weights ?? []).filter((w) => Number.isFinite(Number(w.weightKg))),
    profileWeightKg: Number(profile.profile?.weightKg) || null,
  }
}
