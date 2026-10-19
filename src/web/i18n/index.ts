import { th } from './th'

/**
 * Minimal interpolation-based translator.
 * Usage: `t('home.greeting', { name: 'คุณมิน' })` → "สวัสดี คุณมิน"
 */
export function t(path: string, params?: Record<string, string | number>): string {
  const value = path
    .split('.')
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[key]
      }
      return undefined
    }, th)

  if (typeof value !== 'string') {
    // Fail loudly in dev so missing copy is noticed, quietly return the key otherwise.
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] missing string for "${path}"`)
    }
    return path
  }

  if (!params) return value
  return value.replace(/\{(\w+)\}/g, (_, token: string) =>
    token in params ? String(params[token]) : `{${token}}`,
  )
}

export { th }
