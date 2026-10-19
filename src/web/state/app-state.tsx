import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AiEstimate,
  DayNutrition,
  FoodLogEntry,
  NutritionGoal,
  UserProfile,
} from '../types'
import { profileRepository, type ScanImage } from '../data/repositories'
import { useAuth } from '../auth/auth-context'
import { api, ApiError } from '../lib/api'
import { daysBack, nowTime, todayIso } from '../lib/date'
import { sumNutrition } from '../lib/nutrition'

/** One saved row of the backend `logs` collection. */
interface ServerLog {
  _id: string
  dateKey: string
  entry: FoodLogEntry
}

interface ServerWeight {
  dateKey: string
  weightKg: number
}

const WEEK_DAYS = 7
const EMPTY_PROFILE: UserProfile = { name: 'ผู้ใช้ CalTrack', goal: null }

interface AppStateValue {
  /** True while the first profile/logs fetch is in flight. */
  loading: boolean
  /** Non-null when the initial load failed — screens can show a retry. */
  loadError: string | null
  profile: UserProfile
  /** Today's log entries (newest first). */
  entries: FoodLogEntry[]
  /** Day history for trends: the last 7 days, oldest first. */
  week: DayNutrition[]
  /** All dates with saved food logs; missing dates are not represented as zero. */
  history: DayNutrition[]
  /** Weight history shared with the mobile app, keyed by local date. */
  weightsByDay: Record<string, number>
  /** foodIds logged today — powers the "recent" badge in search results. */
  recentIds: string[]
  aiEstimate: AiEstimate | null
  setAiEstimate: (estimate: AiEstimate | null) => void
  scanImage: ScanImage | null
  setScanImage: (image: ScanImage | null) => void
  /** Saves a log entry through the API; resolves once state is updated. */
  addEntry: (entry: FoodLogEntry) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  /** Persists name + daily goal and updates the profile in state. */
  saveProfile: (next: { name: string; goal: NutritionGoal | null }) => Promise<void>
  saveWeight: (weightKg: number) => Promise<void>
  reload: () => Promise<void>
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({
  children,
  initialScanImage = null,
  initialEstimate = null,
}: {
  children: ReactNode
  /** Pre-set photo without going through the capture screen (tests/stories). */
  initialScanImage?: ScanImage | null
  /** Pre-set AI estimate without calling the server (tests/stories). */
  initialEstimate?: AiEstimate | null
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE)
  const [logs, setLogs] = useState<ServerLog[]>([])
  const [weights, setWeights] = useState<ServerWeight[]>([])
  const [aiEstimate, setAiEstimate] = useState<AiEstimate | null>(initialEstimate)
  const [scanImage, setScanImage] = useState<ScanImage | null>(initialScanImage)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setLoadError(null)
    try {
      const [nextProfile, logsPayload, weightsPayload] = await Promise.all([
        profileRepository.getUser(user.displayName),
        api.get<{ logs?: ServerLog[] }>(`/logs/${user.id}`),
        api.get<{ weights?: ServerWeight[] }>(`/weights/${user.id}`),
      ])
      setProfile(nextProfile)
      setLogs(Array.isArray(logsPayload.logs) ? logsPayload.logs : [])
      setWeights(Array.isArray(weightsPayload.weights) ? weightsPayload.weights : [])
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  const entries = useMemo(() => {
    const today = todayIso()
    // The API returns logs newest-first, so `entries[0]` is the latest entry.
    return logs
      .filter((log) => log.dateKey === today)
      .map((log) => ({ ...log.entry, id: log._id }))
  }, [logs])

  const recentIds = useMemo(
    () =>
      entries
        .map((entry) => entry.foodId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    [entries],
  )

  const weightsByDay = useMemo(
    () => Object.fromEntries(weights.map(({ dateKey, weightKg }) => [dateKey, Number(weightKg)])),
    [weights],
  )

  const history = useMemo<DayNutrition[]>(() => {
    const today = todayIso()
    const byDate = new Map<string, FoodLogEntry[]>()
    for (const log of logs) {
      const entriesForDate = byDate.get(log.dateKey) ?? []
      entriesForDate.push(log.entry)
      byDate.set(log.dateKey, entriesForDate)
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, entriesForDate]) => {
        const totals = sumNutrition(entriesForDate)
        return { date, kcal: totals.kcal, macros: totals.macros, isComplete: date !== today }
      })
  }, [logs])

  const week = useMemo(() => {
    const start = daysBack(WEEK_DAYS - 1)
    const today = todayIso()
    return history.filter((day) => day.date >= start && day.date <= today)
  }, [history])

  const addEntry = useCallback(
    async (entry: FoodLogEntry) => {
      if (!user) throw new ApiError('ยังไม่ได้เข้าสู่ระบบ', 401)
      const date = todayIso()
      const body: FoodLogEntry = { ...entry, date, time: entry.time || nowTime() }
      const { log } = await api.post<{ log?: ServerLog }>(`/logs/${user.id}`, {
        dateKey: date,
        entry: body,
      })
      if (log?._id) {
        setLogs((prev) => [
          { _id: log._id, dateKey: log.dateKey || date, entry: log.entry || body },
          ...prev,
        ])
      }
    },
    [user],
  )

  const removeEntry = useCallback(
    async (id: string) => {
      if (!user) throw new ApiError('ยังไม่ได้เข้าสู่ระบบ', 401)
      await api.del(`/logs/${user.id}/${encodeURIComponent(id)}`)
      setLogs((prev) => prev.filter((log) => log._id !== id))
    },
    [user],
  )

  const saveProfile = useCallback(
    async (next: { name: string; goal: NutritionGoal | null }) => {
      setProfile(await profileRepository.saveProfile(next))
    },
    [],
  )

  const saveWeight = useCallback(
    async (weightKg: number) => {
      if (!user) throw new ApiError('ยังไม่ได้เข้าสู่ระบบ', 401)
      const dateKey = todayIso()
      const { weight } = await api.put<{ weight: ServerWeight }>(
        `/weights/${user.id}/${dateKey}`,
        { weightKg },
      )
      setWeights((previous) => [
        ...previous.filter((item) => item.dateKey !== dateKey),
        weight,
      ].sort((a, b) => a.dateKey.localeCompare(b.dateKey)))
    },
    [user],
  )

  const value = useMemo<AppStateValue>(
    () => ({
      loading,
      loadError,
      profile,
      entries,
      week,
      history,
      weightsByDay,
      recentIds,
      aiEstimate,
      setAiEstimate,
      scanImage,
      setScanImage,
      addEntry,
      removeEntry,
      saveProfile,
      saveWeight,
      reload,
    }),
    [
      loading,
      loadError,
      profile,
      entries,
      week,
      history,
      weightsByDay,
      recentIds,
      aiEstimate,
      scanImage,
      addEntry,
      removeEntry,
      saveProfile,
      saveWeight,
      reload,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('useAppState must be used within AppStateProvider')
  return value
}
