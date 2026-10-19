import { useState } from 'react'
import { ChevronLeft, ChevronRight, Sprout } from 'lucide-react'
import { t } from '../i18n'
import { n } from '../i18n/format'
import {
  formatThaiDateRange,
  formatThaiShortDate,
} from '../i18n/format'
import { daysBack, todayIso } from '../lib/date'
import { useAppState } from '../state/app-state'
import {
  averageKcal,
  averageKcalOfCompleteDays,
  hasEnoughTrendData,
  hasUsableGoal,
  loggedDays,
} from '../lib/nutrition'
import { EmptyState } from '../components/EmptyState'
import { LinkButton } from '../components/Button'
import { MacroGroupedChart } from '../components/MacroGroupedChart'
import { SegmentedControl } from '../components/SegmentedControl'
import { TrendBarChart } from '../components/TrendBarChart'
import { DataTable } from '../components/DataTable'

type Range = '7' | '30' | 'custom'

const RANGE_OPTIONS: { value: Range; labelKey: string }[] = [
  { value: '7', labelKey: 'trends.range7' },
  { value: '30', labelKey: 'trends.range30' },
  { value: 'custom', labelKey: 'trends.rangeCustom' },
]

function DateNavigator({
  label,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
}: {
  label: string
  onPrevious: () => void
  onNext: () => void
  previousDisabled: boolean
  nextDisabled: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        aria-label="ช่วงก่อนหน้า"
        title="ช่วงก่อนหน้า"
        onClick={onPrevious}
        disabled={previousDisabled}
        className="flex h-11 w-11 items-center justify-center rounded-icon border border-line bg-card text-ink hover:bg-mint disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </button>
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <button
        type="button"
        aria-label="ช่วงถัดไป"
        title="ช่วงถัดไป"
        onClick={onNext}
        disabled={nextDisabled}
        className="flex h-11 w-11 items-center justify-center rounded-icon border border-line bg-card text-ink hover:bg-mint disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  )
}

function StatCard({
  title,
  value,
  body,
}: {
  title: string
  value: string
  body: string
}) {
  return (
    <div className="app-card p-5">
      <p className="text-xs text-ink-muted">{title}</p>
      <p className="tnum mt-1 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{body}</p>
    </div>
  )
}

export function TrendsScreen() {
  const { history, profile, weightsByDay, saveWeight } = useAppState()
  const [range, setRange] = useState<Range>('7')
  const [rangeOffset, setRangeOffset] = useState(0)
  const [customFrom, setCustomFrom] = useState(daysBack(6))
  const [customTo, setCustomTo] = useState(todayIso())
  const [weightInput, setWeightInput] = useState('')
  const [weightError, setWeightError] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)

  const goalKcal = hasUsableGoal(profile.goal) ? profile.goal.kcal : null
  const today = todayIso()
  const span = range === '30' ? 30 : 7
  const windowEnd = daysBack(rangeOffset * span)
  const windowStart = daysBack(rangeOffset * span + span - 1)
  const selectedStart = range === 'custom' ? customFrom : windowStart
  const selectedEnd = range === 'custom' ? customTo : windowEnd
  const validCustomRange = range !== 'custom' || (!!customFrom && !!customTo && customFrom <= customTo)
  const selectedDays = validCustomRange
    ? loggedDays(history.filter((day) => day.date >= selectedStart && day.date <= selectedEnd))
    : []
  const enough = hasEnoughTrendData(selectedDays)
  const logged = loggedDays(selectedDays)
  const avg = averageKcal(selectedDays)
  const prevAvg = averageKcalOfCompleteDays(selectedDays)
  const selectedDay = selectedDays[selectedDays.length - 1]
  const rangeLabel =
    validCustomRange && selectedStart && selectedEnd
      ? formatThaiDateRange(selectedStart, selectedEnd)
      : ''
  const includesToday = selectedStart <= today && selectedEnd >= today
  const monthCaption = `${rangeLabel}${includesToday ? ` · ${t('trends.todayIncompleteNote', { day: Number(today.slice(-2)) })}` : ''}`

  const energyData = selectedDays.map((day) => ({
    date: day.date,
    value: day.kcal,
    highlight: day.date === today,
  }))
  const macroData = selectedDays.map((day) => ({ date: day.date, macros: day.macros }))

  const saveWeightEntry = async () => {
    const weightKg = Number(weightInput)
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
      setWeightError('กรอกน้ำหนักเป็นตัวเลขระหว่าง 20–400 กก.')
      return
    }
    setWeightError('')
    setSavingWeight(true)
    try {
      await saveWeight(weightKg)
      setWeightInput('')
    } catch (error) {
      setWeightError((error as Error).message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSavingWeight(false)
    }
  }

  const recentWeights = Object.entries(weightsByDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)

  return (
    <div className="mx-auto max-w-content">
      <header className="mb-3">
        <h1 className="text-2xl font-bold text-ink">{t('trends.title')}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{t('trends.subtitle')}</p>
      </header>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-center sm:gap-4">
        <SegmentedControl<Range>
          ariaLabel={t('trends.title')}
          value={range}
          onChange={(nextRange) => {
            setRange(nextRange)
            setRangeOffset(0)
          }}
          size="sm"
          options={RANGE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
        />
        <DateNavigator
          label={rangeLabel}
          onPrevious={() => setRangeOffset((offset) => offset + 1)}
          onNext={() => setRangeOffset((offset) => Math.max(0, offset - 1))}
          previousDisabled={range === 'custom'}
          nextDisabled={range === 'custom' || rangeOffset === 0}
        />
      </div>

      {range === 'custom' ? (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-card border border-line bg-card p-4 text-sm">
          <label className="flex flex-col gap-1 text-xs text-ink-muted">
            ตั้งแต่
            <input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="min-h-[44px] rounded-input border border-line bg-surface px-3 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-muted">
            ถึง
            <input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="min-h-[44px] rounded-input border border-line bg-surface px-3 text-sm text-ink"
            />
          </label>
          <p className="text-xs text-ink-muted">{t('trends.customRangeNote')}</p>
        </div>
      ) : null}

      {!enough ? (
        <InsufficientState />
      ) : (
        <>
          {/* Mobile summary */}
          <section className="mb-4 rounded-card border border-mint bg-mint p-5 lg:hidden">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-ink-muted-on-mint">{t('trends.avgPerDay')}</p>
              <span className="chip bg-card text-brand-deep">
                {t('trends.loggedDaysChip', { count: logged.length })}
              </span>
            </div>
            <p className="tnum mt-1 text-3xl font-bold text-ink">
              {avg != null ? n(avg) : '—'}
              <span className="ml-1.5 text-sm font-normal text-ink-muted-on-mint">
                {t('common.kcal')}
              </span>
            </p>
            <p className="mt-1 text-xs text-ink-muted-on-mint">{t('trends.avgNote')}</p>
          </section>

          {/* Desktop stat cards */}
          <section className="mb-4 hidden gap-4 lg:grid lg:grid-cols-3">
            <StatCard
              title={t('trends.avgPerDay')}
              value={`${n(avg ?? 0)} ${t('common.kcal')}`}
              body={t('trends.avgNote')}
            />
            <StatCard
              title={t('trends.statLoggedDays')}
              value={`${logged.length} วัน`}
              body={t('trends.statLoggedDaysBody', { range: rangeLabel })}
            />
            <StatCard
              title={t('trends.statPrevAvg')}
              value={`${n(prevAvg ?? 0)} ${t('common.kcal')}`}
              body={t('trends.statPrevAvgBody')}
            />
          </section>

          {/* Charts */}
          <div className="mb-4 grid gap-4 lg:grid-cols-2 lg:items-start">
            <section className="app-card p-5">
              <h2 className="mb-3 text-base font-semibold text-ink">{t('trends.energyPerDay')}</h2>
              <TrendBarChart
                data={energyData}
                goalValue={goalKcal ?? undefined}
                goalLabel={
                  goalKcal != null ? t('trends.goalReference', { kcal: n(goalKcal) }) : undefined
                }
                axisUnit={t('trends.energyAxisUnit')}
                axisStep={500}
                ariaTitle={t('trends.energyPerDay')}
                ariaDesc="กราฟแท่งแสดงพลังงานที่บันทึกในแต่ละวัน หน่วยกิโลแคลอรี"
                caption={monthCaption}
                valueFormatter={(v) => n(v)}
              />
            </section>

            <section className="app-card p-5">
              <h2 className="mb-1 text-base font-semibold text-ink">{t('trends.macrosPerDay')}</h2>
              <p className="mb-3 text-xs text-ink-muted">{t('trends.macroNote')}</p>
              <MacroGroupedChart
                data={macroData}
                axisUnit={t('common.gram')}
                axisStep={125}
                ariaTitle={t('trends.macrosPerDay')}
                ariaDesc="กราฟแท่งกลุ่มแสดงโปรตีน คาร์บ และไขมันในแต่ละวัน หน่วยกรัม"
              />
              {selectedDay ? (
                <p className="mt-3 text-sm text-ink-muted">
                  {t('trends.selectedDay', {
                    date: formatThaiShortDate(selectedDay.date),
                    protein: n(selectedDay.macros.protein),
                    carb: n(selectedDay.macros.carb),
                    fat: n(selectedDay.macros.fat),
                  })}
                </p>
              ) : null}
            </section>
          </div>

          {/* Reminder */}
          <section className="mb-4 rounded-card border border-mint bg-mint p-5">
            <h2 className="text-base font-semibold text-ink">{t('trends.reminderTitle')}</h2>
            <p className="mt-1 text-sm text-ink-muted-on-mint">
              {t('trends.reminderBody', { prev: n(prevAvg ?? 0) })}
            </p>
          </section>

          {/* Desktop-only accessible table */}
          <section className="app-card hidden p-5 lg:block">
            <DataTable days={selectedDays} goalKcal={goalKcal} todayIso={today} />
          </section>
        </>
      )}

      <section className="app-card mt-4 p-5" aria-labelledby="weight-history-heading">
        <h2 id="weight-history-heading" className="text-base font-semibold text-ink">
          แนวโน้มน้ำหนัก
        </h2>
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void saveWeightEntry()
          }}
        >
          <label className="flex flex-col gap-1 text-xs text-ink-muted">
            น้ำหนักวันนี้ (กก.)
            <input
              type="number"
              min="20"
              max="400"
              step="0.1"
              inputMode="decimal"
              value={weightInput}
              onChange={(event) => {
                setWeightInput(event.target.value)
                setWeightError('')
              }}
              className="min-h-[44px] rounded-input border border-line bg-surface px-3 text-sm text-ink"
              aria-label="น้ำหนักวันนี้ หน่วยกิโลกรัม"
            />
          </label>
          <button
            type="submit"
            disabled={savingWeight || !weightInput}
            className="min-h-[44px] rounded-btn bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savingWeight ? 'กำลังบันทึก…' : 'บันทึกน้ำหนัก'}
          </button>
        </form>
        {weightError ? <p role="alert" className="mt-2 text-sm text-carbstrong">{weightError}</p> : null}
        {recentWeights.length ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentWeights.map(([date, weight]) => (
              <li key={date} className="flex justify-between rounded-btn border border-line bg-surface px-3 py-2 text-sm">
                <span className="text-ink-muted">{formatThaiShortDate(date)}</span>
                <span className="tnum font-semibold text-ink">{n(weight)} กก.</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">ยังไม่มีประวัติน้ำหนัก บันทึกได้เมื่อคุณพร้อม</p>
        )}
      </section>
    </div>
  )
}

function InsufficientState() {
  return (
    <>
      <section className="app-card mb-4">
        <EmptyState
          icon={<Sprout aria-hidden="true" className="h-6 w-6" />}
          title={t('trends.insufficientTitle')}
          description={t('trends.insufficientDesc')}
        />
      </section>

      <section className="app-card mb-4 p-5">
        <h2 className="text-base font-semibold text-ink">{t('trends.insufficientCardTitle')}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t('trends.insufficientCardBody')}</p>
      </section>

      <LinkButton
        to="/log"
        variant="primary"
        iconStart={<Sprout aria-hidden="true" className="h-5 w-5" />}
      >
        {t('trends.firstMealCta')}
      </LinkButton>
    </>
  )
}
