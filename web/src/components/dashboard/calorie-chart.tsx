import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from 'recharts'
import { CalendarDays, Target, TrendingUp } from 'lucide-react'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  averageKcal,
  formatKcal,
  formatLongDate,
  formatShortDate,
  formatWeekday,
  summarizeRange,
  type DaySummary,
  type LogsByDay,
} from '@/lib/nutrition'

const RANGES = [
  { value: '7', label: '7 วัน' },
  { value: '14', label: '14 วัน' },
  { value: '30', label: '30 วัน' },
] as const

const chartConfig = {
  kcal: { label: 'พลังงาน', color: 'var(--chart-1)' },
} satisfies ChartConfig

type Props = { logs: LogsByDay; goalKcal: number }

export function CalorieChart({ logs, goalKcal }: Props) {
  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('7')
  const days = Number(range)
  const data = useMemo(() => summarizeRange(logs, goalKcal, days), [logs, goalKcal, days])

  const avg = averageKcal(data)
  const completed = data.filter((d) => d.entries > 0 && !d.isToday)
  const withinGoal = completed.filter((d) => !d.overGoal).length
  const logged = data.filter((d) => d.entries > 0).length
  // Round 500-kcal steps so the axis reads 0 / 500 / 1,000 / …
  const yTop = Math.ceil((Math.max(goalKcal, ...data.map((d) => d.kcal)) * 1.1) / 500) * 500
  const yTicks = Array.from({ length: yTop / 500 + 1 }, (_, i) => i * 500)

  const tickFor = (key: string, index: number) => {
    if (days <= 7) return formatWeekday(key)
    if (days <= 14) return index % 2 === 0 ? formatShortDate(key) : ''
    return index % 5 === 0 || index === data.length - 1 ? formatShortDate(key) : ''
  }

  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">แคลอรี่รายวัน</CardTitle>
        <CardDescription>
          {goalKcal ? `เทียบกับเป้าหมาย ${formatKcal(goalKcal)} kcal ต่อวัน` : 'ยังไม่ได้ตั้งเป้าหมาย'}
        </CardDescription>
        <CardAction>
          <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <TabsList aria-label="ช่วงเวลา">
              {RANGES.map((r) => (
                <TabsTrigger key={r.value} value={r.value} className="px-3">
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>

      <CardContent>
        {logged < 3 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl bg-muted/60 text-center">
            <CalendarDays className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">บันทึกอีก {3 - logged} วันเพื่อดูแนวโน้ม</p>
            <p className="text-sm text-muted-foreground">กราฟจะแสดงเมื่อมีข้อมูลอย่างน้อย 3 วัน</p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-64 w-full sm:h-72"
              role="img"
              aria-label={`กราฟแคลอรี่ ${days} วันล่าสุด เฉลี่ย ${avg ? formatKcal(avg) : '-'} kcal ต่อวัน อยู่ในเป้า ${withinGoal} จาก ${completed.length} วัน`}
            >
              <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barCategoryGap={days > 14 ? '18%' : '28%'}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateKey"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  interval={0}
                  tickFormatter={tickFor}
                />
                <YAxis
                  width={44}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  domain={[0, yTop]}
                  ticks={yTicks}
                  interval={0}
                  tickFormatter={(v: number) => v.toLocaleString('th-TH')}
                />
                <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<DayTooltip goalKcal={goalKcal} />} />
                {goalKcal > 0 && (
                  <ReferenceLine
                    y={goalKcal}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    ifOverflow="extendDomain"
                    label={{ value: `เป้า ${formatKcal(goalKcal)}`, position: 'insideTopRight', fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                )}
                <Bar dataKey="kcal" radius={[6, 6, 2, 2]} maxBarSize={44} isAnimationActive={false}>
                  {data.map((d) => (
                    <Cell
                      key={d.dateKey}
                      fill={d.isToday ? 'var(--accent)' : d.overGoal ? 'var(--over)' : 'var(--color-kcal)'}
                      stroke={d.isToday ? 'var(--primary)' : undefined}
                      strokeDasharray={d.isToday ? '4 3' : undefined}
                      strokeWidth={d.isToday ? 1.5 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            <Legend hasGoal={goalKcal > 0} />
            <DataTable data={data} />
          </>
        )}
      </CardContent>

      <CardFooter className="grid grid-cols-1 gap-3 bg-muted/40 sm:grid-cols-3">
        <Stat icon={TrendingUp} label="เฉลี่ยต่อวัน" value={avg != null ? `${formatKcal(avg)} kcal` : '—'} />
        <Stat icon={Target} label="อยู่ในเป้า" value={goalKcal ? `${withinGoal} / ${completed.length} วัน` : '—'} />
        <Stat icon={CalendarDays} label="วันที่บันทึก" value={`${logged} / ${days} วัน`} />
      </CardFooter>
    </Card>
  )
}

function Legend({ hasGoal }: { hasGoal: boolean }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <li className="flex items-center gap-2">
        <span className="size-3 rounded-sm bg-chart-1" aria-hidden /> {hasGoal ? 'ในเป้า' : 'พลังงานที่กิน'}
      </li>
      {hasGoal && (
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-over" aria-hidden /> เกินเป้า
        </li>
      )}
      <li className="flex items-center gap-2">
        <span className="size-3 rounded-sm border border-dashed border-primary bg-accent" aria-hidden /> วันนี้ (ยังไม่ครบ)
      </li>
      {hasGoal && (
        <li className="flex items-center gap-2">
          <span className="h-0 w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden /> เป้าหมาย
        </li>
      )}
    </ul>
  )
}

type TooltipProps = { active?: boolean; payload?: { payload: DaySummary }[]; goalKcal: number }

function DayTooltip({ active, payload, goalKcal }: TooltipProps) {
  const day = payload?.[0]?.payload
  if (!active || !day) return null
  const diff = day.kcal - goalKcal
  return (
    <div className="min-w-48 rounded-lg border bg-popover px-3 py-2.5 text-sm text-popover-foreground shadow-lg">
      <p className="font-medium">
        {formatLongDate(day.dateKey)}
        {day.isToday && <span className="ml-1 text-muted-foreground">· ยังไม่ครบวัน</span>}
      </p>
      {day.entries === 0 ? (
        <p className="mt-1 text-muted-foreground">ไม่มีบันทึก (ไม่นับในค่าเฉลี่ย)</p>
      ) : (
        <>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatKcal(day.kcal)} kcal</p>
          <p className={goalKcal <= 0 ? 'hidden' : diff > 0 ? 'text-over-foreground' : 'text-muted-foreground'}>
            {day.isToday && diff <= 0
              ? `เหลืออีก ${formatKcal(-diff)} kcal`
              : diff > 0
                ? `เกินเป้าหมาย ${formatKcal(diff)} kcal`
                : `ต่ำกว่าเป้า ${formatKcal(-diff)} kcal`}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 border-t pt-2 text-xs">
            <Macro color="bg-protein" label="โปรตีน" grams={day.protein} />
            <Macro color="bg-carbs" label="คาร์บ" grams={day.carbs} />
            <Macro color="bg-fat" label="ไขมัน" grams={day.fat} />
          </div>
        </>
      )}
    </div>
  )
}

function Macro({ color, label, grams }: { color: string; label: string; grams: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className={`size-2 rounded-full ${color}`} aria-hidden />
        {label}
      </div>
      <p className="font-medium tabular-nums">{Math.round(grams)} ก.</p>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

/** Same numbers as the chart, for screen readers. */
function DataTable({ data }: { data: DaySummary[] }) {
  return (
    <table className="sr-only">
      <caption>แคลอรี่รายวัน</caption>
      <thead>
        <tr>
          <th scope="col">วันที่</th>
          <th scope="col">kcal</th>
          <th scope="col">โปรตีน (ก.)</th>
          <th scope="col">คาร์บ (ก.)</th>
          <th scope="col">ไขมัน (ก.)</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.dateKey}>
            <th scope="row">{formatLongDate(d.dateKey)}{d.isToday ? ' (วันนี้ ยังไม่ครบ)' : ''}</th>
            <td>{d.entries ? Math.round(d.kcal) : 'ไม่มีบันทึก'}</td>
            <td>{Math.round(d.protein)}</td>
            <td>{Math.round(d.carbs)}</td>
            <td>{Math.round(d.fat)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
