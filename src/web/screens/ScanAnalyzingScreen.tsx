import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { t, th } from '../i18n'
import { aiEstimator } from '../data/repositories'
import { useAppState } from '../state/app-state'
import { Button } from '../components/Button'
import { FoodPhoto } from '../components/FoodPhoto'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'

export function ScanAnalyzingScreen() {
  const navigate = useNavigate()
  const { scanImage, setAiEstimate } = useAppState()
  const startedRef = useRef(false)

  useEffect(() => {
    // Opened without a photo (e.g. a stale tab) → back to capture.
    if (!scanImage) {
      navigate('/scan', { replace: true })
      return
    }

    // Guard against StrictMode double-invoke so we only estimate once.
    if (startedRef.current) return
    startedRef.current = true

    let cancelled = false

    aiEstimator
      .estimate(scanImage)
      .then((estimate) => {
        if (cancelled) return
        setAiEstimate(estimate)
        navigate('/scan/review')
      })
      .catch(() => {
        if (cancelled) return
        navigate('/scan/recovery')
      })

    return () => {
      cancelled = true
    }
  }, [navigate, scanImage, setAiEstimate])

  return (
    <div className="mx-auto max-w-2xl">
      <ScreenHeader
        title={t('scan.analyzingTitle')}
        subtitle={t('scan.captureSubtitle')}
        backTo="/scan"
      />

      <div className="app-card overflow-hidden">
        <div className="h-44 w-full sm:h-56">
          {scanImage ? (
            <img
              src={scanImage.dataUrl}
              alt={t('scan.imageAlt')}
              className="h-full w-full object-cover"
            />
          ) : (
            <FoodPhoto alt={t('scan.imageAlt')} />
          )}
        </div>
        <p className="border-b border-line px-4 py-2 text-xs text-ink-muted">
          {t('scan.imageCaption')}
        </p>
        <div className="flex flex-col items-center px-5 py-8 text-center" aria-live="polite">
          <Loader2 aria-hidden="true" className="ct-spinner h-10 w-10 text-brand" />
          <p className="mt-4 text-base font-semibold text-ink">{t('scan.analyzingBody')}</p>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">{t('scan.analyzingNote')}</p>
        </div>
      </div>

      <div className="mt-4">
        <Notice tone="mint">{t('scan.analyzingDisclaimer')}</Notice>
      </div>

      <Button
        variant="outline"
        fullWidth
        className="mt-4"
        onClick={() => navigate('/scan')}
      >
        {t('scan.analyzingCancel')}
      </Button>

      <p className="mt-3 text-xs text-ink-muted">{t('scan.analyzingFooterNote')}</p>
    </div>
  )
}
