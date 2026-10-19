import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Info, Loader2, Pencil } from 'lucide-react'
import { t } from '../i18n'
import { n } from '../i18n/format'
import { PORTION_UNITS } from '../data/constants'
import { useAppState } from '../state/app-state'
import { todayIso } from '../lib/date'
import type { MealId } from '../types'
import { portionGrams, scalePortion } from '../lib/nutrition'
import { Button } from '../components/Button'
import { FoodPhoto } from '../components/FoodPhoto'
import { Notice } from '../components/Notice'
import { PortionStepper } from '../components/PortionStepper'
import { ScreenHeader } from '../components/ScreenHeader'

const MEAL_OPTIONS: { value: MealId; labelKey: string }[] = [
  { value: 'breakfast', labelKey: 'meals.breakfast' },
  { value: 'lunch', labelKey: 'meals.lunch' },
  { value: 'dinner', labelKey: 'meals.dinner' },
  { value: 'snack', labelKey: 'meals.snack' },
]

/** Stepper feel depends on the unit: grams step by 10, portions by 0.5. */
const STEPPER_BY_UNIT: Record<string, { step: number; min: number; max: number }> = {
  กรัม: { step: 10, min: 10, max: 2000 },
}

export function ScanReviewScreen() {
  const navigate = useNavigate()
  const { aiEstimate, scanImage, addEntry } = useAppState()
  const base = aiEstimate

  // Initialise straight from the estimate when it is already available (avoids a
  // one-frame flash of empty fields), then keep in sync if it ever changes.
  const [name, setName] = useState(() => base?.name ?? '')
  const [amount, setAmount] = useState(() => base?.amount ?? 1)
  const [unit, setUnit] = useState(() => base?.unit ?? 'จาน')
  const [meal, setMeal] = useState<MealId>('lunch')
  const [saving, setSaving] = useState(false)

  // Populate the editable fields once the estimate arrives.
  useEffect(() => {
    if (!base) return
    setName(base.name)
    setAmount(base.amount)
    setUnit(base.unit)
  }, [base])

  // Deep-link / refresh without an estimate → back to capture (spec §7.7:
  // nothing is ever saved before this screen is reached with real data).
  useEffect(() => {
    if (!base) navigate('/scan', { replace: true })
  }, [base, navigate])

  if (!base) return null

  const scaled = scalePortion(base, amount)
  const grams = portionGrams(base.grams, amount)

  const confirm = async () => {
    // Never auto-saves before this explicit confirmation (spec §7.7).
    setSaving(true)
    try {
      await addEntry({
        id: `log-${Date.now()}`,
        date: todayIso(),
        meal,
        name: name.trim() || base.name,
        amount,
        unit,
        grams,
        kcal: scaled.kcal,
        macros: scaled.macros,
      })
      navigate('/')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ScreenHeader title={t('scan.reviewTitle')} subtitle={t('scan.reviewSubtitle')} backTo="/scan" />

      {/* AI uncertainty notice */}
      <div className="mb-4">
        <Notice tone="warn" icon={<Info aria-hidden="true" className="h-5 w-5" />}>
          {t('scan.reviewNotice')}
        </Notice>
      </div>

      <div className="grid gap-4">
        <section className="app-card overflow-hidden">
          <div className="h-40 w-full sm:h-48">
            {scanImage ? (
              <img
                src={scanImage.dataUrl}
                alt={t('scan.imageAlt')}
                className="h-full w-full object-cover"
              />
            ) : (
              <FoodPhoto alt={t('scan.imageAlt')} />
            )}
          </div>
        </section>

        {/* Editable fields */}
        <section className="app-card p-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-ink-muted">{t('scan.fieldName')}</span>
            <span className="relative">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[48px] w-full rounded-input border border-line bg-surface px-3 pr-11 text-sm font-medium text-ink"
              />
              <Pencil
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              />
            </span>
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-ink-muted">{t('scan.fieldAmount')}</p>
              <PortionStepper
                amount={amount}
                onChange={setAmount}
                unit={unit}
                {...(STEPPER_BY_UNIT[unit] ?? {})}
              />
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-ink-muted">{t('scan.fieldUnit')}</span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="min-h-[48px] rounded-input border border-line bg-surface px-3 text-sm font-medium text-ink"
              >
                {PORTION_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-1 text-sm">
            <span className="text-xs text-ink-muted">{t('scan.fieldMeal')}</span>
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
        </section>

        {/* Live estimate */}
        <section className="rounded-card border border-mint bg-mint p-5" aria-live="polite">
          <p className="text-sm text-ink-muted-on-mint">
            {t('scan.estimateCardTitle', { grams: n(grams) })}
          </p>
          <p className="tnum mt-1 text-3xl font-bold text-ink">
            {n(scaled.kcal)}
            <span className="ml-1.5 text-sm font-normal text-ink-muted-on-mint">
              {t('common.kcal')}
            </span>
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted-on-mint">
            <li>P {n(scaled.macros.protein)}</li>
            <li>C {n(scaled.macros.carb)}</li>
            <li>F {n(scaled.macros.fat)}</li>
          </ul>
          <p className="mt-2 text-xs text-ink-muted-on-mint">
            {t('scan.estimateCalcNote', { unit: base.unit, kcal: n(base.kcal) })}
          </p>
        </section>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => void confirm()}
          disabled={saving}
          iconStart={
            saving ? (
              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
            ) : (
              <Check aria-hidden="true" className="h-5 w-5" />
            )
          }
        >
          {t('scan.reviewConfirm', { kcal: n(scaled.kcal) })}
        </Button>

        <p className="text-xs text-ink-muted">{t('scan.reviewNote')}</p>
      </div>
    </div>
  )
}
