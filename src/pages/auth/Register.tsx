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
  User as UserIcon,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES, LOGO_URL } from '@/constants'
import {
  registerBuyer,
  startWAVerification,
  getWAVerificationStatus,
  mapBuyerAuthResponseToUser,
} from '@/api/auth'
import { InternationalPhoneInput } from '@/components/common/PhoneInput'
import { formatPhoneNumber } from '@/utils/phone'
import { LanguageToggle } from '@/components/common/Languagetoggle'
import type { TFunction } from 'i18next'

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

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user } = useAuth()
  const { t } = useTranslation()

  const rawFrom = (location.state as { from?: string | { pathname?: string } } | null)?.from
  const redirectTarget =
    typeof rawFrom === 'string'
      ? rawFrom
      : rawFrom?.pathname || ROUTES.HOME

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // WA Verification State
  const [waMode, setWaMode] = useState(false)
  const [waNonce, setWaNonce] = useState<string | null>(null)
  const [waDeeplink, setWaDeeplink] = useState<string>('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const [isRedirecting, setIsRedirecting] = useState(false)
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    pollIntervalRef.current = null
    pollTimeoutRef.current = null
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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

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

  const startStatusPolling = (nonce: string, regData: { name: string; email: string; phone: string; password: string }) => {
    stopPolling()

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling()
      const expiredMsg = t('auth.wa_expired')
      setError(expiredMsg)
      toast.error(expiredMsg)
      setWaMode(false)
    }, 300000)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getWAVerificationStatus(nonce)
        if (res.status === 'verified' && res.verify_token) {
          stopPolling()
          setLoading(true)
          try {
            const response = await registerBuyer({
              name: regData.name,
              email: regData.email,
              phone: regData.phone,
              password: regData.password,
              verify_token: res.verify_token,
            })
            login(response.access_token, mapBuyerAuthResponseToUser(response))
            const successMsg = t('auth.register_success')
            setSuccess(successMsg)
            toast.success(successMsg)
            goTarget()
          } catch (err: unknown) {
            const parsed = parseApiError(err, t('auth.error_generic'), t)
            setError(parsed)
            toast.error(parsed)
            setWaMode(false)
          } finally {
            setLoading(false)
          }
        } else if (res.status === 'expired' || res.status === 'failed') {
          stopPolling()
          const expiredMsg = t('auth.wa_expired')
          setError(expiredMsg)
          toast.error(expiredMsg)
          setWaMode(false)
        }
      } catch {
        // Continue polling
      }
    }, 3000)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    resetMessage()

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = formatPhoneNumber(phone)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!trimmedName) {
      const msg = t('auth.name_required', 'Nama lengkap wajib diisi')
      setError(msg)
      toast.error(msg)
      return
    }

    if (!trimmedEmail) {
      const msg = t('auth.email_required', 'Email wajib diisi')
      setError(msg)
      toast.error(msg)
      return
    }

    if (!emailRegex.test(trimmedEmail)) {
      const msg = t('auth.invalid_email', 'Format email tidak valid.')
      setError(msg)
      toast.error(msg)
      return
    }

    if (!trimmedPhone) {
      const msg = t('auth.phone_required', 'Nomor HP wajib diisi')
      setError(msg)
      toast.error(msg)
      return
    }

    if (trimmedPhone.length < 10 || trimmedPhone.length > 15) {
      const msg = t('auth.invalid_phone', 'Nomor HP harus antara 10 hingga 15 digit.')
      setError(msg)
      toast.error(msg)
      return
    }

    if (!password || password.length < 8) {
      const msg = t('auth.error_password_length', 'Password minimal 8 karakter')
      setError(msg)
      toast.error(msg)
      return
    }

    if (password !== confirmPassword) {
      const msg = t('auth.error_password_match', 'Konfirmasi password tidak cocok')
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      const startRes = await startWAVerification({ phone_number: trimmedPhone })
      const regData = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: password,
      }

      if (startRes.mock_mode && startRes.verify_token) {
        const response = await registerBuyer({
          ...regData,
          verify_token: startRes.verify_token,
        })
        login(response.access_token, mapBuyerAuthResponseToUser(response))
        const successMsg = t('auth.register_success')
        setSuccess(successMsg)
        toast.success(successMsg)
        goTarget()
        return
      }

      setWaNonce(startRes.nonce)
      setWaDeeplink(startRes.deeplink)
      setResendCooldown(60)
      setWaMode(true)
      startStatusPolling(startRes.nonce, regData)
    } catch (err: unknown) {
      const parsed = parseApiError(err, t('auth.error_generic'), t)
      setError(parsed)
      toast.error(parsed)
    } finally {
      setLoading(false)
    }
  }

  const handleResendWa = async () => {
    if (resendCooldown > 0 || loading) return
    resetMessage()
    setLoading(true)
    const trimmedPhone = formatPhoneNumber(phone)
    try {
      const startRes = await startWAVerification({ phone_number: trimmedPhone })
      const regData = {
        name: name.trim(),
        email: email.trim(),
        phone: trimmedPhone,
        password: password,
      }
      if (startRes.mock_mode && startRes.verify_token) {
        const response = await registerBuyer({
          ...regData,
          verify_token: startRes.verify_token,
        })
        login(response.access_token, mapBuyerAuthResponseToUser(response))
        const successMsg = t('auth.register_success')
        setSuccess(successMsg)
        toast.success(successMsg)
        goTarget()
        return
      }
      setWaNonce(startRes.nonce)
      setWaDeeplink(startRes.deeplink)
      setResendCooldown(60)
      startStatusPolling(startRes.nonce, regData)
      toast.success(t('auth.otp_sent', 'Link verifikasi WhatsApp baru telah dikirimkan.'))
    } catch (err: unknown) {
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
            onClick={() => {
              if (waMode) {
                stopPolling()
                setWaMode(false)
              } else {
                navigate(ROUTES.HOME)
              }
            }}
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
          <h1 className="text-2xl font-black text-[#4b2417]">{t('auth.buyer_register_title')}</h1>
          <p className="mt-1 text-sm text-[#6f5448]">{t('auth.buyer_register_subtitle')}</p>
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

        {!waMode ? (
          <form onSubmit={handleRegister} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                {t('auth.full_name', 'Nama Lengkap')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type="text"
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.name_placeholder')}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                {t('auth.email_label', 'Email / Username')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type="email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <InternationalPhoneInput
              label={t('auth.whatsapp_number', 'Nomor WhatsApp')}
              required
              value={phone}
              disabled={loading}
              onChange={setPhone}
              placeholder={t('auth.phone_placeholder')}
            />

            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                {t('auth.password_label', 'Password')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_min_length')}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-12 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166] disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#4b2417] mb-1">
                {t('auth.confirm_password', 'Konfirmasi Password')} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7166]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirm_password_placeholder')}
                  className="w-full rounded-xl border border-[#d0bfaf] py-3 pl-11 pr-12 text-sm outline-none focus:border-[#d85b30] focus:ring-1 focus:ring-[#d85b30] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7166] disabled:opacity-50"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white hover:bg-[#c04e28] disabled:opacity-60 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.register_btn')}
            </button>
          </form>
        ) : (
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

            <div className="text-center text-xs text-[#6f5448]">
              {resendCooldown > 0 ? (
                <span className="text-[#8b7166]">
                  {t('auth.resend_in', 'Kirim ulang dalam')}{' '}
                  <span className="font-bold text-[#d85b30]">{resendCooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendWa}
                  className="font-bold text-[#d85b30] hover:underline disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('auth.sending', 'Mengirim...')}
                    </span>
                  ) : (
                    t('auth.resend_wa_link', 'Kirim Ulang Link WhatsApp')
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                stopPolling()
                setWaMode(false)
              }}
              className="w-full text-sm font-semibold text-[#d85b30] hover:underline"
            >
              {t('auth.cancel')}
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-[#6f5448]">
          {t('auth.has_account')}{' '}
          <Link
            to={ROUTES.AUTH_BUYER}
            state={location.state}
            className="font-bold text-[#d85b30] hover:underline"
          >
            {t('auth.login_btn')}
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
