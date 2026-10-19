import type { ReactNode } from 'react'

/**
 * Circular energy-progress ring.
 *
 * Accessibility (spec §8): rendered as `role="progressbar"` with
 * `aria-valuenow/min/max`; callers pass a human-readable `ariaLabel`
 * (e.g. "ทานแล้ว 1,000 จาก 2,000 กิโลแคลอรี").
 */
export function EnergyRing({
  percent,
  ariaLabel,
  size = 168,
  stroke = 14,
  children,
  className = '',
}: {
  /** 0–100, already clamped. */
  percent: number
  ariaLabel: string
  size?: number
  stroke?: number
  children?: ReactNode
  className?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, percent))
  const dash = (clamped / 100) * circumference

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--mint)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}
