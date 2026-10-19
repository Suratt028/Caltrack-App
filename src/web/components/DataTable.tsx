import { t } from '../i18n'
import { n } from '../i18n/format'
import { formatThaiShortDate } from '../i18n/format'
import type { DayNutrition } from '../types'

/**
 * Semantic data table — the accessible alternative to the trend charts
 * (spec §6.6, §8). Each cell prints its value; the "today" row is labelled.
 */
export function DataTable({
  days,
  goalKcal,
  todayIso,
}: {
  days: DayNutrition[]
  goalKcal: number | null
  todayIso: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <caption className="mb-3 text-left text-sm font-semibold text-ink">
          {goalKcal != null
            ? t('trends.tableTitle', { kcal: n(goalKcal) })
            : t('trends.title')}
        </caption>
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-muted">
            <th scope="col" className="py-2 pr-3 font-medium">
              {t('trends.colDate')}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {t('trends.colEnergy')}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {t('trends.colProtein')}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {t('trends.colCarb')}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {t('trends.colFat')}
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const isToday = day.date === todayIso
            return (
              <tr key={day.date} className="border-b border-line/60 last:border-0">
                <th scope="row" className="py-2 pr-3 text-left font-normal text-ink">
                  {isToday
                    ? t('trends.todayRow', { date: formatThaiShortDate(day.date) })
                    : formatThaiShortDate(day.date)}
                </th>
                <td className="tnum py-2 pr-3 text-right font-semibold text-ink">
                  {n(day.kcal)}
                </td>
                <td className="tnum py-2 pr-3 text-right text-ink-muted">
                  {n(day.macros.protein)}
                </td>
                <td className="tnum py-2 pr-3 text-right text-ink-muted">
                  {n(day.macros.carb)}
                </td>
                <td className="tnum py-2 text-right text-ink-muted">{n(day.macros.fat)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
