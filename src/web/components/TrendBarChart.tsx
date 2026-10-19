import { useId } from 'react'
import { dayNumber } from '../i18n/format'

export interface BarDatum {
  date: string
  value: number
  /** Highlight the "today" bar in brand green. */
  highlight?: boolean
}

/** Round a value up to a friendly axis maximum (nearest 500 for kcal-scale data). */
export function niceMax(values: number[], step = 500): number {
  const max = Math.max(0, ...values)
  if (max <= 0) return step
  return Math.ceil(max / step) * step
}

const VB_W = 720
const VB_H = 320
const PAD = { top: 28, right: 16, bottom: 44, left: 56 }

/**
 * Vertical bar chart (SVG) with a goal reference line, per-bar value/date
 * labels, an axis in the given unit, `role="img"` + `<title>`/`<desc>` and a
 * visually-hidden data table as the accessible alternative (spec §6.5, §8).
 */
export function TrendBarChart({
  data,
  goalValue,
  goalLabel,
  axisUnit,
  ariaTitle,
  ariaDesc,
  caption,
  valueFormatter = (v) => String(v),
  dateFormatter = dayNumber,
  axisStep = 500,
}: {
  data: BarDatum[]
  goalValue?: number
  goalLabel?: string
  axisUnit: string
  ariaTitle: string
  ariaDesc: string
  caption?: string
  valueFormatter?: (value: number) => string
  dateFormatter?: (date: string) => string
  axisStep?: number
}) {
  const titleId = useId()
  const descId = useId()
  const values = data.map((d) => d.value)
  const maxY =
    goalValue != null ? niceMax([...values, goalValue], axisStep) : niceMax(values, axisStep)

  const plotW = VB_W - PAD.left - PAD.right
  const plotH = VB_H - PAD.top - PAD.bottom
  const slot = plotW / Math.max(1, data.length)
  const barW = Math.min(46, slot * 0.52)

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

        {/* gridlines + y tick labels */}
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
              {valueFormatter(tick)}
            </text>
          </g>
        ))}

        {/* axis unit hint */}
        <text x={PAD.left - 10} y={PAD.top - 12} textAnchor="end" fontSize={11} fill="var(--text-muted)">
          {axisUnit}
        </text>

        {/* bars */}
        {data.map((datum, i) => {
          const cx = PAD.left + slot * i + slot / 2
          const barH = Math.max(2, PAD.top + plotH - y(datum.value))
          const color = datum.highlight ? 'var(--brand)' : 'var(--bar-past)'
          return (
            <g key={datum.date}>
              <rect
                x={cx - barW / 2}
                y={y(datum.value)}
                width={barW}
                height={barH}
                rx={8}
                fill={color}
              />
              <text
                x={cx}
                y={y(datum.value) - 8}
                textAnchor="middle"
                className="tnum"
                fontSize={12}
                fontWeight={600}
                fill="var(--text)"
              >
                {valueFormatter(datum.value)}
              </text>
              <text
                x={cx}
                y={VB_H - PAD.bottom + 20}
                textAnchor="middle"
                className="tnum"
                fontSize={12}
                fill="var(--text-muted)"
              >
                {dateFormatter(datum.date)}
              </text>
            </g>
          )
        })}

        {/* goal reference line */}
        {goalValue != null && goalValue <= maxY ? (
          <g>
            <line
              x1={PAD.left}
              x2={VB_W - PAD.right}
              y1={y(goalValue)}
              y2={y(goalValue)}
              stroke="var(--carb)"
              strokeWidth={1.5}
              strokeDasharray="6 5"
            />
            {goalLabel ? (
              <text
                x={VB_W - PAD.right}
                y={y(goalValue) - 6}
                textAnchor="end"
                fontSize={11}
                fill="var(--carb-strong)"
              >
                {goalLabel}
              </text>
            ) : null}
          </g>
        ) : null}
      </svg>

      {caption ? <figcaption className="mt-2 text-xs text-ink-muted">{caption}</figcaption> : null}

      {/* Accessible alternative to the graphic */}
      <table className="sr-only">
        <caption>{ariaTitle}</caption>
        <thead>
          <tr>
            <th scope="col">วันที่</th>
            <th scope="col">{axisUnit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.date}>
              <th scope="row">{dateFormatter(datum.date)}</th>
              <td>{valueFormatter(datum.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
