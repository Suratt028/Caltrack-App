import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { t } from '../i18n'
import { n } from '../i18n/format'
import { foodRepository } from '../data/repositories'
import { todayIso } from '../lib/date'
import { useAppState } from '../state/app-state'
import type { FoodCatalogItem, MealId } from '../types'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'
import { SegmentedControl } from '../components/SegmentedControl'

const MEAL_OPTIONS: { value: MealId; labelKey: string }[] = [
  { value: 'breakfast', labelKey: 'meals.breakfastShort' },
  { value: 'lunch', labelKey: 'meals.lunchShort' },
  { value: 'dinner', labelKey: 'meals.dinnerShort' },
  { value: 'snack', labelKey: 'meals.snackShort' },
]

export function LogSearchScreen() {
  const navigate = useNavigate()
  const { addEntry, recentIds } = useAppState()

  const [meal, setMeal] = useState<MealId>('lunch')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodCatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [savingManual, setSavingManual] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualKcal, setManualKcal] = useState('')

  // Debounced search against the food database (skipped for an empty query).
  useEffect(() => {
    let active = true
    const q = query.trim()
    if (!q) {
      setResults([])
      setLoading(false)
      setSearched(false)
      return
    }
    setLoading(true)
    const id = window.setTimeout(() => {
      foodRepository
        .search(q)
        .then((items) => {
          if (!active) return
          setResults(
            items.map((item) => (recentIds.includes(item.id) ? { ...item, recent: true } : item)),
          )
          setLoading(false)
          setSearched(true)
        })
        .catch(() => {
          if (!active) return
          setResults([])
          setLoading(false)
          setSearched(true)
        })
    }, 180)
    return () => {
      active = false
      window.clearTimeout(id)
    }
  }, [query, recentIds])

  const goPortion = (foodId: string) => {
    navigate(`/log/portion/${foodId}?meal=${meal}`)
  }

  const saveManual = async () => {
    const kcal = Number(manualKcal) || 0
    setSavingManual(true)
    await addEntry({
      id: `manual-${Date.now()}`,
      date: todayIso(),
      meal,
      name: manualName.trim() || 'อาหารที่เพิ่มเอง',
      amount: 1,
      unit: 'จาน',
      grams: 0,
      kcal,
      macros: { protein: 0, carb: 0, fat: 0 },
    })
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-content">
      <ScreenHeader
        title={t('log.title')}
        subtitle={t('log.subtitle')}
        backTo="/"
      />

      <div className="mb-4 sm:max-w-md">
        <SegmentedControl<MealId>
          ariaLabel={t('log.subtitle')}
          value={meal}
          onChange={setMeal}
          options={MEAL_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
        />
      </div>

      {/* Search field */}
      <div className="relative mb-5 sm:max-w-xl">
        <label htmlFor="food-search" className="sr-only">
          {t('log.searchLabel')}
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
        />
        <input
          id="food-search"
          type="search"
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('log.searchPlaceholder')}
          className="min-h-[52px] w-full rounded-input border-2 border-brand bg-card pl-11 pr-11 text-base text-ink shadow-soft placeholder:text-ink-muted/70"
        />
        {query ? (
          <button
            type="button"
            aria-label={t('common.clear')}
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-mint"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Results */}
      {searched || loading ? (
        <section aria-labelledby="results-heading">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 id="results-heading" className="text-base font-semibold text-ink">
              {t('log.resultsTitle')}
            </h2>
            {!loading ? (
              <span className="text-xs text-ink-muted">
                {t('log.resultsCount', { count: results.length })}
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 rounded-card border border-line bg-card p-5 text-sm text-ink-muted">
              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              กำลังค้นหา…
            </div>
          ) : results.length === 0 ? (
            <div className="app-card">
              <EmptyState
                icon={<UtensilsCrossed aria-hidden="true" className="h-6 w-6" />}
                title={t('log.emptyTitle', { query })}
                description={t('log.emptyDesc')}
              />
            </div>
          ) : (
            <ul className="space-y-2.5">
              {results.map((food) => (
                <li
                  key={food.id}
                  className="flex items-center gap-3 rounded-card border border-line/70 bg-card p-3.5 shadow-soft"
                >
                  <div className="min-w-0 flex-1">
                    {food.recent ? (
                      <span className="chip mb-1 bg-mint text-brand-deep">{t('log.recentBadge')}</span>
                    ) : null}
                    <p className="truncate text-[15px] font-semibold text-ink">{food.name}</p>
                    <p className="truncate text-xs text-ink-muted">{food.servingLabel}</p>
                  </div>
                  <p className="tnum shrink-0 text-right text-lg font-semibold text-ink">
                    {n(food.kcal)}
                    <span className="ml-1 text-xs font-normal text-ink-muted">
                      {t('common.kcal')}
                    </span>
                  </p>
                  <button
                    type="button"
                    aria-label={`${t('common.save')} ${food.name}`}
                    onClick={() => goPortion(food.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-icon bg-mint text-brand transition-colors hover:bg-brand hover:text-white"
                  >
                    <Plus aria-hidden="true" className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* Add manually */}
      <section className="mt-5">
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          aria-expanded={manualOpen}
          className="flex w-full items-center gap-3 rounded-card border border-line bg-card p-4 text-left transition-colors hover:border-brand/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mint text-brand">
            <Pencil aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">{t('log.addManual')}</span>
            <span className="block text-xs text-ink-muted">{t('log.addManualCta')}</span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-ink-muted transition-transform ${
              manualOpen ? 'rotate-90' : ''
            }`}
          />
        </button>

        {manualOpen ? (
          <div className="mt-3 rounded-card border border-line bg-card p-4 shadow-soft">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                ชื่ออาหาร
                <input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="เช่น ข้าวกะเพราไก่"
                  className="min-h-[44px] rounded-input border border-line bg-surface px-3 text-sm text-ink"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                พลังงาน (kcal)
                <input
                  value={manualKcal}
                  onChange={(e) => setManualKcal(e.target.value)}
                  inputMode="numeric"
                  placeholder="เช่น 560"
                  className="min-h-[44px] rounded-input border border-line bg-surface px-3 text-sm text-ink"
                />
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="primary"
                onClick={() => void saveManual()}
                disabled={savingManual || !manualName.trim()}
              >
                {t('common.save')}
              </Button>
              <Button variant="ghost" onClick={() => setManualOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="mt-5">
        <Notice tone="info">
          <p>{t('log.hint')}</p>
          <p className="mt-1 text-xs">{t('log.nutritionNote')}</p>
        </Notice>
      </div>
    </div>
  )
}
