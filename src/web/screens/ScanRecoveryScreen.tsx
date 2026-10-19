import { useNavigate } from 'react-router-dom'
import { ImageOff, Lightbulb, Pencil, RefreshCw, Search } from 'lucide-react'
import { t, th } from '../i18n'
import { Button, LinkButton } from '../components/Button'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'

export function ScanRecoveryScreen() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-2xl">
      <ScreenHeader title={t('scan.recoveryTitle')} backTo="/scan" />

      <section className="app-card flex flex-col items-center px-6 py-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mint text-brand">
          <ImageOff aria-hidden="true" className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink">{t('scan.recoveryTitle')}</h2>
        <p className="mt-2 max-w-md text-sm text-ink-muted">{t('scan.recoveryBody')}</p>
      </section>

      <div className="mt-4 grid gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate('/scan/analyzing')}
          iconStart={<RefreshCw aria-hidden="true" className="h-5 w-5" />}
        >
          {t('scan.retrySame')}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => navigate('/scan')}
          iconStart={<Pencil aria-hidden="true" className="h-5 w-5" />}
        >
          {t('scan.pickAnother')}
        </Button>
        <LinkButton
          to="/log"
          variant="outline"
          size="lg"
          fullWidth
          iconStart={<Search aria-hidden="true" className="h-5 w-5" />}
        >
          {t('scan.searchManual')}
        </LinkButton>
      </div>

      <div className="mt-4">
        <Notice tone="mint" icon={<Lightbulb aria-hidden="true" className="h-5 w-5" />} title={t('scan.recoveryTipsTitle')}>
          <ul className="list-disc space-y-0.5 pl-4">
            {th.scan.recoveryTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="mt-1 text-xs">{t('scan.recoveryTipsNote')}</p>
        </Notice>
      </div>
    </div>
  )
}
