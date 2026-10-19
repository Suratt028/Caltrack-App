import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'md' | 'lg' | 'sm'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-deep active:bg-brand-deep shadow-soft',
  secondary: 'bg-mint text-brand-deep hover:brightness-[0.97] active:brightness-95',
  outline:
    'bg-card text-ink border border-line hover:border-brand/50 hover:bg-surface active:bg-mint/60',
  ghost: 'bg-transparent text-brand hover:bg-mint/60 active:bg-mint',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-[40px] px-3.5 text-sm',
  md: 'min-h-[48px] px-5 text-[15px]',
  lg: 'min-h-[52px] px-6 text-base',
}

/** Shared button styling so `<Link>` elements can look like buttons too. */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  className?: string
} = {}): string {
  return `inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    variants[variant]
  } ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`
}

/**
 * Cross-app button with clear press feedback and a ≥44–48px touch target
 * (spec §8). Renders a semantic `<button>`.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconStart,
  iconEnd,
  className = '',
  children,
  ...rest
}: {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  iconStart?: ReactNode
  iconEnd?: ReactNode
  className?: string
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={buttonClass({ variant, size, fullWidth, className })}
      {...rest}
    >
      {iconStart}
      <span className="truncate">{children}</span>
      {iconEnd}
    </button>
  )
}

/** Compact icon-only button that still meets the minimum touch target. */
export function IconButton({
  label,
  className = '',
  children,
  ...rest
}: { label: string; className?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-icon text-ink transition-colors hover:bg-mint focus-visible:bg-mint active:bg-mint ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/**
 * A router `<Link>` styled as a button — used where navigation should be a real
 * link (not a button nested inside an anchor).
 */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconStart,
  iconEnd,
  className = '',
  children,
  ...rest
}: {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  iconStart?: ReactNode
  iconEnd?: ReactNode
  className?: string
  children: ReactNode
} & LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>) {
  return (
    <Link className={buttonClass({ variant, size, fullWidth, className })} {...rest}>
      {iconStart}
      <span className="truncate">{children}</span>
      {iconEnd}
    </Link>
  )
}
