import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { t } from '../i18n'
import { n } from '../i18n/format'
import { PORTION_UNITS } from '../data/constants'
import { foodRepository } from '../data/repositories'
import { todayIso } from '../lib/date'
import { useAppState } from '../state/app-state'
import type { FoodCatalogItem, MealId } from '../types'
import { portionGrams, scalePortion } from '../lib/nutrition'
import { Button } from '../components/Button'
import { FoodPhoto } from '../components/FoodPhoto'
import { Notice } from '../components/Notice'
import { PortionStepper, UnitSelect } from '../components/PortionStepper'
import { ScreenHeader } from '../components/ScreenHeader'

/** Stepper feel depends on the unit: grams step by 10, portions by 0.5. */
const STEPPER_BY_UNIT: Record<string, { step: number; min: number; max: number }> = {
  กรัม: { step: 10, min: 10, max: 2000 },
}

const MEAL_OPTIONS: { value: MealId; labelKey: string }[] = [
  { value: 'breakfast', labelKey: 'meals.breakfast' },
  { value: 'lunch', labelKey: 'meals.lunch' },
  { value: 'dinner', labelKey: 'meals.dinner' },
  { value: 'snack', labelKey: 'meals.snack' },
]

export function PortionScreen() {
  const { foodId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addEntry } = useAppState()

  const [food, setFood] = useState<FoodCatalogItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [meal, setMeal] = useState<MealId>((searchParams.get('meal') as MealId) || 'lunch')
  const [amount, setAmount] = useState(1)
  const [unit, setUnit] = useState<string>('จาน')

  useEffect(() => {
    let active = true
    if (!foodId) return
    foodRepository
      .getById(foodId)
      .then((item) => {
        if (!active) return
        setFood(item)
        setUnit(item?.unit ?? 'จาน')
        // Gram-based servings start at 100 g (= the stored per-100 g values).
        setAmount(item?.unit === 'กรัม' ? item.grams : 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => {
      active = false
    }
  }, [foodId])

  const changeUnit = (next: string) => {
    setUnit(next)
    if (!food) return
    // Switching into grams seeds the amount with the serving weight.
    if (next === 'กรัม') setAmount(food.grams)
    else setAmount(1)
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl items-center gap-3 p-8 text-sm text-ink-muted">
        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        กำลังโหลด…
      </div>
    )
  }

  if (!food) {
    return (
      <div className="mx-auto max-w-2xl">
        <ScreenHeader title={t('portion.title')} backTo="/log" />
        <Notice tone="warn" title={t('log.emptyTitle', { query: '' })}>
          ไม่พบข้อมูลอาหารนี้ ลองเลือกใหม่อีกครั้ง
        </Notice>
      </div>
    )
  }

  const multiplier = unit === 'กรัม' ? amount / food.grams : amount
  const scaled = scalePortion(food, multiplier)
  const grams = unit === 'กรัม' ? Math.round(amount) : portionGrams(food.grams, amount)

  const confirm = async () => {
    await addEntry({
      id: `log-${Date.now()}`,
      date: todayIso(),
      foodId: food.id,
      meal,
      name: food.name,
      amount,
      unit,
      grams,
      kcal: scaled.kcal,
      macros: scaled.macros,
    })
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ScreenHeader title={t('portion.title')} subtitle={t('portion.subtitle')} backTo="/log" />

      <div className="grid gap-4">
        {/* Food identity */}
        <section className="app-card overflow-hidden">
          <div className="h-40 w-full sm:h-48">
            <FoodPhoto alt={`ภาพตัวอย่างอาหาร: ${food.name}`} />
          </div>
          <div className="p-5">
            <p className="text-lg font-semibold text-ink">{food.name}</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {food.servingLabel} · {n(food.kcal)} {t('common.kcal')}
            </p>
          </div>
        </section>

        {/* Controls */}
        <section className="app-card p-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-ink-muted">{t('portion.mealField')}</span>
            <select
              value={meal}
              onChange={(e) => setMeal(e.target.value as MealId)}
              className="min-h-[48px] rounded-input border border-line bg-surface px-3 text-sm font-medium text-ink"
            >
              {MEAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey)} · {t('common.today')}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs text-ink-muted">{t('portion.amountField')}</p>
              <PortionStepper
                amount={amount}
                onChange={setAmount}
                unit={unit}
                {...(STEPPER_BY_UNIT[unit] ?? {})}
              />
            </div>
            <UnitSelect
              value={unit}
              options={PORTION_UNITS}
              onChange={changeUnit}
            />
          </div>

          <p className="mt-3 text-xs text-ink-muted">
            {t('portion.totalAmount', { grams: n(grams) })}
          </p>
        </section>

        {/* Live calculation */}
        <section className="rounded-card border border-mint bg-mint p-5">
          <p className="text-sm text-ink-muted-on-mint">{t('portion.perThisPortion')}</p>
          <p className="tnum mt-1 text-3xl font-bold text-ink" aria-live="polite">
            {n(scaled.kcal)}
            <span className="ml-1.5 text-sm font-normal text-ink-muted-on-mint">
              {t('common.kcal')}
            </span>
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted-on-mint">
            <li>
              {t('macros.protein')} {n(scaled.macros.protein)} {t('common.gram')}
            </li>
            <li>
              {t('macros.carb')} {n(scaled.macros.carb)} {t('common.gram')}
            </li>
            <li>
              {t('macros.fat')} {n(scaled.macros.fat)} {t('common.gram')}
            </li>
          </ul>
        </section>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => void confirm()}
          iconStart={<Check aria-hidden="true" className="h-5 w-5" />}
        >
          {t('portion.confirm', { amount, unit, kcal: n(scaled.kcal) })}
        </Button>

        <Notice tone="info">{t('portion.hint')}</Notice>
      </div>
    </div>
  )
}
