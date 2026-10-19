import { History, Leaf, Loader2, Plus, ScanLine, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppState } from '../state/app-state'
import { t } from '../i18n'
import { formatThaiLongDate, formatThaiShortDate, n } from '../i18n/format'
import { todayIso } from '../lib/date'
import {
  groupByMeal,
  hasUsableGoal,
  MEAL_ORDER,
  isOverGoal,
  overGoalBy,
  percentConsumed,
  remainingKcal,
  sumNutrition,
} from '../lib/nutrition'
import type { FoodLogEntry, MealId, NutritionGoal } from '../types'
import { LinkButton } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { EnergyRing } from '../components/EnergyRing'
import { FoodPhoto } from '../components/FoodPhoto'
import { MacroBar } from '../components/MacroBar'
import { MealCard, MealEmptyCard, MEAL_LABEL_KEY } from '../components/MealCard'
import { Notice } from '../components/Notice'

const HOME_ORDER: MealId[] = ['breakfast', 'lunch', 'dinner', 'snack']

function sortEntries(entries: FoodLogEntry[]): FoodLogEntry[] {
  return [...entries].sort((a, b) => {
    const byMeal = HOME_ORDER.indexOf(a.meal) - HOME_ORDER.indexOf(b.meal)
    if (byMeal !== 0) return byMeal
    return (a.time ?? '').localeCompare(b.time ?? '')
  })
}

/* ---------------------------------- header --------------------------------- */

function HomeHeader() {
  const { profile } = useAppState()
  const greeting = profile.goal
    ? t('home.greeting', { name: profile.name })
    : t('home.startTogether')
  const todayLabel = formatThaiLongDate(todayIso())

  return (
    <header className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink">{greeting}</h1>
        <p className="mt-0.5 hidden text-sm text-ink-muted sm:block">
          {t('home.subtitleToday', { date: todayLabel })}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted sm:hidden">{todayLabel}</p>
      </div>

      <span className="chip hidden shrink-0 border border-line bg-card text-ink-muted sm:inline-flex">
        {formatThaiShortDate(todayIso())}
      </span>

      <button
        type="button"
        aria-label={t('home.leafHint')}
        title={t('home.leafHint')}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-brand sm:hidden"
      >
        <Leaf aria-hidden="true" className="h-5 w-5" />
      </button>
    </header>
  )
}

/* -------------------------------- energy card ------------------------------ */

function EnergyCard({
  goal,
  consumedKcal,
  consumedMacros,
}: {
  goal: NutritionGoal
  consumedKcal: number
  consumedMacros: { protein: number; carb: number; fat: number }
}) {
  const remaining = remainingKcal(goal, consumedKcal) ?? 0
  const percent = percentConsumed(goal, consumedKcal) ?? 0
  const over = isOverGoal(goal, consumedKcal)
  const overBy = overGoalBy(goal, consumedKcal)

  return (
    <section className="app-card p-5" aria-labelledby="energy-heading">
      <div className="flex items-start justify-between gap-2">
        <h2 id="energy-heading" className="text-base font-semibold text-ink">
          {t('home.energyToday')}
        </h2>
        <Link
          to="/profile"
          className="shrink-0 text-xs font-medium text-brand underline-offset-2 hover:underline"
        >
          {t('home.sampleGoalLink')}
        </Link>
      </div>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
        <EnergyRing
          percent={percent}
          ariaLabel={t('home.progressAria', {
            consumed: n(consumedKcal),
            goal: n(goal.kcal),
          })}
        >
          <span className="text-[11px] text-ink-muted">
            {over ? t('home.consumedLabelPlain') : t('home.remaining')}
          </span>
          <span className="tnum text-3xl font-bold leading-tight text-ink">
            {n(over ? consumedKcal : remaining)}
          </span>
          <span className="text-[11px] text-ink-muted">{t('common.kcalLong')}</span>
        </EnergyRing>

        <dl className="w-full min-w-0 space-y-3 text-center sm:text-left">
          <div>
            <dt className="text-xs text-ink-muted">
              {t('home.consumedLabel', { percent: String(Math.round(percent)) })}
            </dt>
            <dd className="tnum text-xl font-semibold text-ink">
              {n(consumedKcal)}
              <span className="ml-1 text-xs font-normal text-ink-muted">{t('common.kcal')}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">{t('home.goalLabel')}</dt>
            <dd className="tnum text-base font-semibold text-ink">
              {n(goal.kcal)}
              <span className="ml-1 text-xs font-normal text-ink-muted">{t('common.kcal')}</span>
            </dd>
          </div>
        </dl>
      </div>

      {over ? (
        <p className="mt-3 text-sm font-medium text-carbstrong">
          {t('home.overGoal', { amount: n(overBy) })}
        </p>
      ) : null}

      <hr className="my-4 border-line" />

      <div className="grid grid-cols-3 gap-3">
        <MacroBar kind="protein" consumed={consumedMacros.protein} goal={goal.macros.protein} />
        <MacroBar kind="carb" consumed={consumedMacros.carb} goal={goal.macros.carb} />
        <MacroBar kind="fat" consumed={consumedMacros.fat} goal={goal.macros.fat} />
      </div>
    </section>
  )
}

function NoGoalCards() {
  const { entries } = useAppState()
  const totals = sumNutrition(entries)
  return (
    <>
      <section className="rounded-card border border-mint bg-mint p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-brand">
          <Sprout aria-hidden="true" className="h-6 w-6" />
        </span>
        <h2 className="mt-3 text-lg font-semibold text-ink">{t('home.noGoalCardTitle')}</h2>
        <p className="mt-1 text-sm text-ink-muted-on-mint">{t('home.noGoalCardDesc')}</p>
        <LinkButton to="/profile" variant="primary" className="mt-4">
          {t('home.noGoalCta')}
        </LinkButton>      </section>

      <section className="app-card p-5" aria-labelledby="logged-energy-heading">
        <h2 id="logged-energy-heading" className="text-base font-semibold text-ink">
          {t('home.loggedEnergyTitle')}
        </h2>
        <p className="tnum mt-2 text-3xl font-bold text-ink">
          {n(totals.kcal)}
          <span className="ml-1 text-sm font-normal text-ink-muted">{t('common.kcal')}</span>
        </p>
        <p className="mt-2 text-sm text-ink-muted">{t('home.noGoalExplain')}</p>
      </section>
    </>
  )
}

/* ------------------------------ actions & lists ---------------------------- */

function ActionButtons({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <div className={`grid gap-3 ${fullWidth ? 'sm:grid-cols-2' : ''}`}>
      <LinkButton
        to="/log"
        variant="primary"
        size="lg"
        fullWidth
        iconStart={<Plus aria-hidden="true" className="h-5 w-5" />}
      >
        {t('home.logFood')}
      </LinkButton>
      <LinkButton
        to="/scan"
        variant="secondary"
        size="lg"
        fullWidth
        iconStart={<ScanLine aria-hidden="true" className="h-5 w-5" />}
      >
        {t('home.scanFood')}
      </LinkButton>
    </div>
  )
}

function FoodTodayList({ showMacros = false }: { showMacros?: boolean }) {
  const { entries } = useAppState()
  const sorted = sortEntries(entries)
  const grouped = groupByMeal(sorted)

  if (sorted.length === 0) {
    return (
      <section className="app-card" aria-labelledby="food-today-heading">
        <h2 id="food-today-heading" className="px-5 pt-5 text-base font-semibold text-ink">
          {t('home.foodToday')}
        </h2>
        <EmptyState
          icon={<Plus aria-hidden="true" className="h-6 w-6" />}
          title={t('home.emptyTitle')}
          description={t('home.emptyDesc')}
          action={
            <LinkButton to="/log" variant="primary">
              {t('home.logFood')}
            </LinkButton>
          }
        />
      </section>
    )
  }

  return (
    <section className="app-card p-5" aria-labelledby="food-today-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="food-today-heading" className="text-base font-semibold text-ink">
          {t('home.foodToday')}
        </h2>
        <span className="text-xs text-ink-muted">
          {t('home.itemsCount', { count: sorted.length })}
        </span>
      </div>

      <ul className="space-y-2.5">
        {MEAL_ORDER.map((meal) => {
          const items = grouped[meal]
          if (items.length === 0) {
            return (
              <MealEmptyCard
                key={meal}
                label={`${t(MEAL_LABEL_KEY[meal])} · ${t('meals.empty')}`}
              />
            )
          }
          return items.map((entry) => (
            <MealCard key={entry.id} entry={entry} showMacros={showMacros} />
          ))
        })}
      </ul>
    </section>
  )
}

/* -------------------------- tablet / desktop cards ------------------------- */

function NextMealCard() {
  const { entries } = useAppState()
  // `entries` is newest-first; the latest logged food powers the hint line.
  const lastLogged = entries.find((entry) => entry.kcal > 0)

  return (
    <section className="app-card p-5">
      <h2 className="text-base font-semibold text-ink">{t('home.nextMealTitle')}</h2>
      <p className="mt-1 text-sm text-ink-muted">{t('home.nextMealDesc')}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <LinkButton
          to="/log"
          variant="primary"
          fullWidth
          iconStart={<Plus aria-hidden="true" className="h-5 w-5" />}
        >
          {t('home.logFood')}
        </LinkButton>
        <LinkButton
          to="/scan"
          variant="secondary"
          fullWidth
          iconStart={<ScanLine aria-hidden="true" className="h-5 w-5" />}
        >
          {t('home.scanFood')}
        </LinkButton>
      </div>
      {lastLogged ? (
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink-muted">
          <History aria-hidden="true" className="h-4 w-4" />
          {t('home.lastLogged', { label: `${lastLogged.name} · ${n(lastLogged.kcal)} kcal` })}
        </p>
      ) : null}
    </section>
  )
}

function TodayInYourWayCard() {
  const { entries } = useAppState()
  const grouped = groupByMeal(entries)
  const mealCount = MEAL_ORDER.filter((meal) => grouped[meal].length > 0).length
  const dinnerEmpty = grouped.dinner.length === 0

  return (
    <section className="rounded-card border border-mint bg-mint p-5">
      <h2 className="text-base font-semibold text-ink">{t('home.todayInYourWay')}</h2>
      <p className="mt-2 text-sm text-ink-muted-on-mint">
        {t('home.todayInYourWayBody', { count: entries.length, meals: mealCount })}
      </p>
      {dinnerEmpty ? (
        <p className="mt-1 text-sm text-ink-muted-on-mint">{t('home.todayInYourWayDinner')}</p>
      ) : null}
      <p className="mt-3 text-xs text-ink-muted-on-mint">{t('notes.numbersOnly')}</p>
    </section>
  )
}

function GoalCard({ goal }: { goal: NutritionGoal }) {
  return (
    <section className="app-card p-5">
      <h2 className="text-base font-semibold text-ink">{t('home.yourGoal')}</h2>
      <p className="tnum mt-2 text-2xl font-bold text-ink">
        {t('home.yourGoalPerDay', { kcal: n(goal.kcal) })}
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
        <li>{t('macros.protein')} {n(goal.macros.protein)}</li>
        <li>{t('macros.carb')} {n(goal.macros.carb)}</li>
        <li>{t('macros.fat')} {n(goal.macros.fat)}</li>
      </ul>
      <p className="mt-3 text-xs text-ink-muted">{t('home.goalDisclaimer')}</p>
      <Link
        to="/profile"
        className="mt-3 inline-block text-sm font-medium text-brand underline-offset-2 hover:underline"
      >
        {t('home.viewProfile')} →
      </Link>
    </section>
  )
}

function PhotoCard({ entry }: { entry: FoodLogEntry }) {
  return (
    <section className="app-card overflow-hidden">
      <div className="h-40 w-full">
        <FoodPhoto alt={`ภาพตัวอย่างอาหาร: ${entry.name}`} />
      </div>
      <div className="p-4">
        <p className="text-xs text-ink-muted">
          {t(MEAL_LABEL_KEY[entry.meal])}
          {entry.time ? ` · ${entry.time}` : ''}
        </p>
        <p className="mt-0.5 text-base font-semibold text-ink">{entry.name}</p>
        <p className="tnum mt-1 text-sm text-ink-muted">
          {entry.amount} {entry.unit} · {n(entry.kcal)} {t('common.kcal')}
        </p>
        <p className="mt-2 text-xs font-medium text-brand">บันทึกอยู่ในยอดวันนี้แล้ว</p>
      </div>
    </section>
  )
}

/* --------------------------------- screen ---------------------------------- */

export function HomeScreen() {
  const { profile, entries, loading, loadError, reload } = useAppState()
  const goal = profile.goal
  const hasGoal = hasUsableGoal(goal)
  const totals = sumNutrition(entries)
  const photoEntry = entries.find((entry) => entry.meal === 'lunch') ?? entries[0]

  if (loading) {
    return (
      <div className="mx-auto flex max-w-content items-center gap-3 p-8 text-sm text-ink-muted">
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        กำลังโหลดข้อมูล…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-content">
      <HomeHeader />

      {loadError ? (
        <div className="mb-4">
          <Notice tone="warn" title="โหลดข้อมูลไม่สำเร็จ">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-2 font-semibold text-brand underline-offset-2 hover:underline"
            >
              ลองใหม่
            </button>
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-start lg:gap-6">
        {/* Column 1 — energy + reflective/goal cards */}
        <div className="flex flex-col gap-4">
          {hasGoal && goal ? (
            <EnergyCard goal={goal} consumedKcal={totals.kcal} consumedMacros={totals.macros} />
          ) : (
            <NoGoalCards />
          )}

          {/* Tablet & desktop get the reflective + goal cards here (goal state only) */}
          {hasGoal ? (
            <div className="hidden sm:flex sm:flex-col sm:gap-4">
              <TodayInYourWayCard />
              {goal ? <GoalCard goal={goal} /> : null}
            </div>
          ) : null}
        </div>

        {/* Column 2 — actions + food list (+ desktop photo) */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="hidden sm:block">
            <NextMealCard />
          </div>

          <FoodTodayList showMacros />

          {/* Desktop-only photo card */}
          {photoEntry ? (
            <div className="hidden lg:block">
              <PhotoCard entry={photoEntry} />
            </div>
          ) : null}

          {/* Mobile-only action buttons */}
          <div className="sm:hidden">
            <ActionButtons fullWidth />
          </div>
        </div>
      </div>

      {/* No-goal: keep a gentle notice for mobile users without a goal */}
      {!hasGoal ? (
        <div className="mt-4">
          <Notice tone="info" icon={<Sprout aria-hidden="true" className="h-5 w-5" />}>
            {t('home.noGoalExplain')}
          </Notice>
        </div>
      ) : null}
    </div>
  )
}
