import { Coffee, Cookie, Plus, Soup, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { t } from '../i18n'
import { n } from '../i18n/format'
import type { FoodLogEntry, MealId } from '../types'

export const MEAL_ICON: Record<MealId, LucideIcon> = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  dinner: Soup,
  snack: Cookie,
}

export const MEAL_LABEL_KEY: Record<MealId, string> = {
  breakfast: 'meals.breakfast',
  lunch: 'meals.lunch',
  dinner: 'meals.dinner',
  snack: 'meals.snack',
}

/** "1 จาน · โปรตีน 32 / คาร์บ 72 / ไขมัน 16 กรัม" */
export function servingLine(entry: FoodLogEntry): string {
  const amount = Number.isInteger(entry.amount) ? String(entry.amount) : String(entry.amount)
  return `${amount} ${entry.unit}`
}

export function macroLine(entry: FoodLogEntry): string {
  return `${t('macros.protein')} ${n(entry.macros.protein)} / ${t('macros.carb')} ${n(
    entry.macros.carb,
  )} / ${t('macros.fat')} ${n(entry.macros.fat)} ${t('common.gram')}`
}

/** A single logged food entry, styled as a card row. */
export function MealCard({
  entry,
  showMacros = false,
}: {
  entry: FoodLogEntry
  showMacros?: boolean
}) {
  const Icon = MEAL_ICON[entry.meal]
  return (
    <li className="flex items-center gap-3 rounded-card border border-line/70 bg-card p-3.5 shadow-soft">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint text-brand">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink-muted">
          {t(MEAL_LABEL_KEY[entry.meal])}
          {entry.time ? ` · ${entry.time}` : ''}
        </p>
        <p className="truncate text-[15px] font-semibold text-ink">{entry.name}</p>
        <p className="truncate text-xs text-ink-muted">
          {servingLine(entry)}
          {showMacros ? (
            <span className="hidden sm:inline"> · {macroLine(entry)}</span>
          ) : null}
        </p>
      </div>
      <p className="tnum shrink-0 text-right text-lg font-semibold text-ink">
        {n(entry.kcal)}
        <span className="ml-1 text-xs font-normal text-ink-muted">{t('common.kcal')}</span>
      </p>
    </li>
  )
}

/** The outlined "no entries yet" placeholder for a meal, with an add button. */
export function MealEmptyCard({ onAdd, label }: { onAdd?: () => void; label?: string }) {
  return (
    <li className="flex items-center gap-3 rounded-card border border-dashed border-line bg-transparent p-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint/60 text-brand">
        <Plus aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="min-w-0 flex-1 text-sm text-ink-muted">
        {label ?? t('meals.empty')}
      </p>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          aria-label={`${t('home.logFood')} · ${label ?? ''}`.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-icon border border-line text-brand transition-colors hover:bg-mint"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
        </button>
      ) : null}
    </li>
  )
}
