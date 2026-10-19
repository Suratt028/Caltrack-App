import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Loader2, LogOut, Sprout, Trash2 } from 'lucide-react'
import { t } from '../i18n'
import { n } from '../i18n/format'
import { GOAL_PRESETS } from '../data/constants'
import { useAppState } from '../state/app-state'
import { useAuth } from '../auth/auth-context'
import type { NutritionGoal } from '../types'
import { Button, LinkButton } from '../components/Button'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'

function goalEquals(a: NutritionGoal | null, b: NutritionGoal): boolean {
  return (
    !!a &&
    a.kcal === b.kcal &&
    a.macros.protein === b.macros.protein &&
    a.macros.carb === b.macros.carb &&
    a.macros.fat === b.macros.fat
  )
}

export function ProfileScreen() {
  const { profile, saveProfile } = useAppState()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setLocalName] = useState(profile.name)
  const [selected, setSelected] = useState<NutritionGoal | null>(profile.goal)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep the form in sync if the goal/name changes elsewhere (or finishes loading).
  useEffect(() => {
    setSelected(profile.goal)
  }, [profile.goal])

  useEffect(() => {
    setLocalName(profile.name)
  }, [profile.name])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await saveProfile({ name: name.trim() || profile.name, goal: selected })
      setSaved(true)
    } catch (caught) {
      setError((caught as Error).message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ScreenHeader title={t('profile.title')} subtitle={t('profile.subtitle')} backTo="/" />

      {/* Name */}
      <section className="app-card mb-4 p-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-ink-muted">{t('profile.nameField')}</span>
          <input
            value={name}
            onChange={(e) => {
              setLocalName(e.target.value)
              setSaved(false)
            }}
            className="min-h-[48px] rounded-input border border-line bg-surface px-3 text-sm font-medium text-ink"
          />
        </label>
      </section>

      {/* Goal */}
      <section className="app-card mb-4 p-5">
        <h2 className="text-base font-semibold text-ink">{t('profile.goalSection')}</h2>

        {selected ? (
          <div className="mt-3 rounded-card border border-mint bg-mint p-4">
            <p className="text-xs text-ink-muted-on-mint">{t('profile.goalKcalLabel')}</p>
            <p className="tnum text-2xl font-bold text-ink">
              {n(selected.kcal)}
              <span className="ml-1.5 text-sm font-normal text-ink-muted-on-mint">
                {t('common.kcal')}
              </span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted-on-mint">
              <li>
                {t('profile.goalProteinLabel')} {n(selected.macros.protein)}
              </li>
              <li>
                {t('profile.goalCarbLabel')} {n(selected.macros.carb)}
              </li>
              <li>
                {t('profile.goalFatLabel')} {n(selected.macros.fat)}
              </li>
            </ul>
          </div>
        ) : (
          <div className="mt-3 flex items-start gap-3 rounded-card border border-line bg-surface p-4">
            <Sprout aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-brand" />
            <div>
              <p className="font-semibold text-ink">{t('profile.goalPlaceholderTitle')}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{t('profile.goalPlaceholderBody')}</p>
            </div>
          </div>
        )}

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs text-ink-muted">{t('profile.chooseGoal')}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {GOAL_PRESETS.map((preset) => {
              const active = goalEquals(selected, preset)
              return (
                <button
                  key={preset.kcal}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelected(preset)
                    setSaved(false)
                  }}
                  className={`flex items-center justify-between rounded-btn border px-4 py-3 text-left transition-colors ${
                    active
                      ? 'border-brand bg-mint'
                      : 'border-line bg-card hover:border-brand/50'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {n(preset.kcal)} {t('common.kcal')}
                    </span>
                    <span className="tnum block text-xs text-ink-muted">
                      P{n(preset.macros.protein)} · C{n(preset.macros.carb)} · F
                      {n(preset.macros.fat)}
                    </span>
                  </span>
                  {active ? (
                    <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-brand" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => void save()}
            disabled={saving || (!selected && profile.goal == null)}
            iconStart={saving ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : undefined}
          >
            {t('profile.saveGoal')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelected(null)
              setSaved(false)
            }}
            iconStart={<Trash2 aria-hidden="true" className="h-4 w-4" />}
          >
            {t('profile.clearGoal')}
          </Button>
        </div>

        {saved ? (
          <div className="mt-3">
            <Notice tone="mint" icon={<Check aria-hidden="true" className="h-5 w-5" />}>
              {t('profile.saved')}
            </Notice>
          </div>
        ) : null}

        {error ? (
          <div className="mt-3">
            <Notice tone="warn">
              <p role="alert">{error}</p>
            </Notice>
          </div>
        ) : null}

        <p className="mt-3 text-xs text-ink-muted">{t('profile.note')}</p>
      </section>

      {/* Account */}
      <section className="app-card mb-4 p-5">
        <p className="text-xs text-ink-muted">{t('profile.accountSection')}</p>
        <p className="mt-1 text-sm font-medium text-ink">{user?.email ?? '—'}</p>
        <Button
          variant="outline"
          className="mt-4"
          fullWidth
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
          iconStart={<LogOut aria-hidden="true" className="h-4 w-4" />}
        >
          {t('profile.logout')}
        </Button>
      </section>

      <LinkButton to="/" variant="outline" fullWidth>
        {t('nav.home')}
      </LinkButton>
    </div>
  )
}
