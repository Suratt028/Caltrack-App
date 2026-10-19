import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { t } from '../i18n'
import { useAuth } from '../auth/auth-context'
import { Button } from '../components/Button'
import { AuthShell } from '../components/AuthShell'
import { Notice } from '../components/Notice'

const MIN_PASSWORD_LENGTH = 6

export function RegisterScreen() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) navigate(next, { replace: true })
  }, [user, navigate, next])

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH
  const canSubmit = Boolean(displayName.trim() && email.trim() && password) && !tooShort

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register({ email, password, displayName })
      navigate(next, { replace: true })
    } catch (caught) {
      setError((caught as Error).message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link
            to={next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login'}
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            {t('auth.loginLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-ink-muted">{t('auth.nameField')}</span>
          <input
            value={displayName}
            autoComplete="name"
            required
            onChange={(e) => setDisplayName(e.target.value)}
            className="min-h-[48px] rounded-input border border-line bg-surface px-3 text-sm font-medium text-ink"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-ink-muted">{t('auth.emailField')}</span>
          <input
            type="email"
            value={email}
            autoComplete="email"
            required
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[48px] rounded-input border border-line bg-surface px-3 text-sm font-medium text-ink"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-ink-muted">{t('auth.passwordField')}</span>
          <input
            type="password"
            value={password}
            autoComplete="new-password"
            required
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-[48px] rounded-input border border-line bg-surface px-3 text-sm font-medium text-ink"
          />
          {tooShort ? (
            <span className="text-xs text-carbstrong">{t('auth.passwordHint')}</span>
          ) : null}
        </label>

        {error ? (
          <Notice tone="warn">
            <p role="alert">{error}</p>
          </Notice>
        ) : null}

        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={busy || !canSubmit}
          iconStart={busy ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : undefined}
        >
          {t('auth.registerCta')}
        </Button>
      </form>
    </AuthShell>
  )
}
