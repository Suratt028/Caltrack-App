import type { LucideIcon } from 'lucide-react'
import { Flame, Scale, Target, Utensils } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatKcal } from '@/lib/nutrition'

type Props = {
  eatenToday: number
  /** 0 when the user hasn't set a goal yet. */
  goalKcal: number
  avg7: number | null
  streakWithinGoal: number | null
  weightKg: number | null
  weightChangeKg: number | null
}

const kg = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 1 })

export function StatCards({ eatenToday, goalKcal, avg7, streakWithinGoal, weightKg, weightChangeKg }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard
        icon={Utensils}
        label="กินแล้ววันนี้"
        value={formatKcal(eatenToday)}
        unit="kcal"
        note={goalKcal ? `จากเป้า ${formatKcal(goalKcal)}` : 'ยังไม่ได้ตั้งเป้า'}
      />
      <StatCard icon={Flame} label="เฉลี่ย 7 วัน" value={avg7 != null ? formatKcal(avg7) : '—'} unit="kcal" note="ไม่นับวันที่ไม่มีบันทึก" />
      <StatCard
        icon={Target}
        label="อยู่ในเป้า (7 วัน)"
        value={streakWithinGoal != null ? String(streakWithinGoal) : '—'}
        unit="วัน"
        note={streakWithinGoal != null ? 'ไม่นับวันนี้และวันที่ไม่มีบันทึก' : 'ตั้งเป้าหมายในแอปก่อน'}
      />
      <StatCard
        icon={Scale}
        label="น้ำหนักล่าสุด"
        value={weightKg != null ? kg(weightKg) : '—'}
        unit="กก."
        badge={weightChangeKg != null ? `${weightChangeKg > 0 ? '+' : ''}${kg(weightChangeKg)} กก. / 30 วัน` : undefined}
        note={weightKg == null ? 'ยังไม่มีบันทึกน้ำหนัก' : 'บันทึกน้ำหนักในแอปเพื่อดูแนวโน้ม'}
      />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, unit, note, badge }: {
  icon: LucideIcon
  label: string
  value: string
  unit: string
  note?: string
  badge?: string
}) {
  return (
    <Card size="sm" className="gap-2">
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="text-xs font-medium sm:text-sm">{label}</span>
          <Icon className="size-4 shrink-0" aria-hidden />
        </div>
        <p className="text-2xl font-bold tabular-nums leading-none sm:text-3xl">
          {value} <span className="text-sm font-medium text-muted-foreground">{unit}</span>
        </p>
        {badge ? (
          <Badge variant="secondary" className="font-normal tabular-nums">{badge}</Badge>
        ) : (
          note && <p className="text-xs text-muted-foreground">{note}</p>
        )}
      </CardContent>
    </Card>
  )
}
