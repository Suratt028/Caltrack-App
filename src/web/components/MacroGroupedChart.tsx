import { useId } from 'react'
import { dayNumber } from '../i18n/format'
import { n } from '../i18n/format'
import { t } from '../i18n'
import { MACRO_VAR, type MacroKind } from './MacroBar'
import { niceMax } from './TrendBarChart'
import type { Macros } from '../types'

export interface MacroDay {
  date: string
  macros: Macros
}

const SERIES: { kind: MacroKind; labelKey: string }[] = [
  { kind: 'protein', labelKey: 'macros.protein' },
  { kind: 'carb', labelKey: 'macros.carb' },
  { kind: 'fat', labelKey: 'macros.fat' },
]

const VB_W = 720
const VB_H = 300
const PAD = { top: 24, right: 16, bottom: 40, left: 56 }

/**
 * Grouped bar chart comparing protein / carb / fat (in grams) per day.
 * A visible legend plus the accessible table ensure meaning never relies on
 * colour alone (spec §8).
 */
export function MacroGroupedChart({
  data,
  ariaTitle,
  ariaDesc,
  axisUnit,
  axisStep = 125,
}: {
  data: MacroDay[]
  ariaTitle: string
  ariaDesc: string
  axisUnit: string
  axisStep?: number
}) {
  const titleId = useId()
  const descId = useId()

  const allValues = data.flatMap((d) => [d.macros.protein, d.macros.carb, d.macros.fat])
  const maxY = niceMax(allValues, axisStep)

  const plotW = VB_W - PAD.left - PAD.right
  const plotH = VB_H - PAD.top - PAD.bottom
  const slot = plotW / Math.max(1, data.length)
  const groupW = Math.min(60, slot * 0.7)
  const barW = groupW / 3 - 2

  const y = (value: number) => PAD.top + plotH - (value / maxY) * plotH
  const ticks = [0, maxY / 2, maxY]

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby={titleId}
        aria-describedby={descId}
        preserveAspectRatio="xMidYMid meet"
      >
        <title id={titleId}>{ariaTitle}</title>
        <desc id={descId}>{ariaDesc}</desc>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={VB_W - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 10}
              y={y(tick) + 4}
              textAnchor="end"
              className="tnum"
              fontSize={12}
              fill="var(--text-muted)"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}
        <text x={PAD.left - 10} y={PAD.top - 8} textAnchor="end" fontSize={11} fill="var(--text-muted)">
          {axisUnit}
        </text>

        {data.map((day, i) => {
          const startX = PAD.left + slot * i + (slot - groupW) / 2
          return (
            <g key={day.date}>
              {SERIES.map((series, s) => {
                const value = day.macros[series.kind]
                const bx = startX + s * (barW + 2)
                return (
                  <rect
                    key={series.kind}
                    x={bx}
                    y={y(value)}
                    width={barW}
                    height={Math.max(2, PAD.top + plotH - y(value))}
                    rx={4}
                    fill={MACRO_VAR[series.kind]}
                  />
                )
              })}
              <text
                x={startX + groupW / 2}
                y={VB_H - PAD.bottom + 18}
                textAnchor="middle"
                className="tnum"
                fontSize={12}
                fill="var(--text-muted)"
              >
                {dayNumber(day.date)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend — labels so colour is never the only cue */}
      <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {SERIES.map((series) => (
          <li key={series.kind} className="inline-flex items-center gap-2 text-ink-muted">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: MACRO_VAR[series.kind] }}
            />
            {t(series.labelKey)}
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>{ariaTitle}</caption>
        <thead>
          <tr>
            <th scope="col">วันที่</th>
            {SERIES.map((s) => (
              <th key={s.kind} scope="col">
                {t(s.labelKey)} ({axisUnit})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.date}>
              <th scope="row">{dayNumber(day.date)}</th>
              <td>{n(day.macros.protein)}</td>
              <td>{n(day.macros.carb)}</td>
              <td>{n(day.macros.fat)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
