import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { t } from '../i18n'

/**
 * Portion amount stepper with an editable number field (spec §6.9).
 * −/+ adjust by `step`; the number can also be typed directly.
 */
export function PortionStepper({
  amount,
  onChange,
  step = 0.5,
  min = 0.5,
  max = 20,
  unit,
}: {
  amount: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  unit: string
}) {
  const [draft, setDraft] = useState(String(amount))

  useEffect(() => {
    setDraft(String(amount))
  }, [amount])

  const clamp = (value: number) => Math.min(max, Math.max(min, value))

  const commit = (raw: string) => {
    const parsed = Number(raw.replace(',', '.'))
    const next = Number.isFinite(parsed) ? clamp(parsed) : amount
    onChange(next)
    setDraft(String(next))
  }

  const stepBy = (delta: number) => {
    // Avoid floating point dust like 1.2000000000000002
    const next = clamp(Math.round((amount + delta) * 100) / 100)
    onChange(next)
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-btn border border-line bg-card p-1">
      <button
        type="button"
        aria-label={t('portion.decrease')}
        onClick={() => stepBy(-step)}
        disabled={amount <= min}
        className="flex h-11 w-11 items-center justify-center rounded-[11px] text-brand transition-colors hover:bg-mint disabled:opacity-40"
      >
        <Minus aria-hidden="true" className="h-5 w-5" />
      </button>
      <label className="flex items-center">
        <span className="sr-only">{t('portion.amountField')}</span>
        <input
          value={draft}
          inputMode="decimal"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
          }}
          className="tnum w-16 rounded-[10px] bg-surface py-2 text-center text-base font-semibold text-ink focus:bg-card"
        />
      </label>
      <button
        type="button"
        aria-label={t('portion.increase')}
        onClick={() => stepBy(step)}
        disabled={amount >= max}
        className="flex h-11 w-11 items-center justify-center rounded-[11px] text-brand transition-colors hover:bg-mint disabled:opacity-40"
      >
        <Plus aria-hidden="true" className="h-5 w-5" />
      </button>
      <span className="sr-only">{unit}</span>
    </div>
  )
}

/** Unit dropdown (จาน / ถ้วย / กรัม). */
export function UnitSelect({
  value,
  options,
  onChange,
  label = t('portion.unitField'),
}: {
  value: string
  options: readonly string[]
  onChange: (unit: string) => void
  label?: string
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-sm text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] rounded-input border border-line bg-card px-3 text-sm font-medium text-ink"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
