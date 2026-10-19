/**
 * Pill segmented control used for meal selection and trends ranges.
 * Implemented with radio semantics for screen readers.
 */
export interface SegmentOption<T extends string> {
  value: T
  label: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex w-full gap-1 rounded-btn bg-mint p-1 ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-[11px] font-medium transition-colors ${
              size === 'sm' ? 'min-h-[36px] px-2 text-xs' : 'min-h-[40px] px-3 text-sm'
            } ${
              selected
                ? 'bg-card text-brand-deep shadow-soft'
                : 'text-ink-muted hover:bg-card/60'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
