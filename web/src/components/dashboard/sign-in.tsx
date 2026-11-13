import { useState, type FormEvent } from 'react'
import { CircleAlert, Eye, EyeOff, Leaf, LoaderCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, type SessionUser } from '@/lib/api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Props = {
  onSignedIn: (user: SessionUser) => void
  onDemo: () => void
  notice?: string
}

export function SignIn({ onSignedIn, onDemo, notice }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const emailError = touched && email.trim() && !EMAIL_PATTERN.test(email.trim()) ? 'รูปแบบอีเมลยังไม่ถูกต้อง เช่น name@example.com' : ''
  const canSubmit = EMAIL_PATTERN.test(email.trim()) && password.length >= 6 && !submitting

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      onSignedIn(await login(email.trim().toLowerCase(), password))
    } catch (e) {
      setError((e as Error).message)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CalTrack</h1>
            <p className="text-sm text-muted-foreground">ดูภาพรวมการกินของคุณบนจอใหญ่</p>
          </div>
        </div>

        <Card>
          <form onSubmit={submit} noValidate>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">เข้าสู่ระบบ</CardTitle>
              <CardDescription>ใช้บัญชีเดียวกับแอป CalTrack บนมือถือ</CardDescription>
            </CardHeader>
            <CardContent className="mt-5 space-y-4">
              {notice && !error && (
                <Alert>
                  <CircleAlert aria-hidden />
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive" aria-live="assertive">
                  <CircleAlert aria-hidden />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  autoFocus
                />
                {emailError && <p id="email-error" className="text-sm text-destructive">{emailError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="h-11 pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0.5 right-0.5 size-10"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-6 flex-col gap-2 border-t-0 bg-transparent">
              <Button type="submit" size="lg" className="h-11 w-full" disabled={!canSubmit} aria-busy={submitting}>
                {submitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                เข้าสู่ระบบ
              </Button>
              <Button type="button" variant="ghost" className="h-11 w-full text-muted-foreground" onClick={onDemo}>
                ดูตัวอย่างด้วยข้อมูลจำลอง
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          ยังไม่มีบัญชี? สมัครได้ในแอป CalTrack บนมือถือ
        </p>
      </div>
    </main>
  )
}
