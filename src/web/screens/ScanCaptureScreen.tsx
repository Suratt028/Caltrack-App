import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ImageIcon, Lightbulb } from 'lucide-react'
import { t, th } from '../i18n'
import { useAppState } from '../state/app-state'
import { Button } from '../components/Button'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'

/** The AI endpoint accepts JPEG / PNG / WEBP only. */
const SUPPORTED_IMAGE = /^image\/(jpeg|png|webp)$/i

export function ScanCaptureScreen() {
  const navigate = useNavigate()
  const { setScanImage } = useAppState()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const [unsupported, setUnsupported] = useState(false)

  const pick = (file: File | null | undefined) => {
    if (!file) return
    if (!SUPPORTED_IMAGE.test(file.type)) {
      setUnsupported(true)
      return
    }
    setUnsupported(false)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      if (!dataUrl) {
        setUnsupported(true)
        return
      }
      setScanImage({ dataUrl, mimeType: file.type.toLowerCase() })
      navigate('/scan/analyzing')
    }
    reader.onerror = () => setUnsupported(true)
    reader.readAsDataURL(file)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ScreenHeader
        title={t('scan.captureTitle')}
        subtitle={t('scan.captureSubtitle')}
        backTo="/"
      />

      {/* Camera frame */}
      <div
        role="img"
        aria-label={t('scan.frameAria')}
        className="relative flex aspect-[4/3] w-full flex-col items-center justify-center rounded-card bg-brand-deep p-4 text-center"
      >
        <span className="absolute inset-4 rounded-2xl border-2 border-white/30" />
        <Camera aria-hidden="true" className="h-12 w-12 text-white/90" />
        <p className="mt-3 text-base font-semibold text-white">{t('scan.frameHint')}</p>
        <p className="mt-1 text-xs text-white/70">{t('scan.frameCaption')}</p>
      </div>

      {/* Tips */}
      <div className="mt-4">
        <Notice tone="mint" icon={<Lightbulb aria-hidden="true" className="h-5 w-5" />} title={t('scan.tipsTitle')}>
          <ul className="list-disc space-y-0.5 pl-4">
            {th.scan.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </Notice>
      </div>

      {/* Real file inputs — the browser asks for camera/gallery access itself. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        aria-label={t('scan.openCamera')}
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={t('scan.pickImage')}
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => cameraInputRef.current?.click()}
          iconStart={<Camera aria-hidden="true" className="h-5 w-5" />}
        >
          {t('scan.openCamera')}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => libraryInputRef.current?.click()}
          iconStart={<ImageIcon aria-hidden="true" className="h-5 w-5" />}
        >
          {t('scan.pickImage')}
        </Button>
      </div>

      <p className="mt-4 text-xs text-ink-muted">{t('scan.captureNote')}</p>

      {unsupported ? (
        <div className="mt-4">
          <Notice tone="warn">
            <p role="alert">{t('scan.unsupportedImage')}</p>
          </Notice>
        </div>
      ) : null}
    </div>
  )
}
