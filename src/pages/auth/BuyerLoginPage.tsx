import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES, LOGO_URL } from '@/constants'
import {
  loginBuyer,
  loginBuyerPhone,
  loginBuyerOtp,
  mapBuyerAuthResponseToUser,
  startWAVerification,
  getWAVerificationStatus,
} from '@/api/auth'
import { InternationalPhoneInput } from '@/components/common/PhoneInput'
import { formatPhoneNumber } from '@/utils/phone'

type Mode =
  | 'login-email'
  | 'login-phone-password'
  | 'login-phone-otp'
  | 'wa-verification-pending'

function parseApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as {
      response?: {
        data?: { detail?: unknown; message?: string }
        status?: number
      }
    }
    const detail = err.response?.data?.detail

    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) => item?.msg)
        .filter(Boolean)
        .join(', ')
    }

    if (err.response?.status === 401) return 'Kredensial login tidak valid'
    if (err.response?.status === 404) return 'Akun buyer tidak ditemukan'
    if (err.response?.status === 409) return 'Nomor HP atau email sudah terdaftar'
    if (err.response?.status === 429) return 'Terlalu banyak percobaan verifikasi'
    if (err.response?.status === 400) return 'Data request tidak valid'
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export default function BuyerLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()

  const [mode, setMode] = useState<Mode>('login-email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Form states
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [phonePasswordNumber, setPhonePasswordNumber] = useState('')
  const [phonePasswordPassword, setPhonePasswordPassword] = useState('')
  const [otpPhone, setOtpPhone] = useState('')

  // WA states
  const [waNonce, setWaNonce] = useState<string | null>(null)
  const [waDeeplink, setWaDeeplink] = useState<string>('')
  const [, setIsPolling] = useState(false)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    pollIntervalRef.current = null
    pollTimeoutRef.current = null
    setIsPolling(false)
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  const resetMessage = () => {
    setError(null)
    setSuccess(null)
  }

  const goHome = () => {
    setTimeout(() => {
      navigate(ROUTES.HOME, { replace: true })
    }, 1000)
  }

  const startStatusPolling = (nonce: string, loginPhoneStr: string) => {
    stopPolling()
    setIsPolling(true)

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling()
      setError(t('auth.wa_expired'))
      setMode('login-phone-otp')
    }, 300000)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getWAVerificationStatus(nonce)
        if (res.status === 'verified' && res.verify_token) {
          stopPolling()
          setLoading(true)
          try {
            const response = await loginBuyerOtp({
              phone: loginPhoneStr,
              verify_token: res.verify_token,
            })
            login(response.access_token, mapBuyerAuthResponseToUser(response))
            setSuccess(t('auth.login_success'))
            goHome()
          } catch (err) {
            setError(parseApiError(err, t('auth.error_generic')))
            setMode('login-phone-otp')
          } finally {
            setLoading(false)
          }
        } else if (res.status === 'expired' || res.status === 'failed') {
          stopPolling()
          setError(t('auth.wa_expired'))
          setMode('login-phone-otp')
        }
      } catch (err) {
        // Continue polling on error
      }
    }, 3000)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError(t('auth.error_username_password_required'))
      return
    }
    setLoading(true)
    try {
      const response = await loginBuyer({
        email: loginEmail,
        password: loginPassword,
      })
      login(response.access_token, mapBuyerAuthResponseToUser(response))
      setSuccess(t('auth.login_success'))
      goHome()
    } catch (err) {
      setError(parseApiError(err, t('auth.error_username_password_wrong')))
    } finally {
      setLoading(false)
    }
  }

  const handlePhonePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()
    const pNumber = formatPhoneNumber(phonePasswordNumber)
    if (!pNumber || !phonePasswordPassword.trim()) {
      setError(t('auth.error_username_password_required'))
      return
    }
    setLoading(true)
    try {
      const response = await loginBuyerPhone({
        phone_number: pNumber,
        password: phonePasswordPassword,
      })
      login(response.access_token, mapBuyerAuthResponseToUser(response))
      setSuccess(t('auth.login_success'))
      goHome()
    } catch (err) {
      setError(parseApiError(err, t('auth.error_username_password_wrong')))
    } finally {
      setLoading(false)
    }
  }

  const handleStartLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()
    const targetPhone = formatPhoneNumber(otpPhone)
    if (!targetPhone) {
      setError(t('auth.phone_required'))
      return
    }
    setLoading(true)
    try {
      const startRes = await startWAVerification({ phone_number: targetPhone })
      if (startRes.mock_mode && startRes.verify_token) {
        const response = await loginBuyerOtp({
          phone: targetPhone,
          verify_token: startRes.verify_token,
        })
        login(response.access_token, mapBuyerAuthResponseToUser(response))
        setSuccess(t('auth.login_success'))
        goHome()
        return
      }
      setWaNonce(startRes.nonce)
      setWaDeeplink(startRes.deeplink)
      setMode('wa-verification-pending')
      startStatusPolling(startRes.nonce, targetPhone)
    } catch (err) {
      setError(parseApiError(err, t('auth.error_generic')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffaf5] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center flex flex-col items-center">
          <Link to={ROUTES.HOME} className="inline-block mb-6">
            <img src={LOGO_URL} alt="Toti Cakery" className="mx-auto w-48 sm:w-60 h-auto max-w-full object-contain" />
          </Link>
          <h1 className="text-2xl font-black text-[#4b2417]">{t('auth.buyer_login_title')}</h1>
          <p className="mt-1 text-sm text-[#6f5448]">{t('auth.buyer_login_subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {mode !== 'wa-verification-pending' && (
          <div className="mb-6 grid grid-cols-3 gap-2">
            <MethodButton
              icon={<Mail className="mx-auto mb-1 h-5 w-5" />}
              label={t('auth.method_email')}
              active={mode === 'login-email'}
              onClick={() => { setMode('login-email'); resetMessage(); }}
            />
            <MethodButton
              icon={<Phone className="mx-auto mb-1 h-5 w-5" />}
              label={t('auth.method_phone')}
              active={mode === 'login-phone-password'}
              onClick={() => { setMode('login-phone-password'); resetMessage(); }}
            />
            <MethodButton
              icon={<MessageCircle className="mx-auto mb-1 h-5 w-5" />}
              label={t('auth.method_whatsapp')}
              active={mode === 'login-phone-otp'}
              onClick={() => { setMode('login-phone-otp'); resetMessage(); }}
            />
          </div>
        )}

        {mode === 'login-email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={t('auth.email_placeholder')}
                className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
                required
              />
            </div>
            <PasswordInput
              value={loginPassword}
              onChange={setLoginPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              placeholder={t('auth.password_placeholder')}
            />
            <SubmitButton loading={loading} label={t('auth.login_btn')} />
            <div className="text-center mt-3">
              <Link to={ROUTES.AUTH_BUYER_FORGOT_PASSWORD} className="text-sm font-semibold text-[#d85b30] hover:underline">
                {t('auth.forgot_password')}
              </Link>
            </div>
          </form>
        )}

        {mode === 'login-phone-password' && (
          <form onSubmit={handlePhonePasswordLogin} className="space-y-4">
            <InternationalPhoneInput
              value={phonePasswordNumber}
              onChange={setPhonePasswordNumber}
              placeholder={t('auth.phone_placeholder')}
              required
            />
            <PasswordInput
              value={phonePasswordPassword}
              onChange={setPhonePasswordPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              placeholder={t('auth.password_placeholder')}
            />
            <SubmitButton loading={loading} label={t('auth.login_btn')} />
            <div className="text-center mt-3">
              <Link to={ROUTES.AUTH_BUYER_FORGOT_PASSWORD} className="text-sm font-semibold text-[#d85b30] hover:underline">
                {t('auth.forgot_password')}
              </Link>
            </div>
          </form>
        )}

        {mode === 'login-phone-otp' && (
          <form onSubmit={handleStartLoginOtp} className="space-y-4">
            <InternationalPhoneInput
              value={otpPhone}
              onChange={setOtpPhone}
              placeholder={t('auth.phone_placeholder')}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#25D366] text-sm font-black text-white hover:bg-[#20bd5a] disabled:opacity-60 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t('auth.verify_wa_btn')}
                </>
              )}
            </button>
          </form>
        )}

        {mode === 'wa-verification-pending' && (
          <div className="text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f9ee]">
              <MessageCircle className="h-8 w-8 text-[#25D366]" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#6f5448]">{t('auth.wa_instruction')}</p>
              {waNonce && (
                <p className="text-xs text-gray-500 font-mono">
                  {t('auth.wa_verification_code')} <span className="font-bold">{waNonce}</span>
                </p>
              )}
            </div>
            {waDeeplink && (
              <a
                href={waDeeplink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#25D366] text-sm font-bold text-white shadow hover:bg-[#20bd5a] transition"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {t('auth.open_wa_btn')}
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            )}
            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#fff7f0] border border-[#ead8ca] py-3 text-xs text-[#8b7166]">
              <Loader2 className="h-4 w-4 animate-spin text-[#d85b30]" />
              <span>{t('auth.wa_waiting')}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopPolling()
                setMode('login-phone-otp')
              }}
              className="w-full text-sm font-semibold text-[#d85b30] hover:underline"
            >
              {t('auth.cancel')}
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-[#6f5448]">
          {t('auth.no_account')}{' '}
          <Link to={ROUTES.AUTH_BUYER_REGISTER} className="font-bold text-[#d85b30] hover:underline">
            {t('auth.register_btn')}
          </Link>
        </div>

        <div className="mt-6 border-t border-[#ead8ca] pt-6 text-center text-sm text-[#6f5448]">
          <Link to={ROUTES.HOME} className="font-medium text-[#8b7166] hover:text-[#4b2417]">
            {t('auth.back_to_home', 'Kembali ke Beranda')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function MethodButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-1 py-2 text-xs font-bold transition ${
        active
          ? 'bg-[#d85b30] text-white shadow'
          : 'bg-[#fff7f0] text-[#8b7166] hover:bg-[#ffeadb] hover:text-[#4b2417]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function PasswordInput({
  value,
  onChange,
  showPassword,
  setShowPassword,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean | ((prev: boolean) => boolean)) => void
  placeholder: string
}) {
  return (
    <div>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-12 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30]"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166]"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function SubmitButton({ loading, label }: { loading: boolean, label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  )
}
