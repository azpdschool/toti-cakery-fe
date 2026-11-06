import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
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
import { LanguageToggle } from '@/components/common/Languagetoggle'
import type { TFunction } from 'i18next'

type Mode =
  | 'login-email'
  | 'login-phone-password'
  | 'login-phone-otp'
  | 'wa-verification-pending'

function parseApiError(
  error: unknown,
  fallback: string,
  t: TFunction,
): string {
  if (error && typeof error === 'object') {
    const axiosErr = error as {
      code?: string
      message?: string
      response?: {
        data?: { detail?: unknown; message?: string }
        status?: number
      }
    }

    if (
      axiosErr.code === 'ERR_NETWORK' ||
      (!axiosErr.response && axiosErr.message?.toLowerCase().includes('network'))
    ) {
      return t(
        'auth.network_error',
        'Gagal terhubung ke server. Periksa koneksi internet Anda.',
      )
    }

    if (axiosErr.response) {
      const detail = axiosErr.response.data?.detail
      const status = axiosErr.response.status

      if (typeof detail === 'string') return detail
      if (Array.isArray(detail)) {
        return detail
          .map((item: { msg?: string }) => item?.msg)
          .filter(Boolean)
          .join(', ')
      }

      if (status === 401) return t('auth.invalid_credentials', 'Kredensial login tidak valid')
      if (status === 404) return t('auth.buyer_not_found', 'Akun pembeli tidak ditemukan')
      if (status === 409) return t('auth.already_registered', 'Nomor HP atau email sudah terdaftar')
      if (status === 429) return t('auth.too_many_attempts', 'Terlalu banyak percobaan verifikasi')
      if (status === 400) return t('auth.invalid_request', 'Data request tidak valid')
      if (status && status >= 500) return t('auth.server_error', 'Terjadi kesalahan pada server. Silakan coba lagi nanti.')
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export default function BuyerLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user } = useAuth()
  const { t } = useTranslation()

  const rawFrom = (location.state as { from?: string | { pathname?: string } } | null)?.from
  const redirectTarget =
    typeof rawFrom === 'string'
      ? rawFrom
      : rawFrom?.pathname || ROUTES.HOME

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

  const [isRedirecting, setIsRedirecting] = useState(false)
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)
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
    return () => {
      stopPolling()
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [])

  // Redirect already authenticated buyers
  useEffect(() => {
    if (isAuthenticated && user?.role === 'buyer' && !isRedirecting) {
      navigate(redirectTarget, { replace: true })
    }
  }, [isAuthenticated, user?.role, redirectTarget, isRedirecting, navigate])

  const resetMessage = () => {
    setError(null)
    setSuccess(null)
  }

  const goTarget = () => {
    setIsRedirecting(true)
    redirectTimerRef.current = setTimeout(() => {
      navigate(redirectTarget, { replace: true })
    }, 1000)
  }

  const startStatusPolling = (nonce: string, loginPhoneStr: string) => {
    stopPolling()
    setIsPolling(true)

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling()
      const expiredMsg = t('auth.wa_expired')
      setError(expiredMsg)
      toast.error(expiredMsg)
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
            const successMsg = t('auth.login_success')
            setSuccess(successMsg)
            toast.success(successMsg)
            goTarget()
          } catch (err) {
            const parsed = parseApiError(err, t('auth.error_generic'), t)
            setError(parsed)
            toast.error(parsed)
            setMode('login-phone-otp')
          } finally {
            setLoading(false)
          }
        } else if (res.status === 'expired' || res.status === 'failed') {
          stopPolling()
          const expiredMsg = t('auth.wa_expired')
          setError(expiredMsg)
          toast.error(expiredMsg)
          setMode('login-phone-otp')
        }
      } catch {
        // Continue polling on error
      }
    }, 3000)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()
    if (!loginEmail.trim() || !loginPassword.trim()) {
      const msg = t('auth.error_username_password_required')
      setError(msg)
      toast.error(msg)
      return
    }
    setLoading(true)
    try {
      const response = await loginBuyer({
        email: loginEmail,
        password: loginPassword,
      })
      login(response.access_token, mapBuyerAuthResponseToUser(response))
      const successMsg = t('auth.login_success')
      setSuccess(successMsg)
      toast.success(successMsg)
      goTarget()
    } catch (err) {
      const parsed = parseApiError(err, t('auth.error_username_password_wrong'), t)
      setError(parsed)
      toast.error(parsed)
    } finally {
      setLoading(false)
    }
  }

  const handlePhonePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()
    const pNumber = formatPhoneNumber(phonePasswordNumber)
    if (!pNumber || !phonePasswordPassword.trim()) {
      const msg = t('auth.error_username_password_required')
      setError(msg)
      toast.error(msg)
      return
    }
    setLoading(true)
    try {
      const response = await loginBuyerPhone({
        phone_number: pNumber,
        password: phonePasswordPassword,
      })
      login(response.access_token, mapBuyerAuthResponseToUser(response))
      const successMsg = t('auth.login_success')
      setSuccess(successMsg)
      toast.success(successMsg)
      goTarget()
    } catch (err) {
      const parsed = parseApiError(err, t('auth.error_username_password_wrong'), t)
      setError(parsed)
      toast.error(parsed)
    } finally {
      setLoading(false)
    }
  }

  const handleStartLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()
    const targetPhone = formatPhoneNumber(otpPhone)
    if (!targetPhone) {
      const msg = t('auth.phone_required')
      setError(msg)
      toast.error(msg)
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
        const successMsg = t('auth.login_success')
        setSuccess(successMsg)
        toast.success(successMsg)
        goTarget()
        return
      }
      setWaNonce(startRes.nonce)
      setWaDeeplink(startRes.deeplink)
      setMode('wa-verification-pending')
      startStatusPolling(startRes.nonce, targetPhone)
    } catch (err) {
      const parsed = parseApiError(err, t('auth.error_generic'), t)
      setError(parsed)
      toast.error(parsed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffaf5] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-6 shadow-sm sm:p-8">
        <div className="relative mb-6 text-center flex flex-col items-center">
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="absolute left-0 top-0 flex items-center text-sm font-bold text-[#8b7166] hover:text-[#d85b30] transition"
          >
            <ChevronLeft className="mr-1 h-5 w-5" />
            {t('auth.cancel', 'Batal')}
          </button>

          <div className="absolute right-0 top-0">
            <LanguageToggle />
          </div>

          <Link to={ROUTES.HOME} className="inline-block mt-8 mb-6">
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
              disabled={loading}
              onClick={() => { setMode('login-email'); resetMessage(); }}
            />
            <MethodButton
              icon={<Phone className="mx-auto mb-1 h-5 w-5" />}
              label={t('auth.method_phone')}
              active={mode === 'login-phone-password'}
              disabled={loading}
              onClick={() => { setMode('login-phone-password'); resetMessage(); }}
            />
            <MethodButton
              icon={<MessageCircle className="mx-auto mb-1 h-5 w-5" />}
              label={t('auth.method_whatsapp')}
              active={mode === 'login-phone-otp'}
              disabled={loading}
              onClick={() => { setMode('login-phone-otp'); resetMessage(); }}
            />
          </div>
        )}

        {mode === 'login-email' && (
          <form onSubmit={handleEmailLogin} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                {t('auth.email_label', 'Email / Username')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type="email"
                  disabled={loading}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                {t('auth.password_label', 'Password')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <PasswordInput
                value={loginPassword}
                disabled={loading}
                onChange={setLoginPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                placeholder={t('auth.password_placeholder')}
              />
            </div>
            <SubmitButton loading={loading} label={t('auth.login_btn')} />
            <div className="text-center mt-3">
              <Link
                to={
                  loginEmail
                    ? `${ROUTES.AUTH_BUYER_FORGOT_PASSWORD}?email=${encodeURIComponent(loginEmail)}`
                    : ROUTES.AUTH_BUYER_FORGOT_PASSWORD
                }
                state={{ email: loginEmail, from: redirectTarget }}
                className="text-sm font-semibold text-[#d85b30] hover:underline"
              >
                {t('auth.forgot_password')}
              </Link>
            </div>
          </form>
        )}

        {mode === 'login-phone-password' && (
          <form onSubmit={handlePhonePasswordLogin} noValidate className="space-y-4">
            <InternationalPhoneInput
              label={t('auth.whatsapp_number', 'Nomor WhatsApp')}
              required
              value={phonePasswordNumber}
              disabled={loading}
              onChange={setPhonePasswordNumber}
              placeholder={t('auth.phone_placeholder')}
            />
            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                {t('auth.password_label', 'Password')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <PasswordInput
                value={phonePasswordPassword}
                disabled={loading}
                onChange={setPhonePasswordPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                placeholder={t('auth.password_placeholder')}
              />
            </div>
            <SubmitButton loading={loading} label={t('auth.login_btn')} />
            <div className="text-center mt-3">
              <Link
                to={ROUTES.AUTH_BUYER_FORGOT_PASSWORD}
                state={{ from: redirectTarget }}
                className="text-sm font-semibold text-[#d85b30] hover:underline"
              >
                {t('auth.forgot_password')}
              </Link>
            </div>
          </form>
        )}

        {mode === 'login-phone-otp' && (
          <form onSubmit={handleStartLoginOtp} noValidate className="space-y-4">
            <InternationalPhoneInput
              label={t('auth.whatsapp_number', 'Nomor WhatsApp')}
              required
              value={otpPhone}
              disabled={loading}
              onChange={setOtpPhone}
              placeholder={t('auth.phone_placeholder')}
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
          <Link
            to={ROUTES.AUTH_BUYER_REGISTER}
            state={location.state}
            className="font-bold text-[#d85b30] hover:underline"
          >
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

function MethodButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-full min-h-[58px] flex flex-col items-center justify-center text-center leading-tight rounded-xl px-1.5 sm:px-2 py-2 text-[11px] sm:text-xs font-bold transition disabled:opacity-60 disabled:cursor-not-allowed ${
        active
          ? 'bg-[#d85b30] text-white shadow'
          : 'bg-[#fff7f0] text-[#8b7166] hover:bg-[#ffeadb] hover:text-[#4b2417]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function PasswordInput({
  value,
  onChange,
  showPassword,
  setShowPassword,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean | ((prev: boolean) => boolean)) => void
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-12 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30] disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166] disabled:opacity-50"
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
