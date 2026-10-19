import { t } from '../i18n'
import { n } from '../i18n/format'
import type { Macros } from '../types'

export type MacroKind = keyof Macros

export const MACRO_VAR: Record<MacroKind, string> = {
  protein: 'var(--protein)',
  carb: 'var(--carb)',
  fat: 'var(--fat)',
}

export const MACRO_LABEL_KEY: Record<MacroKind, string> = {
  protein: 'macros.protein',
  carb: 'macros.carb',
  fat: 'macros.fat',
}

/**
 * One macronutrient: label, `consumed/goal` value and a progress bar tinted with
 * the macro's accent colour. When there is no goal we show the value only and
 * never a divide-by-zero bar (spec §7.3).
 */
export function MacroBar({
  kind,
  consumed,
  goal,
  size = 'md',
}: {
  kind: MacroKind
  consumed: number
  goal: number | null
  size?: 'sm' | 'md'
}) {
  const hasGoal = typeof goal === 'number' && Number.isFinite(goal) && goal > 0
  const percent = hasGoal ? Math.min(100, Math.max(0, (consumed / goal) * 100)) : 0

  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-ink-muted">{t(MACRO_LABEL_KEY[kind])}</p>
      <p className={`tnum mt-0.5 font-semibold text-ink ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
        {n(consumed)}
        <span className="text-ink-muted">/{hasGoal ? n(goal) : '—'}</span>
        <span className="ml-0.5 text-xs font-normal text-ink-muted">{t('common.gram')}</span>
      </p>
      <span
        className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-mint"
        role="img"
        aria-label={
          hasGoal
            ? `${t(MACRO_LABEL_KEY[kind])} ${n(consumed)} จาก ${n(goal)} ${t('common.gram')}`
            : `${t(MACRO_LABEL_KEY[kind])} ${n(consumed)} ${t('common.gram')}`
        }
      >
        <span
          className="block h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percent}%`, backgroundColor: MACRO_VAR[kind] }}
        />
      </span>
    </div>
  )
}
