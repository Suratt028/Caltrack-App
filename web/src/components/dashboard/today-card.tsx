import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatKcal, type DayTotals, type Targets } from '@/lib/nutrition'

type Props = { totals: DayTotals; targets: Targets | null }

/** "Remaining kcal" is the hero number (it helps decide the next meal). */
export function TodayCard({ totals, targets }: Props) {
  if (!targets) {
    return (
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">วันนี้</CardTitle>
          <CardDescription>ตั้งเป้าหมายเพื่อดูพลังงานที่เหลือ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-4xl font-bold tabular-nums">
            {formatKcal(totals.kcal)} <span className="text-base font-medium text-muted-foreground">kcal</span>
          </p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {([['โปรตีน', totals.protein, 'bg-protein'], ['คาร์บ', totals.carbs, 'bg-carbs'], ['ไขมัน', totals.fat, 'bg-fat']] as const).map(([label, grams, dot]) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={cn('size-2 rounded-full', dot)} aria-hidden />
                  {label}
                </div>
                <p className="font-medium tabular-nums">{Math.round(grams)} ก.</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const remaining = targets.kcal - totals.kcal
  const over = remaining < 0

  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">วันนี้</CardTitle>
        <CardDescription>
          กินแล้ว {formatKcal(totals.kcal)} · เป้า {formatKcal(targets.kcal)} kcal
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col">
        <CalorieRing value={totals.kcal} goal={targets.kcal} />
        <div className="w-full flex-1 space-y-4">
          <MacroRow label="โปรตีน" value={totals.protein} goal={targets.protein} indicator="bg-protein" />
          <MacroRow label="คาร์บ" value={totals.carbs} goal={targets.carbs} indicator="bg-carbs" />
          <MacroRow label="ไขมัน" value={totals.fat} goal={targets.fat} indicator="bg-fat" />
        </div>
      </CardContent>
      <p className="sr-only" aria-live="polite">
        {over
          ? `เกินเป้าหมาย ${formatKcal(-remaining)} กิโลแคลอรี่`
          : `เหลือ ${formatKcal(remaining)} กิโลแคลอรี่ จากเป้าหมาย ${formatKcal(targets.kcal)}`}
      </p>
    </Card>
  )
}

function CalorieRing({ value, goal }: { value: number; goal: number }) {
  const size = 168
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0
  const over = value > goal
  const remaining = Math.abs(goal - value)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? 'var(--over)' : 'var(--primary)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-muted-foreground">{over ? 'เกินเป้าหมาย' : 'เหลือ'}</span>
        <span className={cn('text-4xl font-bold tabular-nums leading-tight', over && 'text-over-foreground')}>
          {formatKcal(remaining)}
        </span>
        <span className="text-xs text-muted-foreground">kcal</span>
      </div>
    </div>
  )
}

function MacroRow({ label, value, goal, indicator }: { label: string; value: number; goal: number; indicator: string }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          <span className="text-foreground">{Math.round(value)}</span> / {goal} ก.
        </span>
      </div>
      <Progress
        value={pct}
        className="h-2"
        indicatorClassName={indicator}
        aria-label={`${label} ${Math.round(value)} จาก ${goal} กรัม`}
      />
    </div>
  )
}
