import { useCallback, useEffect, useMemo, useState } from 'react'
import { Camera, CircleAlert, RotateCw } from 'lucide-react'
import { AppShell } from '@/components/dashboard/app-shell'
import { CalorieChart } from '@/components/dashboard/calorie-chart'
import { MealsCard } from '@/components/dashboard/meals-card'
import { SignIn } from '@/components/dashboard/sign-in'
import { StatCards } from '@/components/dashboard/stat-cards'
import { TodayCard } from '@/components/dashboard/today-card'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ApiError, loadDashboard, type DashboardData, type SessionUser } from '@/lib/api'
import { DEMO_TARGETS, DEMO_USER, buildDemoLogs } from '@/lib/demo-data'
import { averageKcal, dayTotals, formatLongDate, summarizeRange, toDateKey } from '@/lib/nutrition'
import { readSession, writeSession } from '@/lib/session'

const THEME_KEY = 'caltrack-theme'

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved) return saved === 'dark'
    } catch {
      // Storage blocked: fall back to the system setting.
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      // Not persisted; the toggle still works for this visit.
    }
  }, [dark])
  return [dark, () => setDark((d) => !d)] as const
}

function greeting(hour: number) {
  if (hour < 11) return 'อรุณสวัสดิ์'
  if (hour < 17) return 'สวัสดีตอนบ่าย'
  return 'สวัสดีตอนเย็น'
}

type Mode = { kind: 'signed-out'; notice?: string } | { kind: 'demo' } | { kind: 'user'; user: SessionUser }

function demoData(): DashboardData {
  const today = new Date()
  const monthAgo = new Date(today)
  monthAgo.setDate(today.getDate() - 30)
  return {
    logs: buildDemoLogs(),
    targets: DEMO_TARGETS,
    weights: [
      { dateKey: toDateKey(monthAgo), weightKg: 63.6 },
      { dateKey: toDateKey(today), weightKg: 62.4 },
    ],
    profileWeightKg: 62.4,
  }
}

export default function App() {
  const [dark, toggleDark] = useDarkMode()
  const [mode, setMode] = useState<Mode>(() => {
    const user = readSession()
    return user ? { kind: 'user', user } : { kind: 'signed-out' }
  })
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const signOut = useCallback((notice?: string) => {
    writeSession(null)
    setData(null)
    setError('')
    setMode({ kind: 'signed-out', notice })
  }, [])

  useEffect(() => {
    if (mode.kind === 'signed-out') return undefined
    let cancelled = false
    setError('')
    if (mode.kind === 'demo') {
      setData(demoData())
      return undefined
    }
    loadDashboard(mode.user)
      .then((next) => {
        if (!cancelled) setData(next)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        if (e instanceof ApiError && e.status === 401) signOut('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
        else setError((e as Error).message || 'โหลดข้อมูลไม่สำเร็จ')
      })
    return () => {
      cancelled = true
    }
  }, [mode, attempt, signOut])

  const todayKey = toDateKey(new Date())
  const view = useMemo(() => {
    if (!data) return null
    const goal = data.targets?.kcal ?? 0
    const week = summarizeRange(data.logs, goal, 7)
    const latest = data.weights.at(-1)
    const monthAgoKey = (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return toDateKey(d)
    })()
    // Oldest weigh-in within the last 30 days, to show the change since then.
    const baseline = data.weights.find((w) => w.dateKey >= monthAgoKey)
    return {
      todayEntries: data.logs[todayKey] ?? [],
      totals: dayTotals(data.logs[todayKey]),
      avg7: averageKcal(week),
      withinGoal7: goal ? week.filter((d) => d.entries > 0 && !d.isToday && !d.overGoal).length : null,
      weightKg: latest ? Number(latest.weightKg) : data.profileWeightKg,
      weightChangeKg: latest && baseline && baseline !== latest ? Number(latest.weightKg) - Number(baseline.weightKg) : null,
    }
  }, [data, todayKey])

  if (mode.kind === 'signed-out') {
    return (
      <TooltipProvider>
        <SignIn
          notice={mode.notice}
          onSignedIn={(user) => {
            writeSession(user)
            setData(null)
            setMode({ kind: 'user', user })
          }}
          onDemo={() => setMode({ kind: 'demo' })}
        />
      </TooltipProvider>
    )
  }

  const isDemo = mode.kind === 'demo'
  const name = isDemo ? DEMO_USER.name : mode.user.displayName

  return (
    <TooltipProvider>
      <AppShell
        userName={name}
        userDetail={isDemo ? 'ข้อมูลจำลอง' : mode.user.email}
        dark={dark}
        onToggleDark={toggleDark}
        onSignOut={() => signOut()}
        signOutLabel={isDemo ? 'กลับไปหน้าเข้าสู่ระบบ' : 'ออกจากระบบ'}
      >
        <div className="flex flex-col gap-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{formatLongDate(todayKey)}</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {greeting(new Date().getHours())}, {name}
              </h1>
            </div>
            {!isDemo && data && (
              <Button variant="outline" className="min-h-11 gap-2" onClick={() => setAttempt((n) => n + 1)}>
                <RotateCw className="size-4" aria-hidden />
                รีเฟรช
              </Button>
            )}
            {isDemo && (
              <Button size="lg" className="hidden min-h-11 gap-2 px-5 sm:inline-flex">
                <Camera className="size-4" aria-hidden />
                สแกนอาหาร
              </Button>
            )}
          </header>

          {error ? (
            <Alert variant="destructive">
              <CircleAlert aria-hidden />
              <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <AlertAction>
                <Button size="sm" variant="outline" onClick={() => setAttempt((n) => n + 1)}>
                  ลองใหม่
                </Button>
              </AlertAction>
            </Alert>
          ) : !view || !data ? (
            <DashboardSkeleton />
          ) : (
            <>
              {!data.targets && (
                <Alert>
                  <CircleAlert aria-hidden />
                  <AlertTitle>ยังไม่ได้ตั้งเป้าหมาย</AlertTitle>
                  <AlertDescription>
                    กรอกข้อมูลส่วนตัวในแอป CalTrack บนมือถือ แล้วกดรีเฟรช เพื่อดูพลังงานที่เหลือและเทียบกับเป้าหมาย
                  </AlertDescription>
                </Alert>
              )}
              <StatCards
                eatenToday={view.totals.kcal}
                goalKcal={data.targets?.kcal ?? 0}
                avg7={view.avg7}
                streakWithinGoal={view.withinGoal7}
                weightKg={view.weightKg}
                weightChangeKg={view.weightChangeKg}
              />
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <CalorieChart logs={data.logs} goalKcal={data.targets?.kcal ?? 0} />
                <div className="flex flex-col gap-6">
                  <TodayCard totals={view.totals} targets={data.targets} />
                  <MealsCard entries={view.todayEntries} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {isDemo ? 'ข้อมูลตัวอย่าง · ' : ''}ตัวเลขเป็นค่าประมาณ ไม่ใช่คำแนะนำทางการแพทย์ · ข้อมูลโภชนาการ: INMU มหาวิทยาลัยมหิดล
              </p>
            </>
          )}
        </div>
      </AppShell>
    </TooltipProvider>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="กำลังโหลดข้อมูล">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[440px] rounded-xl" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
